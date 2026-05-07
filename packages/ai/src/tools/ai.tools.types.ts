/** Maps JSON Schema type strings to TypeScript types. */
type JsonSchemaTypeMap = {
  string: string;
  number: number;
  integer: number;
  boolean: boolean;
  null: null;
  object: Record<string, unknown>;
  array: unknown[];
};

/** Extract TS type from a JSON Schema property definition. */
type InferProperty<P> = P extends { type: infer T extends string }
  ? T extends keyof JsonSchemaTypeMap
    ? JsonSchemaTypeMap[T]
    : unknown
  : unknown;

/** Build the object type from schema properties + required. */
type InferSchemaArgs<S> = S extends {
  properties: infer P;
  required: infer R extends readonly string[];
}
  ? { [K in keyof P & R[number]]: InferProperty<P[K]> } & {
      [K in Exclude<keyof P, R[number]>]?: InferProperty<P[K]>;
    }
  : S extends { properties: infer P }
    ? { [K in keyof P]?: InferProperty<P[K]> }
    : Record<string, unknown>;

/** JSON Schema shape for tool parameters (always an object). */
export interface ToolParametersSchema {
  readonly type: "object";
  readonly properties?: Readonly<
    Record<string, Readonly<Record<string, unknown>>>
  >;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: ToolParametersSchema;
  };
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

/**
 * Framework-agnostic input validator compatible with Zod's `safeParse`.
 * Pass a Zod schema and `defineTool` will auto-validate args before
 * calling the handler, returning a clear error message on failure.
 */
export interface InputValidator {
  safeParse(data: unknown): {
    success: boolean;
    error?: {
      issues: Array<{ path: PropertyKey[]; message: string }>;
    };
    data?: unknown;
  };
}

export interface ToolMap {
  definition: ToolDefinition;
  handler: ToolHandler;
  /** If true, tool only reads data and can be executed in parallel with other read-only tools. Default: false */
  isReadOnly?: boolean;
  /** Max chars for tool result before truncation. Default: 2000 */
  maxResultSizeChars?: number;
}

/**
 * Helper to create a type-safe tool where the handler args
 * are inferred from the JSON Schema parameters definition.
 *
 * The schema must use `as const` for inference to work.
 *
 * Usage:
 * ```ts
 * const myTool = defineTool({
 *   definition: {
 *     type: "function",
 *     function: {
 *       name: "my_tool",
 *       description: "Does something",
 *       parameters: {
 *         type: "object",
 *         properties: { id: { type: "string" } },
 *         required: ["id"],
 *       } as const,
 *     },
 *   },
 *   handler: async (args) => {
 *     // args.id is typed as string
 *   },
 * });
 * ```
 */
export const defineTool = <const S extends ToolParametersSchema>(tool: {
  definition: {
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: S;
    };
  };
  inputSchema?: InputValidator;
  isReadOnly?: boolean;
  maxResultSizeChars?: number;
  handler: (args: InferSchemaArgs<S>) => Promise<unknown>;
}): ToolMap => {
  const base = {
    isReadOnly: tool.isReadOnly,
    maxResultSizeChars: tool.maxResultSizeChars,
  };

  if (!tool.inputSchema) {
    return { ...(tool as unknown as ToolMap), ...base };
  }

  const originalHandler = tool.handler as ToolHandler;
  const validator = tool.inputSchema;
  const toolName = tool.definition.function.name;

  const validatedHandler: ToolHandler = async (args) => {
    const result = validator.safeParse(args);
    if (!result.success) {
      const issues = result.error?.issues ?? [];
      const details = issues
        .map((i) => {
          const path = i.path.length > 0 ? `"${i.path.join(".")}"` : "input";
          return `${path}: ${i.message}`;
        })
        .join("; ");
      return {
        error: true,
        message: `Invalid input for tool "${toolName}": ${details}`,
      };
    }
    return originalHandler(result.data as Record<string, unknown>);
  };

  return {
    definition: tool.definition,
    handler: validatedHandler,
    ...base,
  };
};
