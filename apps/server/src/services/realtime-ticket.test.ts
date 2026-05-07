import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  issueTicket,
  consumeTicket,
  _resetTicketStoreForTests,
} from "./realtime-ticket.js";

describe("realtime tickets", () => {
  it("issues a ticket for a user and consumes it once", () => {
    _resetTicketStoreForTests();
    const ticket = issueTicket("user-1");
    assert.ok(ticket.length > 20);
    const userId = consumeTicket(ticket);
    assert.equal(userId, "user-1");
  });

  it("second consume of the same ticket fails", () => {
    _resetTicketStoreForTests();
    const ticket = issueTicket("user-1");
    consumeTicket(ticket);
    assert.equal(consumeTicket(ticket), null);
  });

  it("unknown ticket returns null", () => {
    _resetTicketStoreForTests();
    assert.equal(consumeTicket("not-a-real-ticket"), null);
  });

  it("expires tickets past their TTL", () => {
    _resetTicketStoreForTests();
    const ticket = issueTicket("user-1", { ttlMs: 1, now: 0 });
    assert.equal(consumeTicket(ticket, { now: 1000 }), null);
  });
});
