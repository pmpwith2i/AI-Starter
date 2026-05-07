import { anonymizeForAI } from "./anonymize.js";

/**
 * Single entry point for everything that enters an LLM prompt or tool result.
 * Always goes through `anonymizeForAI` so we cannot accidentally leak raw PII
 * to OpenRouter/OpenAI.
 *
 * Keep the helper intentionally small — it is a barrier, not a formatter.
 */
export function toLlmPayload<T>(value: T): T {
  return anonymizeForAI(value);
}

/**
 * Stringify a value for inclusion in an LLM text slot (system prompt, tool
 * result, compaction input). Applies `toLlmPayload` first, then JSON-encodes
 * unless the value is already a primitive that can be handed to the model as-is.
 */
export function toLlmString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  return JSON.stringify(toLlmPayload(value));
}
