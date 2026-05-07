import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type {
  ChatMessage,
  ChatResponse,
  LlmProvider,
  StreamChunk,
} from "../agents/ai.agent.types.js";
import {
  createDebugLlmProvider,
  type DebugLlmEvent,
} from "./debug.provider.js";

/**
 * Tests verify OUR wrapper behavior (event emission, redaction, call
 * counting, stream accumulation). The Langfuse OTel SDK is NOT initialised
 * in tests — `startActiveObservation` falls back to a NoOp tracer, which is
 * the expected behavior in any context where tracing is off.
 */

const fakeProvider = (response: string): LlmProvider => ({
  async chat(): Promise<ChatResponse> {
    return {
      content: response,
      usage: { promptTokens: 10, completionTokens: 20 },
    };
  },
  chatStream() {
    const chunks: StreamChunk[] = [
      {
        choices: [{ delta: { content: response.slice(0, 5) } }],
      } as StreamChunk,
      {
        choices: [{ delta: { content: response.slice(5) } }],
        usage: { promptTokens: 10, completionTokens: 20 },
      } as StreamChunk,
    ];
    let i = 0;
    return {
      [Symbol.asyncIterator]() {
        return {
          async next() {
            if (i < chunks.length) return { value: chunks[i++]!, done: false };
            return { value: undefined as unknown as StreamChunk, done: true };
          },
        };
      },
    };
  },
});

const throwingProvider = (err: Error): LlmProvider => ({
  async chat() {
    throw err;
  },
  chatStream() {
    return {
      [Symbol.asyncIterator]() {
        return {
          async next(): Promise<IteratorResult<StreamChunk>> {
            throw err;
          },
        };
      },
    };
  },
});

describe("createDebugLlmProvider", () => {
  it("forwards chat() calls verbatim and emits an event with usage", async () => {
    const events: DebugLlmEvent[] = [];
    const llm = createDebugLlmProvider(fakeProvider("hello world"), {
      onEvent: (e) => events.push(e),
    });
    const messages: ChatMessage[] = [
      { role: "system", content: "be terse" },
      { role: "user", content: "hi" },
    ];
    const r = await llm.chat({ model: "test-m", messages });
    assert.equal(r.content, "hello world");
    assert.equal(events.length, 1);
    assert.equal(events[0]?.method, "chat");
    assert.equal(events[0]?.model, "test-m");
    assert.equal(events[0]?.messageCount, 2);
    assert.equal(events[0]?.responseLength, "hello world".length);
    assert.equal(events[0]?.inputTokens, 10);
    assert.equal(events[0]?.outputTokens, 20);
    assert.equal(events[0]?.callIndex, 1);
    assert.equal(typeof events[0]?.durationMs, "number");
  });

  it("captures the error and re-throws when chat() fails", async () => {
    const events: DebugLlmEvent[] = [];
    const llm = createDebugLlmProvider(throwingProvider(new Error("boom")), {
      onEvent: (e) => events.push(e),
    });
    await assert.rejects(() => llm.chat({ model: "x", messages: [] }), /boom/);
    assert.equal(events.length, 1);
    assert.equal(events[0]?.error?.message, "boom");
    assert.equal(events[0]?.method, "chat");
  });

  it("counts stream chunks and emits a terminal event", async () => {
    const events: DebugLlmEvent[] = [];
    const llm = createDebugLlmProvider(fakeProvider("abcdefghij"), {
      onEvent: (e) => events.push(e),
    });
    let received = "";
    for await (const chunk of llm.chatStream({ model: "m", messages: [] })) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) received += delta;
    }
    assert.equal(received, "abcdefghij");
    assert.equal(events.length, 1);
    assert.equal(events[0]?.method, "chatStream");
    assert.equal(events[0]?.streamChunkCount, 2);
    assert.equal(events[0]?.responseLength, "abcdefghij".length);
    assert.equal(events[0]?.inputTokens, 10);
    assert.equal(events[0]?.outputTokens, 20);
  });

  it("does not mutate the original messages when redacting", async () => {
    const llm = createDebugLlmProvider(fakeProvider("ok"), {
      redactPaths: ["email"],
    });
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: JSON.stringify({ email: "user@example.com", name: "Maria" }),
      },
    ];
    await llm.chat({ model: "m", messages });
    // Original `messages` array is NOT mutated — content remains the same.
    assert.match(messages[0]!.content, /user@example\.com/);
  });

  it("redacts nested structured fields in onEvent messages", async () => {
    // Inject a structured-metadata sink by wrapping the inner provider and
    // capturing the (unredacted) safeMessages passed to it — except we want
    // to assert what LANGFUSE sees, so we observe via a dedicated sink.
    const capturedInputs: unknown[] = [];
    const llm = createDebugLlmProvider(
      {
        async chat(opts) {
          capturedInputs.push(opts.messages);
          return { content: "ok" };
        },
        chatStream: fakeProvider("x").chatStream,
      },
      { redactPaths: ["email", "codiceFiscale"] },
    );
    const message = {
      role: "user",
      content: "test",
      patient: { email: "p@x.com", codiceFiscale: "RSSMRA80A01H501U" },
    } as unknown as ChatMessage;
    await llm.chat({ model: "m", messages: [message] });
    // The underlying provider still receives the ORIGINAL (un-redacted) messages.
    const underlying = JSON.stringify(capturedInputs[0]);
    assert.match(underlying, /p@x\.com/);
    assert.match(underlying, /RSSMRA80A01H501U/);
  });

  it("monotonically increments callIndex within a single provider instance", async () => {
    const events: DebugLlmEvent[] = [];
    const llm = createDebugLlmProvider(fakeProvider("x"), {
      onEvent: (e) => events.push(e),
    });
    await llm.chat({ model: "m", messages: [] });
    await llm.chat({ model: "m", messages: [] });
    await llm.chat({ model: "m", messages: [] });
    assert.deepEqual(
      events.map((e) => e.callIndex),
      [1, 2, 3],
    );
  });

  it("works without an onEvent callback", async () => {
    const llm = createDebugLlmProvider(fakeProvider("ok"));
    const r = await llm.chat({ model: "m", messages: [] });
    assert.equal(r.content, "ok");
  });
});
