import { Send } from "iconsax-reactjs";
import { t } from "../i18n";

const MAX_LENGTH = 4000;

export default function ChatInput({ value, onChange, onSend, disabled }) {
  return (
    <div className="flex flex-col gap-1 mt-4">
      <div className="flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 sm:px-5 py-3 sm:py-3.5">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={t("chat.placeholder")}
          disabled={disabled}
          maxLength={MAX_LENGTH}
          className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => onSend()}
          disabled={disabled || !value.trim()}
          aria-label={t("common.send")}
          className="text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={20} variant="Bold" />
        </button>
      </div>
      {value.length > MAX_LENGTH * 0.8 && (
        <span className="text-[11px] text-ink-400 self-end pr-1">
          {t("chat.charLimit", { count: value.length, max: MAX_LENGTH })}
        </span>
      )}
    </div>
  );
}
