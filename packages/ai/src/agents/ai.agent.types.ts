import type { ToolDefinition, ToolMap } from "../tools/ai.tools.types.js";

// -- Chat message types --

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
  toolCallId?: string;
}

// -- LLM streaming types --

export interface StreamDelta {
  content?: string;
  reasoning?: string;
  toolCalls?: {
    index?: number;
    id?: string;
    function?: { name?: string; arguments?: string };
  }[];
}

export interface StreamChunk {
  choices?: { delta?: StreamDelta; finishReason?: string | null }[];
  usage?: { promptTokens?: number; completionTokens?: number };
}

// -- Structured output --

export interface ResponseFormat {
  type: "json_schema";
  jsonSchema: {
    name: string;
    strict?: boolean;
    schema: Record<string, unknown>;
  };
}

export interface ChatResponse {
  content: string;
  usage?: { promptTokens?: number; completionTokens?: number };
}

// -- Retry --

export interface RetryConfig {
  /** Max retries on 429 (rate limit). Default: 3 */
  maxRetries429?: number;
  /** Max retries on 5xx (server error). Default: 2 */
  maxRetries5xx?: number;
  /** Max retries on connection/network error. Default: 1 */
  maxRetriesConnection?: number;
}

export interface OnRetryInfo {
  attempt: number;
  maxAttempts: number;
  reason: string;
  delayMs: number;
  errorCode?: number;
}

// -- LLM provider interface --

export interface LlmProvider {
  chatStream(opts: {
    model: string;
    messages: ChatMessage[];
    tools?: ToolDefinition[];
    onRetry?: (info: OnRetryInfo) => void;
  }): AsyncIterable<StreamChunk>;

  /** Non-streaming completion with optional structured output. */
  chat(opts: {
    model: string;
    messages: ChatMessage[];
    responseFormat?: ResponseFormat;
    onRetry?: (info: OnRetryInfo) => void;
  }): Promise<ChatResponse>;
}

// -- Agent loop state (public, inspectable by callers) --

export type AgentPhase =
  | "llm_call"
  | "tool_execution"
  | "compaction"
  | "done"
  | "error";

export interface AgentLoopState {
  iteration: number;
  maxIterations: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  messageCount: number;
  pendingToolCalls: number;
  completedToolCalls: number;
  phase: AgentPhase;
}

// -- Agent config --

export interface AgentConfig {
  llm: LlmProvider;
  model: string;
  systemPrompt: string;
  tools?: ToolMap[];
  maxIterations?: number;
  /** Max concurrent read-only tool executions. Default: 5 */
  maxToolConcurrency?: number;
  /** Token threshold to trigger in-loop compaction. */
  compactThreshold?: number;
  /** Called when totalInputTokens exceeds compactThreshold. */
  onCompact?: (
    messages: ChatMessage[],
    state: AgentLoopState,
  ) => Promise<{
    messages: ChatMessage[];
    summary?: string;
  }>;
}

// -- Stream events --

export type AgentEvent =
  | { type: "chunk"; content: string }
  | { type: "reasoning"; content: string }
  | {
      type: "tool_start";
      name: string;
      id: string;
      args: Record<string, unknown>;
    }
  | {
      type: "tool_end";
      name: string;
      id: string;
      result: string;
      status: "success" | "error";
    }
  | { type: "state"; state: AgentLoopState }
  | {
      type: "retry";
      attempt: number;
      maxAttempts: number;
      reason: string;
      delayMs: number;
    }
  | {
      type: "done";
      content: string;
      iterations: number;
      usage: { inputTokens: number; outputTokens: number };
    }
  | { type: "error"; message: string };
