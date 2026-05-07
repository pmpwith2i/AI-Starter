import type {
  AgentConfig,
  AgentEvent,
  AgentLoopState,
  ChatMessage,
  OnRetryInfo,
  StreamChunk,
} from "./ai.agent.types.js";
import type { ToolDefinition } from "../tools/ai.tools.types.js";
import type { ResolvedTool } from "../tools/ai.default-tools.constants.js";
import { resolveTools } from "../tools/ai.default-tools.constants.js";
import { toLlmPayload } from "../llm-payload.js";

// GDPR barrier: tool results must be pseudonymised before they re-enter the
// LLM loop. This is the single chokepoint.
const serializeToolOutput = (output: unknown): string =>
  JSON.stringify(toLlmPayload(output));

const safeParseArgs = (raw: unknown): Record<string, unknown> => {
  try {
    return JSON.parse(String(raw));
  } catch {
    return {};
  }
};

/** Merge streamed tool-call deltas into an accumulator map. */
const mergeToolCallDeltas = (
  acc: Record<number, { id: string; name: string; arguments: string }>,
  chunk: StreamChunk,
): void => {
  for (const choice of chunk.choices ?? []) {
    for (const tc of choice.delta?.toolCalls ?? []) {
      const idx = tc.index ?? 0;
      const existing = acc[idx] ?? { id: "", name: "", arguments: "" };
      if (tc.id) existing.id = tc.id;
      if (tc.function?.name) existing.name = tc.function.name;
      if (tc.function?.arguments) existing.arguments += tc.function.arguments;
      acc[idx] = existing;
    }
  }
};

const buildDefaultContextAwareness = () => {
  const today = new Date();
  return `
  # Default Context Awareness
    - Today is ${today.toDateString()}. Current time is ${today.toLocaleTimeString()}.`;
};

/** Truncate a string to maxChars, appending "..." if truncated. */
const truncate = (str: string, maxChars: number): string =>
  str.length > maxChars ? str.slice(0, maxChars) + "..." : str;

// -- Tool orchestration --

interface PendingToolCall {
  id: string;
  name: string;
  arguments: string;
  tool: ResolvedTool | undefined;
}

/**
 * Partition tool calls into execution batches.
 * Consecutive read-only tools are grouped for parallel execution.
 * Non-read-only tools execute alone, sequentially.
 */
const partitionToolCalls = (calls: PendingToolCall[]): PendingToolCall[][] => {
  const batches: PendingToolCall[][] = [];
  let readOnlyBatch: PendingToolCall[] = [];

  for (const call of calls) {
    if (call.tool?.isReadOnly) {
      readOnlyBatch.push(call);
    } else {
      // Flush pending read-only batch
      if (readOnlyBatch.length > 0) {
        batches.push(readOnlyBatch);
        readOnlyBatch = [];
      }
      // Mutating tool runs alone
      batches.push([call]);
    }
  }

  // Flush remaining read-only batch
  if (readOnlyBatch.length > 0) {
    batches.push(readOnlyBatch);
  }

  return batches;
};

/**
 * Execute a batch of tool calls. If all are read-only, run in parallel (capped).
 * Otherwise the batch contains a single mutating tool — run it alone.
 */
