export const CHAT_EXCHANGE_LIMIT = 15;

// Preserve complete exchanges and a small set of still-actionable draft controls.
export function recentChatMessages(messages) {
  let questions = 0;
  let start = messages.length;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (String(messages[i].role).toLowerCase() === "user") {
      questions += 1;
      start = i;
      if (questions === CHAT_EXCHANGE_LIMIT) break;
    }
  }
  if (questions < CHAT_EXCHANGE_LIMIT) return messages.slice(-180);
  const pending = messages.slice(0, start).filter((m) => m.draft?.status === "pending").slice(-20);
  return [...pending, ...messages.slice(start).slice(-180)];
}

export function newChatRequestId() {
  if (globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();
  // LAN development over HTTP may not expose randomUUID, but still has getRandomValues.
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
