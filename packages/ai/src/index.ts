export { createAgent } from "./agents/ai.base-agent.js";
export { toReadableStream } from "./agents/ai.stream.js";
export type {
  AgentConfig,
  AgentEvent,
  AgentLoopState,
  AgentPhase,
  ChatMessage,
  ChatResponse,
  LlmProvider,
  OnRetryInfo,
  ResponseFormat,
  RetryConfig,
  StreamChunk,
  StreamDelta,
} from "./agents/ai.agent.types.js";

export type {
  InputValidator,
  ToolDefinition,
  ToolHandler,
  ToolMap,
} from "./tools/ai.tools.types.js";
export { defineTool } from "./tools/ai.tools.types.js";
export type { ResolvedTool } from "./tools/ai.default-tools.constants.js";
export {
  DEFAULT_TOOLS,
  resolveTools,
} from "./tools/ai.default-tools.constants.js";

export { createOpenRouterProvider } from "./providers/openrouter.provider.js";
export {
  createDebugLlmProvider,
  type DebugLlmEvent,
  type DebugLlmOptions,
} from "./providers/debug.provider.js";

export { anonymizeForAI, computeAgeYears } from "./anonymize.js";
export { toLlmPayload, toLlmString } from "./llm-payload.js";