async function* executeBatch(
  batch: PendingToolCall[],
  state: AgentLoopState,
  history: ChatMessage[],
  maxConcurrency: number,
): AsyncGenerator<AgentEvent> {
  const isParallel = batch.length > 1 && batch.every((c) => c.tool?.isReadOnly);

  if (isParallel) {
    // Execute in parallel, capped at maxConcurrency
    for (let i = 0; i < batch.length; i += maxConcurrency) {
      const chunk = batch.slice(i, i + maxConcurrency);

      // Emit tool_start for all in this chunk
      for (const call of chunk) {
        yield {
          type: "tool_start" as const,
          name: call.name,
          id: call.id,
          args: safeParseArgs(call.arguments),
        };
      }

      const results = await Promise.all(
        chunk.map(async (call) => {
          const maxChars = call.tool?.maxResultSizeChars ?? 2000;
          if (!call.tool) {
            return {
              call,
              resultStr: `Unknown tool: ${call.name}`,
              status: "error" as const,
            };
          }
          try {
            const output = await call.tool.handler(
              safeParseArgs(call.arguments),
            );
            return {
              call,
              resultStr: truncate(serializeToolOutput(output), maxChars),
              status: "success" as const,
            };
          } catch (err) {
            return {
              call,
              resultStr: err instanceof Error ? err.message : String(err),
              status: "error" as const,
            };
          }
        }),
      );

      for (const { call, resultStr, status } of results) {
        const content =
          status === "error" && !resultStr.startsWith("Unknown")
            ? `Error: ${resultStr}`
            : resultStr;
        history.push({ role: "tool", toolCallId: call.id, content });
        state.completedToolCalls++;

        yield {
          type: "tool_end" as const,
          name: call.name,
          id: call.id,
          result: resultStr,
          status,
        };
        yield { type: "state" as const, state: { ...state } };
      }
    }
  } else {
    // Sequential execution (single mutating tool or single read-only)
    for (const call of batch) {
      const args = safeParseArgs(call.arguments);
      yield { type: "tool_start" as const, name: call.name, id: call.id, args };

      const maxChars = call.tool?.maxResultSizeChars ?? 2000;

      if (!call.tool) {
        const msg = `Unknown tool: ${call.name}`;
        history.push({ role: "tool", toolCallId: call.id, content: msg });
        state.completedToolCalls++;
        yield {
          type: "tool_end" as const,
          name: call.name,
          id: call.id,
          result: msg,
          status: "error",
        };
        yield { type: "state" as const, state: { ...state } };
        continue;
      }

      try {
        const output = await call.tool.handler(args);
        const resultStr = truncate(serializeToolOutput(output), maxChars);
        history.push({ role: "tool", toolCallId: call.id, content: resultStr });
        state.completedToolCalls++;
        yield {
          type: "tool_end" as const,
          name: call.name,
          id: call.id,
          result: resultStr,
          status: "success",
        };
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        history.push({
          role: "tool",
          toolCallId: call.id,
          content: `Error: ${errMsg}`,
        });
        state.completedToolCalls++;
        yield {
          type: "tool_end" as const,
          name: call.name,
          id: call.id,
          result: errMsg,
          status: "error",
        };
      }
      yield { type: "state" as const, state: { ...state } };
    }
  }
}

// -- Main agent --

