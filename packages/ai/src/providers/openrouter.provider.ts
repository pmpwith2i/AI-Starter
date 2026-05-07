import { OpenRouter } from "@openrouter/sdk";
import type {
  ChatResponse,
  LlmProvider,
  OnRetryInfo,
  RetryConfig,
  StreamChunk,
} from "../agents/ai.agent.types.js";

interface OpenRouterConfig {
  apiKey: string;
  appUrl?: string;
  appName?: string;
  retry?: RetryConfig;
}

type ORSend = InstanceType<typeof OpenRouter>["chat"]["send"];
type ORMessages = Parameters<ORSend>[0]["chatGenerationParams"]["messages"];
type ORTools = Parameters<ORSend>[0]["chatGenerationParams"]["tools"];

const DEFAULT_RETRY: Required<RetryConfig> = {
  maxRetries429: 3,
  maxRetries5xx: 2,
  maxRetriesConnection: 1,
};

/** Classify an error and return how many retries are allowed + reason string. */
const classifyError = (
  err: unknown,
  retryConfig: Required<RetryConfig>,
): { maxAttempts: number; reason: string; errorCode?: number } => {
  if (err instanceof Error && "status" in err) {
    const status = (err as Error & { status: number }).status;
    if (status === 429) {
      return {
        maxAttempts: retryConfig.maxRetries429,
        reason: "rate_limit",
        errorCode: 429,
      };
    }
    if (status >= 500) {
      return {
        maxAttempts: retryConfig.maxRetries5xx,
        reason: "server_error",
        errorCode: status,
      };
    }
    // 4xx (except 429) — no retry
    return { maxAttempts: 0, reason: "client_error", errorCode: status };
  }

  // Connection/network errors (no status property)
  if (
    err instanceof Error &&
    ("code" in err ||
      err.message.includes("fetch") ||
      err.message.includes("ECONNREFUSED") ||
      err.message.includes("ETIMEDOUT"))
  ) {
    return {
      maxAttempts: retryConfig.maxRetriesConnection,
      reason: "connection_error",
    };
  }

  return { maxAttempts: 0, reason: "unknown_error" };
};

/** Exponential backoff: baseMs * 2^attempt (429 starts at 1s, others at 2s). */
const getBackoffMs = (attempt: number, reason: string): number => {
  const baseMs = reason === "rate_limit" ? 1000 : 2000;
  return baseMs * Math.pow(2, attempt);
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Execute an async fn with differentiated retry logic. */
async function withRetry<T>(
  fn: () => Promise<T>,
  retryConfig: Required<RetryConfig>,
  onRetry?: (info: OnRetryInfo) => void,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const { maxAttempts, reason, errorCode } = classifyError(
        err,
        retryConfig,
      );

      if (attempt >= maxAttempts) break;

      const delayMs = getBackoffMs(attempt, reason);
      onRetry?.({
        attempt: attempt + 1,
        maxAttempts,
        reason,
        delayMs,
        errorCode,
      });

      await sleep(delayMs);
    }
  }

  throw lastError;
}

export const createOpenRouterProvider = (
  config: OpenRouterConfig,
): LlmProvider => {
  const client = new OpenRouter({ apiKey: config.apiKey });
  const retryConfig: Required<RetryConfig> = {
    ...DEFAULT_RETRY,
    ...config.retry,
  };

  const headers: { httpReferer?: string; xTitle?: string } = {};
  if (config.appUrl) headers.httpReferer = config.appUrl;
  if (config.appName) headers.xTitle = config.appName;

  return {
    async chat(opts): Promise<ChatResponse> {
      const res = await withRetry(
        () =>
          client.chat.send({
            ...headers,
            chatGenerationParams: {
              model: opts.model,
              messages: opts.messages as unknown as ORMessages,
              stream: false as const,
              ...(opts.responseFormat
                ? {
                    responseFormat:
                      opts.responseFormat as unknown as Parameters<ORSend>[0]["chatGenerationParams"]["responseFormat"],
                  }
                : {}),
            },
          }),
        retryConfig,
        opts.onRetry,
      );

      const msg = (
        res as {
          choices: { message: { content?: string | null } }[];
          usage?: { promptTokens?: number; completionTokens?: number };
        }
      ).choices[0]?.message;

      return {
        content: msg?.content ?? "",
        usage: (
          res as {
            usage?: { promptTokens?: number; completionTokens?: number };
          }
        ).usage
          ? {
              promptTokens: (
                res as {
                  usage: { promptTokens?: number; completionTokens?: number };
                }
              ).usage.promptTokens,
              completionTokens: (
                res as {
                  usage: { promptTokens?: number; completionTokens?: number };
                }
              ).usage.completionTokens,
            }
          : undefined,
      };
    },

    async *chatStream(opts) {
      const res = await withRetry(
        () =>
          client.chat.send({
            ...headers,
            chatGenerationParams: {
              model: opts.model,
              messages: opts.messages as unknown as ORMessages,
              tools: opts.tools as unknown as ORTools,
              stream: true as const,
              streamOptions: { includeUsage: true },
              parallelToolCalls: true,
            },
          }),
        retryConfig,
        opts.onRetry,
      );

      for await (const value of res) {
        yield {
          choices: value.choices.map((c) => ({
            delta: {
              content: c.delta.content ?? undefined,
              reasoning: c.delta.reasoning ?? undefined,
              toolCalls: c.delta.toolCalls as StreamChunk["choices"] extends
                | (infer C)[]
                | undefined
                ? C extends { delta?: { toolCalls?: infer T } }
                  ? T
                  : undefined
                : undefined,
            },
            finishReason: c.finishReason ?? null,
          })),
          usage: value.usage
            ? {
                promptTokens: value.usage.promptTokens,
                completionTokens: value.usage.completionTokens,
              }
            : undefined,
        };
      }
    },
  };
};
