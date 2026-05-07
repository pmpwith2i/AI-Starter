import type { AgentEvent } from "./ai.agent.types.js";

const DELIMITER = "\u{0016}";

/**
 * Convert an AsyncGenerator of typed AgentEvents into a ReadableStream of
 * JSON-serialized strings separated by a delimiter.
 *
 * Use this at the HTTP boundary (SSE handler) to pipe agent events to clients.
 */
export const toReadableStream = (
  generator: AsyncGenerator<AgentEvent>,
): ReadableStream<string> =>
  new ReadableStream({
    async pull(controller) {
      const { done, value } = await generator.next();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(JSON.stringify(value) + DELIMITER);
    },
  });
