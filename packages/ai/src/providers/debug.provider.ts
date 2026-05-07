import { startActiveObservation } from "@langfuse/tracing";

import type {
  ChatMessage,
  LlmProvider,
  StreamChunk,
} from "../agents/ai.agent.types.js";

/**
 * Decorator-style LLM provider that pipes every interaction into Langfuse
 * as a `generation` observation. Wraps any underlying `LlmProvider` and
 * forwards calls verbatim — no behavioral change, only observability.
 *
 * The caller is responsible for initialising the Langfuse OTel SDK once at
 * process start (see `apps/server/src/lib/langfuse.ts`). When the SDK is
 * not initialised, observations become no-ops and the provider still works.
 *
 * If the wrapped call runs inside an active OTel context — e.g. a parent
 * `startActiveObservation("generate-meal", …, { asType: "chain" })` — the
 * generation automatically nests under that parent, giving a meal-level
 * trace with one child generation per LLM call (food-selection, weekly
 * review, retries, etc.).
 */

export interface DebugLlmEvent {
  /** Total wall-clock duration in milliseconds. */
  durationMs: number;
  /** Monotonically increasing per provider instance. */
  callIndex: number;
  /** "chat" or "chatStream" — which method was invoked. */
  method: "chat" | "chatStream";
  model: string;
  messageCount: number;
  /** Characters of assistant text returned (non-stream) or accumulated (stream). */
  responseLength?: number;
  /** Characters of reasoning tokens accumulated (stream only, reasoning models). */
  reasoningLength?: number;
  /** Number of stream chunks observed (chatStream only). */
  streamChunkCount?: number;
  /** Prompt tokens reported by the upstream provider. */
  inputTokens?: number;
  /** Completion tokens reported by the upstream provider. */
  outputTokens?: number;
  /** Set if the call threw — captures `Error.message` and class name. */
  error?: { name: string; message: string };
}

export interface DebugLlmOptions {
  /**
   * Optional mirror callback. Fires once per chat/chatStream call after the
   * underlying provider resolves (or throws). Use it to bridge to Pino,
   * metrics, or any other sink — Langfuse already gets the full payload.
   */
  onEvent?: (event: DebugLlmEvent) => void;
  /**
   * Field names to recursively redact from the messages and response BEFORE
   * they are sent to Langfuse. Matches keys at any depth. The original
   * messages passed to the underlying provider are never mutated.
   */
  redactPaths?: readonly string[];
  /**
   * Observation name shown in the Langfuse UI. Defaults to "llm".
   */
  observationName?: string;
}

const REDACTED = "[REDACTED]";

/** Filter undefined entries — Langfuse's `usageDetails` rejects them. */
const buildUsageDetails = (
  input: number | undefined,
  output: number | undefined,
): Record<string, number> | undefined => {
  const out: Record<string, number> = {};
  if (input !== undefined) out.input = input;
  if (output !== undefined) out.output = output;
  return Object.keys(out).length > 0 ? out : undefined;
};

const redactDeep = (
  value: unknown,
  redactKeys: ReadonlySet<string>,
): unknown => {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redactDeep(v, redactKeys));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = redactKeys.has(k) ? REDACTED : redactDeep(v, redactKeys);
  }
  return out;
};

