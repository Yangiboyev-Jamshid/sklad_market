import { describe, it, expect, vi } from "vitest";
import { createSseParser } from "../sse";

describe("createSseParser", () => {
  it("parses a single event delivered in one chunk", () => {
    const onEvent = vi.fn();
    const parser = createSseParser(onEvent);
    parser.push('event: token\ndata: {"text":"Hi"}\n\n');
    expect(onEvent).toHaveBeenCalledWith({ event: "token", data: { text: "Hi" } });
  });

  it("reassembles an event split across arbitrary chunk boundaries", () => {
    const onEvent = vi.fn();
    const parser = createSseParser(onEvent);
    const raw = 'event: token\ndata: {"text":"Hello world"}\n\n';
    for (const char of raw) parser.push(char);
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({ event: "token", data: { text: "Hello world" } });
  });

  it("splits mid-line across two chunks", () => {
    const onEvent = vi.fn();
    const parser = createSseParser(onEvent);
    parser.push('event: to');
    parser.push('ken\ndata: {"te');
    parser.push('xt":"ok"}\n\n');
    expect(onEvent).toHaveBeenCalledWith({ event: "token", data: { text: "ok" } });
  });

  it("ignores heartbeat comment lines", () => {
    const onEvent = vi.fn();
    const parser = createSseParser(onEvent);
    parser.push(": keep-alive\n\n");
    parser.push('event: done\ndata: {"messageId":"m1","conversationId":"c1"}\n\n');
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({
      event: "done",
      data: { messageId: "m1", conversationId: "c1" },
    });
  });

  it("parses error events with the typed code payload", () => {
    const onEvent = vi.fn();
    const parser = createSseParser(onEvent);
    parser.push('event: error\ndata: {"code":"rate_limited","message":"slow down"}\n\n');
    expect(onEvent).toHaveBeenCalledWith({
      event: "error",
      data: { code: "rate_limited", message: "slow down" },
    });
  });

  it("handles multiple events in one chunk", () => {
    const onEvent = vi.fn();
    const parser = createSseParser(onEvent);
    parser.push(
      'event: token\ndata: {"text":"A"}\n\nevent: token\ndata: {"text":"B"}\n\n'
    );
    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenNthCalledWith(1, { event: "token", data: { text: "A" } });
    expect(onEvent).toHaveBeenNthCalledWith(2, { event: "token", data: { text: "B" } });
  });

  it("flushes a trailing event that never got its closing blank line", () => {
    const onEvent = vi.fn();
    const parser = createSseParser(onEvent);
    parser.push('event: usage\ndata: {"tokensIn":1,"tokensOut":2,"budgetRemaining":3}');
    expect(onEvent).not.toHaveBeenCalled();
    parser.flush();
    expect(onEvent).toHaveBeenCalledWith({
      event: "usage",
      data: { tokensIn: 1, tokensOut: 2, budgetRemaining: 3 },
    });
  });
});
