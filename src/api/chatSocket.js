import { getChatWsToken } from "./api";
import { CHAT_ENABLED } from "../config/chatConfig";

const WS_URL = "wss://skladmarket.uz/api/v1/ws/chat";
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

const SEND_TIMEOUT_MS = 15000;

let socket = null;
let connecting = false;
let manuallyClosed = true;
let reconnectTimer = null;
let reconnectAttempts = 0;
const subscribedThreads = new Set();
const listeners = new Map();
const messageQueue = [];
const pendingSends = new Map();

function emit(event, payload) {
  listeners.get(event)?.forEach((handler) => {
    try {
      handler(payload);
    } catch (err) {
      console.error(`[chatSocket] listener for "${event}" threw`, err);
    }
  });
}

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

function flushQueue() {
  const queued = messageQueue.splice(0, messageQueue.length);
  queued.forEach(({ payload, timeoutId }) => {
    clearTimeout(timeoutId);
    send(payload);
  });
}

function trackPendingSend(threadId, clientId) {
  const timeoutId = setTimeout(() => {
    pendingSends.delete(clientId);
    console.warn(`[chatSocket] send_timeout: no echo for client_id=${clientId} thread_id=${threadId} after ${SEND_TIMEOUT_MS}ms`);
    emit("send_timeout", { client_id: clientId, thread_id: threadId });
  }, SEND_TIMEOUT_MS);
  pendingSends.set(clientId, timeoutId);
}

export function confirmChatSend(clientId) {
  const timeoutId = pendingSends.get(clientId);
  if (timeoutId === undefined) return;
  clearTimeout(timeoutId);
  pendingSends.delete(clientId);
}

export function sendChatSocketMessage(threadId, body, attachmentKey, clientId) {
  const payload = { event: "message", thread_id: threadId, body };
  if (attachmentKey) payload.attachment_key = attachmentKey;
  if (send(payload)) {
    trackPendingSend(threadId, clientId);
    return true;
  }

  const entry = { payload, clientId };
  entry.timeoutId = setTimeout(() => {
    const idx = messageQueue.indexOf(entry);
    if (idx === -1) return;
    messageQueue.splice(idx, 1);
    emit("send_timeout", { client_id: clientId, thread_id: threadId });
  }, SEND_TIMEOUT_MS);
  messageQueue.push(entry);
  connectChatSocket();
  return true;
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
  const delay = Math.min(RECONNECT_DELAY_MS * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY_MS);
  reconnectAttempts += 1;
  emit("reconnecting", { attempt: reconnectAttempts, delay });
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectChatSocket();
  }, delay);
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
    reconnectAttempts = 0;
    socket = ws;
    subscribedThreads.forEach((threadId) => send({ event: "subscribe", thread_id: threadId }));
    flushQueue();
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

  ws.onclose = (evt) => {
    connecting = false;
    if (socket === ws) socket = null;
    console.warn(`[chatSocket] closed code=${evt.code} reason="${evt.reason}" wasClean=${evt.wasClean}`);
    emit("close");
    scheduleReconnect();
  };

  ws.onerror = (evt) => {
    console.error("[chatSocket] socket error", evt);
    ws.close();
  };
}

export function disconnectChatSocket() {
  manuallyClosed = true;
  connecting = false;
  reconnectAttempts = 0;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  subscribedThreads.clear();
  messageQueue.splice(0, messageQueue.length).forEach(({ timeoutId }) => clearTimeout(timeoutId));
  pendingSends.forEach((timeoutId) => clearTimeout(timeoutId));
  pendingSends.clear();
  socket?.close();
  socket = null;
}
