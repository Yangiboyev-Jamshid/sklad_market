import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import { aiSuggestions } from "../data/mockData";

export default function AiAgentPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const send = (text) => {
    const t = text ?? input;
    if (!t.trim()) return;
    setMessages((prev) => [
      ...prev,
      { from: "me", text: t },
      { from: "ai", text: "Ищу подходящих поставщиков по вашему запросу. Один момент..." },
    ]);
    setInput("");
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto h-full flex flex-col px-4 sm:px-6 py-5 sm:py-8">
        <div className="flex-1 overflow-y-auto flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-ink-900 dark:text-white mb-3">Здравствуйте</h1>
              <p className="text-[#8D8D8D] mb-8 sm:mb-8 max-w-lg text-xl sm:text-xl">
                Я ваш AI-ассистент. Ваш интеллектуальный помощник по поиску товаров и поставщиков.
              </p>
              <div className="grid sm:grid-cols-2 grid-cols-1 justify-center gap-3 sm:gap-3">
                {aiSuggestions.map((s, i) => (
                  <div key={i} className={`${i === 4 ? "col-span-full" : ""}`}>
                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => send(s)}
                      className={`bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-3.5 sm:px-4 py-5 sm:py-3 text-xs sm:text-sm text-ink-700 dark:text-ink-200 hover:border-brand-300 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors`}
                    >
                      {s}
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 py-4">
              <AnimatePresence>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[85%] sm:max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.from === "me"
                      ? "bg-brand-600 text-white self-end"
                      : "bg-white dark:bg-[#0D0D0D] border border-ink-100 dark:border-[#1C1C1C] text-ink-700 dark:text-ink-200 self-start"
                      }`}
                  >
                    {m.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 mt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Спросите что нибудь..."
            className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white"
          />
          <button onClick={() => send()} className="text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors shrink-0">
            <Send size={20} variant="Bold" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
