import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";

function wantsPlainEntityList(text) {
  const value = String(text || "").toLocaleLowerCase();
  return /\b(plain\s+text|text\s+only|without\s+cards?|no\s+cards?)\b/i.test(value)
    || /(простой\s+текст|только\s+текст|без\s+карточ|текстовым\s+списком)/i.test(value)
    || /(oddiy\s+matn|faqat\s+matn|kartochkasiz|kartalarsiz|matn\s+ko['’]?rinishida)/i.test(value);
}

export default function ChatMessages({
  messages,
  onConfirmDraft,
  onCancelDraft,
  onPublishIntent,
  onCloseIntent,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages]);

  let plainTextOnly = false;
  const bubbles = [];
  for (const message of messages) {
    if (message.role === "user") plainTextOnly = wantsPlainEntityList(message.text);
    bubbles.push(
      <MessageBubble
        key={message.id}
        message={message}
        plainTextOnly={message.role !== "user" && plainTextOnly}
        onConfirmDraft={onConfirmDraft}
        onCancelDraft={onCancelDraft}
        onPublishIntent={onPublishIntent}
        onCloseIntent={onCloseIntent}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      <AnimatePresence>{bubbles}</AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
