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

  return (
    <div className="flex flex-col gap-3 py-4">
      <AnimatePresence>
        {messages.map((m, index) => (
          <MessageBubble
            key={m.id}
            message={m}
            plainTextOnly={
              m.role !== "user" && wantsPlainEntityList(messages[index - 1]?.text)
            }
            onConfirmDraft={onConfirmDraft}
            onCancelDraft={onCancelDraft}
            onPublishIntent={onPublishIntent}
            onCloseIntent={onCloseIntent}
          />
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
