import { motion } from "framer-motion";

export default function PillToggle({ options, value, onChange, className = "" }) {
  return (
    <div className={`relative inline-flex bg-ink-100 dark:bg-[#171717] rounded-full p-1 transition-colors ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`relative px-3 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors z-10 flex-1 whitespace-nowrap ${
              active ? "text-ink-900 dark:text-white" : "text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
            }`}
          >
            {active && (
              <motion.div
                layoutId={`pill-${options.map((o) => o.value).join("-")}`}
                className="absolute inset-0 bg-white dark:bg-[#0D0D0D] rounded-full shadow-card -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
