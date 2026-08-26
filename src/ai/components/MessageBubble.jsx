import { motion } from "framer-motion";
import Markdown from "../lib/markdown";
import ToolStatusChip from "./ToolStatusChip";
import DraftLeadCard from "./DraftLeadCard";
import StructuredResults from "./StructuredResults";
import AiAgentLogo from "./AiAgentLogo";
import { t, useAiLocale } from "../i18n";

function formatMessageTime(value, locale) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function MessageBubble({
  message,
  onConfirmDraft,
  onCancelDraft,
  onPublishIntent,
  onCloseIntent,
  plainTextOnly = false,
}) {
  const locale = useAiLocale();
  const isUser = message.role === "user";
  // The user's own prompt is the authority for suppressing cards. A model-selected tool
  // argument must never hide grounded results when the user did not request plain text.
  const visibleResultSets = plainTextOnly ? [] : (message.resultSets ?? []);
  const hasResults = !isUser && visibleResultSets.length > 0;
  const messageTime = formatMessageTime(message.createdAt, locale);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${hasResults ? "max-w-[98%] sm:max-w-[95%]" : "max-w-[88%] sm:max-w-[82%]"} flex items-start gap-2 ${isUser ? "self-end" : "self-start"}`}
    >
      {!isUser && <AiAgentLogo size={28} className="mt-1" />}
      <div
        className={`min-w-0 rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-brand-600 text-white"
            : "border border-ink-100 bg-white text-ink-700 dark:border-[#1C1C1C] dark:bg-[#0D0D0D] dark:text-ink-200"
        }`}
      >
        {!isUser && message.toolEvents?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {message.toolEvents.map((te, i) => (
              <ToolStatusChip key={i} tool={te.tool} status={te.status} summary={te.summary} />
            ))}
          </div>
        )}

        {isUser ? (
          <span className="whitespace-pre-wrap break-words">{message.text}</span>
        ) : (
          <Markdown text={message.text} />
        )}

        {!isUser && message.draft && (
          <DraftLeadCard
            draft={message.draft}
            onConfirm={(overrides) => onConfirmDraft?.(message.id, message.draft.draftId, overrides)}
            onCancel={() => onCancelDraft?.(message.id, message.draft.draftId)}
          />
        )}

        {hasResults && (
          <StructuredResults
            resultSets={visibleResultSets}
            onPublishIntent={(resultSetIndex, intentId) =>
              onPublishIntent?.(message.id, resultSetIndex, intentId)
            }
            onCloseIntent={(resultSetIndex, intentId) =>
              onCloseIntent?.(message.id, resultSetIndex, intentId)
            }
          />
        )}

        {message.streaming && !message.text && (
          <span className="inline-flex gap-1 items-center text-ink-400" aria-label="typing">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
          </span>
        )}

        {messageTime && (
          <time
            dateTime={message.createdAt}
            aria-label={t(isUser ? "chat.sentAt" : "chat.respondedAt", { time: messageTime })}
            className={`mt-2 block text-[10px] leading-none ${
              isUser ? "text-right text-white/70" : "text-ink-400"
            }`}
          >
            {messageTime}
          </time>
        )}
      </div>
    </motion.div>
  );
}
