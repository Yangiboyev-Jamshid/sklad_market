// Chat is wired up end-to-end (REST in api/api.js, WebSocket transport in
// api/chatSocket.js, UI in components/chat/ChatPanel.jsx) but is kept from
// making any network calls until the backend side is ready — flip this back
// to true to re-enable it, no other code changes needed.
export const CHAT_ENABLED = false;
