// Real-time chat transport — wss://skladmarket.uz/api/v1/ws/chat.
// REST (api.js) only covers thread management, history and image upload;
// everything live (message send, typing, read receipts) goes over this socket.
//
// Note: this lives on the same host as the REST API (skladmarket.uz), not on
// an "api." subdomain — api.skladmarket.uz doesn't resolve (NXDOMAIN); a raw
// WS handshake against skladmarket.uz/api/v1/ws/chat gets a real response
// with the backend's CORS headers, confirming the route lives here.
//
// This is a module-level singleton (not a React context) so any component
// can subscribe to events without needing a provider, and the connection
// survives across route changes. AuthContext opens/closes it on login/logout.
import { getChatWsToken } from "./api";
import { CHAT_ENABLED } from "../config/chatConfig";

const WS_URL = "wss://skladmarket.uz/api/v1/ws/chat";
const RECONNECT_DELAY_MS = 3000;

let socket = null;
let connecting = false;
let manuallyClosed = true;
let reconnectTimer = null;
const subscribedThreads = new Set();
const listeners = new Map(); // event -> Set(handler)

function emit(event, payload) {
  listeners.get(event)?.forEach((handler) => {
    try {
      handler(payload);
    } catch (err) {
      console.error(`[chatSocket] listener for "${event}" threw`, err);
    }
  });
}

// Subscribe to a chat socket event. Returns an unsubscribe function.
// Events: "open", "close", "new_message", "read_receipt", "typing", "error"
export function onChatEvent(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  return () => listeners.get(event)?.delete(handler);
}

function send(payload) {
  if (socket?.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify(payload));
  return true;
}

export function subscribeThread(threadId) {
  if (!threadId) return;
  subscribedThreads.add(threadId);
  send({ event: "subscribe", thread_id: threadId });
}

export function unsubscribeThread(threadId) {
  subscribedThreads.delete(threadId);
}

export function sendChatSocketMessage(threadId, body, attachmentKey) {
  const payload = { event: "message", thread_id: threadId, body };
  if (attachmentKey) payload.attachment_key = attachmentKey;
  return send(payload);
}

export function sendTyping(threadId) {
  return send({ event: "typing", thread_id: threadId });
}

export function sendRead(threadId, messageIds) {
  if (!threadId || !messageIds?.length) return false;
  return send({ event: "read", thread_id: threadId, message_ids: messageIds });
}

function scheduleReconnect() {
  if (manuallyClosed || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectChatSocket();
  }, RECONNECT_DELAY_MS);
}

export async function connectChatSocket() {
  if (!CHAT_ENABLED) return;
  if (connecting || socket?.readyState === WebSocket.OPEN) return;
  manuallyClosed = false;
  connecting = true;

  let wsToken;
  try {
    const data = await getChatWsToken();
    wsToken = data?.ws_token;
  } catch (err) {
    connecting = false;
    emit("error", { code: "TOKEN_FETCH_FAILED", message: err.message });
    scheduleReconnect();
    return;
  }
  if (!wsToken || manuallyClosed) {
    connecting = false;
    return;
  }

  const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(wsToken)}`);

  ws.onopen = () => {
    connecting = false;
    socket = ws;
    subscribedThreads.forEach((threadId) => send({ event: "subscribe", thread_id: threadId }));
    emit("open");
  };

  ws.onmessage = (evt) => {
    let data;
    try {
      data = JSON.parse(evt.data);
    } catch {
      return;
    }
    if (data?.event) emit(data.event, data);
  };

  ws.onclose = () => {
    connecting = false;
    if (socket === ws) socket = null;
    emit("close");
    scheduleReconnect();
  };

  ws.onerror = () => {
    ws.close();
  };
}

export function disconnectChatSocket() {
  manuallyClosed = true;
  connecting = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  subscribedThreads.clear();
  socket?.close();
  socket = null;
}

export function isChatSocketOpen() {
  return socket?.readyState === WebSocket.OPEN;
}
