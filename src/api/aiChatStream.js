import { getAccessToken } from "./api";

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

// Real backend SSE protocol (confirmed against production):
//   :keep-alive                                   (comment line, ignored)
//   event:token   data:{"text":"..."}              (incremental text chunk, append)
//   event:usage   data:{"tokensIn":.,"tokensOut":.,"budgetRemaining":.}
//   event:done    data:{"messageId":"...","conversationId":"..."}
//   event:error   data:{...}
export async function streamAiMessage(conversationId, content, { onToken, onUsage, onDone, onError, signal, lang } = {}) {
  let doneFired = false;
  try {
    const token = getAccessToken();
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
      throw new Error(`AI stream failed (status ${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseBuffer(buffer);
      buffer = rest;
      for (const { event, data } of events) {
        const payload = parsePayload(data);
        if (event === "token") {
          onToken?.(payload?.text ?? "");
        } else if (event === "usage") {
          onUsage?.(payload);
        } else if (event === "done") {
          doneFired = true;
          onDone?.(payload);
        } else if (event === "error") {
          onError?.(new Error(typeof payload === "string" ? payload : payload?.message || "AI error"));
          return;
        }
      }
    }
    if (!doneFired) onDone?.(null);
  } catch (err) {
    if (err.name !== "AbortError") onError?.(err);
  }
}
