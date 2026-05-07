import type { ToolDefinition, ToolHandler, ToolMap } from "./ai.tools.types.js";

/** Metadata for a resolved tool — used by the agent orchestrator. */
export interface ResolvedTool {
  definition: ToolDefinition;
  handler: ToolHandler;
  isReadOnly: boolean;
  maxResultSizeChars: number;
}

const DEFAULT_MAX_RESULT_SIZE = 2000;

/** Extracts definitions, handlers, and metadata from ToolMap[] for use with createAgent. */
export const resolveTools = (maps: ToolMap[]): ResolvedTool[] =>
  maps.map((t) => ({
    definition: t.definition,
    handler: t.handler,
    isReadOnly: t.isReadOnly ?? false,
    maxResultSizeChars: t.maxResultSizeChars ?? DEFAULT_MAX_RESULT_SIZE,
  }));

const ALL_TOOLS: ToolMap[] = [];

export const DEFAULT_TOOLS = ALL_TOOLS;