export const createAgent = (config: AgentConfig) => {
  const {
    llm,
    model,
    systemPrompt,
    tools = [],
    maxIterations = 10,
    maxToolConcurrency = 5,
    compactThreshold,
    onCompact,
  } = config;

  // Resolve tools into the enriched format with metadata
  const resolvedTools = resolveTools(tools);
  const definitions: ToolDefinition[] = resolvedTools.map((t) => t.definition);
  const toolsByName = new Map(
    resolvedTools.map((t) => [t.definition.function.name, t]),
  );

  return {
    async *run(userMessages: ChatMessage[]): AsyncGenerator<AgentEvent> {
      const history: ChatMessage[] = [];
      let fullContent = "";

      const state: AgentLoopState = {
        iteration: 0,
        maxIterations,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        messageCount: userMessages.length,
        pendingToolCalls: 0,
        completedToolCalls: 0,
        phase: "llm_call",
      };

      try {
        while (state.iteration++ <= maxIterations) {
          // -- State: start of iteration --
          state.phase = "llm_call";
          state.pendingToolCalls = 0;
          state.completedToolCalls = 0;
          yield { type: "state", state: { ...state } };

          // Build messages for this iteration
          const allMessages: ChatMessage[] = [
            { role: "system", content: systemPrompt },
            { role: "system", content: buildDefaultContextAwareness() },
            ...userMessages,
            ...history,
          ];

          // Wire retry events from provider into the generator
          const retryEvents: AgentEvent[] = [];
          const onRetry = (info: OnRetryInfo) => {
            retryEvents.push({
              type: "retry",
              attempt: info.attempt,
              maxAttempts: info.maxAttempts,
              reason: info.reason,
              delayMs: info.delayMs,
            });
          };

          const stream = llm.chatStream({
            model,
            messages: allMessages,
            tools: definitions.length > 0 ? definitions : undefined,
            onRetry,
          });

          // Flush any retry events that occurred during connection
          for (const re of retryEvents) yield re;
          retryEvents.length = 0;

          let iterContent = "";
          let finishReason: string | null = null;
          const toolCallsAcc: Record<
            number,
            { id: string; name: string; arguments: string }
          > = {};

          // Buffer content tokens — classification happens after iteration
          const contentBuffer: string[] = [];

          for await (const chunk of stream) {
            // Flush retry events accumulated during streaming
            for (const re of retryEvents) yield re;
            retryEvents.length = 0;

            const choice = chunk.choices?.[0];

            if (chunk.usage) {
              state.totalInputTokens += chunk.usage.promptTokens ?? 0;
              state.totalOutputTokens += chunk.usage.completionTokens ?? 0;
            }

            if (!choice) continue;

            // Reasoning tokens always emitted immediately
            if (choice.delta?.reasoning) {
              yield { type: "reasoning", content: choice.delta.reasoning };
            }

            // Buffer content — will be classified after iteration ends
            if (choice.delta?.content) {
              iterContent += choice.delta.content;
              contentBuffer.push(choice.delta.content);
            }

            if (choice.finishReason) finishReason = choice.finishReason;
            mergeToolCallDeltas(toolCallsAcc, chunk);
          }

          const toolCalls = Object.values(toolCallsAcc).filter((tc) => tc.name);

          const isFinalIteration =
            finishReason === "stop" || (iterContent && toolCalls.length === 0);

          // Emit buffered content: as "chunk" if final, as "reasoning" if intermediate
          for (const token of contentBuffer) {
            yield {
              type: isFinalIteration ? "chunk" : "reasoning",
              content: token,
            };
          }

          if (isFinalIteration) {
            fullContent += iterContent;
          }

          // Record assistant message in history
          history.push({
            role: "assistant",
            content: iterContent,
            toolCalls:
              toolCalls.length > 0
                ? toolCalls.map((tc) => ({
                    id: tc.id,
                    type: "function" as const,
                    function: { name: tc.name, arguments: tc.arguments },
                  }))
                : undefined,
          });
          state.messageCount = userMessages.length + history.length;

          if (isFinalIteration) break;

          // -- Tool execution phase --
          state.phase = "tool_execution";
          state.pendingToolCalls = toolCalls.length;
          state.completedToolCalls = 0;
          yield { type: "state", state: { ...state } };

          // Resolve tool calls to their metadata
          const pendingCalls: PendingToolCall[] = toolCalls.map((tc) => ({
            id: tc.id,
            name: tc.name,
            arguments: tc.arguments,
            tool: toolsByName.get(tc.name),
          }));

          // Partition into batches and execute with orchestration
          const batches = partitionToolCalls(pendingCalls);
          for (const batch of batches) {
            yield* executeBatch(batch, state, history, maxToolConcurrency);
          }

          state.messageCount = userMessages.length + history.length;

          // -- Compaction check --
          if (
            compactThreshold &&
            onCompact &&
            state.totalInputTokens > compactThreshold
          ) {
            state.phase = "compaction";
            yield { type: "state", state: { ...state } };

            const allCurrentMessages = [
              { role: "system" as const, content: systemPrompt },
              ...userMessages,
              ...history,
            ];

            const result = await onCompact(allCurrentMessages, { ...state });

            // Replace history with compacted messages (remove system + user prefix)
            history.length = 0;
            // The compacted messages may include a new structure — trust the callback
            const compactedUserMessages: ChatMessage[] = [];
            for (const msg of result.messages) {
              if (msg.role === "system") continue;
              // Keep user messages from the original set in userMessages
              // Push everything else to history
              history.push(msg);
            }

            // If summary provided, inject as system context
            if (result.summary) {
              userMessages.length = 0;
              userMessages.push(
                { role: "user", content: result.summary },
                ...compactedUserMessages,
              );
            }

            state.messageCount = userMessages.length + history.length;
            yield { type: "state", state: { ...state } };
          }
        }

        if (!fullContent) {
          fullContent =
            "I could not complete the task within the allowed steps.";
          yield { type: "chunk", content: fullContent };
        }

        state.phase = "done";
        yield { type: "state", state: { ...state } };
        yield {
          type: "done",
          content: fullContent,
          iterations: state.iteration,
          usage: {
            inputTokens: state.totalInputTokens,
            outputTokens: state.totalOutputTokens,
          },
        };
      } catch (err) {
        state.phase = "error";
        yield { type: "state", state: { ...state } };
        yield {
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        };
      }
    },
  };
};