export const createDebugLlmProvider = (
  inner: LlmProvider,
  options: DebugLlmOptions = {},
): LlmProvider => {
  const redactSet = new Set(options.redactPaths ?? []);
  const observationName = options.observationName ?? "llm";
  let callIndex = 0;

  const buildSafeMessages = (messages: ChatMessage[]): ChatMessage[] =>
    redactDeep(messages, redactSet) as ChatMessage[];

  return {
    async chat(opts) {
      const idx = ++callIndex;
      const t0 = Date.now();
      const safeMessages = buildSafeMessages(opts.messages);

      return startActiveObservation(
        observationName,
        async (generation) => {
          const metadata: Record<string, unknown> = { callIndex: idx };
          if (opts.responseFormat) {
            metadata.responseFormat = {
              type: opts.responseFormat.type,
              schemaName: opts.responseFormat.jsonSchema.name,
            };
          }
          generation.update({
            input: safeMessages,
            model: opts.model,
            metadata,
          });

          try {
            const response = await inner.chat(opts);
            const safeOutput = redactDeep(
              response.content,
              redactSet,
            ) as string;
            const usage = buildUsageDetails(
              response.usage?.promptTokens,
              response.usage?.completionTokens,
            );
            generation.update({
              output: safeOutput,
              ...(usage ? { usageDetails: usage } : {}),
            });
            options.onEvent?.({
              durationMs: Date.now() - t0,
              callIndex: idx,
              method: "chat",
              model: opts.model,
              messageCount: opts.messages.length,
              responseLength: response.content.length,
              inputTokens: response.usage?.promptTokens,
              outputTokens: response.usage?.completionTokens,
            });
            return response;
          } catch (err) {
            const e = err as Error;
            generation.update({
              level: "ERROR",
              statusMessage: e.message,
            });
            options.onEvent?.({
              durationMs: Date.now() - t0,
              callIndex: idx,
              method: "chat",
              model: opts.model,
              messageCount: opts.messages.length,
              error: { name: e.name, message: e.message },
            });
            throw err;
          }
        },
        { asType: "generation" },
      );
    },

    chatStream(opts) {
      const idx = ++callIndex;
      const t0 = Date.now();
      const safeMessages = buildSafeMessages(opts.messages);
      const upstream = inner.chatStream(opts);

      return {
        [Symbol.asyncIterator]() {
          // The entire stream lifetime must live inside one active
          // observation so that every yielded chunk nests under it. We
          // bridge the async generator `startActiveObservation(…)` API to
          // the AsyncIterable returned by `chatStream` by pausing the outer
          // iterator until the inner upstream produces a chunk (or ends).
          let resolve: ((chunk: IteratorResult<StreamChunk>) => void) | null =
            null;
          let reject: ((err: unknown) => void) | null = null;
          const pending: IteratorResult<StreamChunk>[] = [];
          let errored: unknown;
          let done = false;

          const push = (v: IteratorResult<StreamChunk>) => {
            if (resolve) {
              const r = resolve;
              resolve = null;
              reject = null;
              r(v);
            } else {
              pending.push(v);
            }
          };
          const fail = (err: unknown) => {
            if (reject) {
              const r = reject;
              resolve = null;
              reject = null;
              r(err);
            } else {
              errored = err;
            }
          };

          // Launch the wrapped consumption loop. The observation stays active
          // until the upstream iterator finishes (done) or throws.
          void startActiveObservation(
            observationName,
            async (generation) => {
              generation.update({
                input: safeMessages,
                model: opts.model,
                metadata: {
                  callIndex: idx,
                  toolCount: opts.tools?.length ?? 0,
                },
              });
              let streamChunkCount = 0;
              let streamedContent = "";
              let streamedReasoning = "";
              let inputTokens: number | undefined;
              let outputTokens: number | undefined;
              try {
                for await (const chunk of upstream) {
                  streamChunkCount++;
                  const choice = chunk.choices?.[0];
                  if (choice?.delta?.content) {
                    streamedContent += choice.delta.content;
                  }
                  if (choice?.delta?.reasoning) {
                    streamedReasoning += choice.delta.reasoning;
                  }
                  if (chunk.usage) {
                    if (chunk.usage.promptTokens !== undefined) {
                      inputTokens = chunk.usage.promptTokens;
                    }
                    if (chunk.usage.completionTokens !== undefined) {
                      outputTokens = chunk.usage.completionTokens;
                    }
                  }
                  push({ value: chunk, done: false });
                }
                const safeOutput = redactDeep(
                  streamedContent,
                  redactSet,
                ) as string;
                const usage = buildUsageDetails(inputTokens, outputTokens);
                generation.update({
                  output: safeOutput,
                  metadata: {
                    streamChunkCount,
                    reasoningLength: streamedReasoning.length,
                  },
                  ...(usage ? { usageDetails: usage } : {}),
                });
                options.onEvent?.({
                  durationMs: Date.now() - t0,
                  callIndex: idx,
                  method: "chatStream",
                  model: opts.model,
                  messageCount: opts.messages.length,
                  responseLength: streamedContent.length,
                  reasoningLength: streamedReasoning.length || undefined,
                  streamChunkCount,
                  inputTokens,
                  outputTokens,
                });
                done = true;
                push({
                  value: undefined as unknown as StreamChunk,
                  done: true,
                });
              } catch (err) {
                const e = err as Error;
                generation.update({
                  level: "ERROR",
                  statusMessage: e.message,
                  metadata: { streamChunkCount },
                });
                options.onEvent?.({
                  durationMs: Date.now() - t0,
                  callIndex: idx,
                  method: "chatStream",
                  model: opts.model,
                  messageCount: opts.messages.length,
                  responseLength: streamedContent.length || undefined,
                  streamChunkCount,
                  error: { name: e.name, message: e.message },
                });
                done = true;
                fail(err);
              }
            },
            { asType: "generation" },
          );

          return {
            async next(): Promise<IteratorResult<StreamChunk>> {
              if (pending.length > 0) return pending.shift()!;
              if (errored) {
                const err = errored;
                errored = undefined;
                throw err;
              }
              if (done) {
                return {
                  value: undefined as unknown as StreamChunk,
                  done: true,
                };
              }
              return new Promise<IteratorResult<StreamChunk>>((res, rej) => {
                resolve = res;
                reject = rej;
              });
            },
          };
        },
      };
    },
  };
};
