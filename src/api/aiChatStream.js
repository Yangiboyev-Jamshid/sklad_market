import { getAccessToken } from "./api";

const STREAM_INACTIVITY_MS = 120000; // backend resets its own 120s inactivity timeout on every chunk

function parseSseBuffer(buffer) {
  const events = [];
  let rest = buffer;
  let sepIndex;
  while ((sepIndex = rest.indexOf("\n\n")) !== -1) {
    const rawEvent = rest.slice(0, sepIndex);
    rest = rest.slice(sepIndex + 2);
    let eventName = "message";
    const dataLines = [];
    rawEvent.split("\n").forEach((line) => {
      if (line.startsWith("event:")) eventName = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    });
    if (dataLines.length) events.push({ event: eventName, data: dataLines.join("\n") });
  }
  return { events, rest };
}

function parsePayload(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

// Real backend SSE protocol (AI_API.md §4, confirmed against production):
//   :keep-alive                                   (comment line, ignored, proves the connection is alive)
//   event:token       data:{"text":"..."}          (incremental text chunk, append)
//   event:tool_start  data:{"tool":"...","summary":"..."}
//   event:tool_end    data:{"tool":"...","status":"ok"}
//   event:result_set  data:{...}                   (free-form structured results to render as cards)
//   event:draft       data:{"draftId":"...","type":"LEAD","payload":{}}
//   event:usage       data:{"tokensIn":.,"tokensOut":.,"budgetRemaining":.}
//   event:done        data:{"messageId":"...","conversationId":"..."}   -- terminal, success
//   event:error       data:{"code":"...","message":"..."}               -- terminal, failure
// A stream that closes without a "done" or "error" event is itself a failure (§4) — the frontend
// must not treat that as a successful turn.
export async function streamAiMessage(conversationId, content, {
  onToken, onToolStart, onToolEnd, onResultSet, onDraft, onUsage, onDone, onError, signal, lang,
} = {}) {
  let settled = false;
  let watchdog;

  const fail = (err) => {
    if (settled) return;
    settled = true;
    clearTimeout(watchdog);
    onError?.(err);
  };
  const succeed = (payload) => {
    if (settled) return;
    settled = true;
    clearTimeout(watchdog);
    onDone?.(payload);
  };
  const resetWatchdog = () => {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => fail(Object.assign(new Error("AI stream timed out"), { code: "timeout" })), STREAM_INACTIVITY_MS);
  };

  try {
    const token = getAccessToken();
    resetWatchdog();
    const res = await fetch(`/api/v1/ai/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Accept-Language": (lang || "uz").toUpperCase(),
      },
      body: JSON.stringify({ content }),
      signal,
    });

    if (!res.ok || !res.body) {
      throw Object.assign(new Error(`AI stream failed (status ${res.status})`), { status: res.status });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      resetWatchdog();
      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseBuffer(buffer);
      buffer = rest;
      for (const { event, data } of events) {
        const payload = parsePayload(data);
        if (event === "token") {
          onToken?.(payload?.text ?? "");
        } else if (event === "tool_start") {
          onToolStart?.(payload);
        } else if (event === "tool_end") {
          onToolEnd?.(payload);
        } else if (event === "result_set") {
          onResultSet?.(payload);
        } else if (event === "draft") {
          onDraft?.(payload);
        } else if (event === "usage") {
          onUsage?.(payload);
        } else if (event === "done") {
          succeed(payload);
          return;
        } else if (event === "error") {
          const code = payload?.code;
          fail(Object.assign(new Error(payload?.message || "AI error"), { code }));
          return;
        }
      }
    }
    // Stream closed by the server with neither "done" nor "error" — per AI_API.md §4 this is a failure.
    fail(new Error("AI stream ended unexpectedly"));
  } catch (err) {
    if (err.name === "AbortError") {
      settled = true;
      clearTimeout(watchdog);
      return;
    }
    fail(err);
  }
}
