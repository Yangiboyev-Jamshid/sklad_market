import { motion } from "framer-motion";
import AppShell from "../components/layout/AppShell";
import { tariffPlans } from "../data/mockData";

export default function TariffsPage() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white mb-2">Тарифные планы</h1>
          <p className="text-ink-400 dark:text-ink-500 text-sm sm:text-base">Выберите подходящий план для роста вашего бизнеса</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {tariffPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-2xl p-5 sm:p-6 border flex flex-col transition-colors ${
                plan.highlight
                  ? "border-brand-400 dark:border-brand-500 bg-brand-50/60 dark:bg-brand-500/10 shadow-popover sm:scale-[1.02]"
                  : "border-ink-100 dark:border-[#1C1C1C] bg-white dark:bg-[#0D0D0D]"
              }`}
            >
              {plan.highlight && (
                <span className="self-start text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-500/20 px-3 py-1 rounded-full mb-3">
                  Популярный
                </span>
              )}
              <p className="font-bold text-xl text-ink-900 dark:text-white">{plan.name}</p>
              <p className="text-ink-400 dark:text-ink-500 mb-5">{plan.price}</p>
              <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-ink-600 dark:text-ink-300 flex items-center gap-2">
                    <span className="text-brand-500 dark:text-brand-400 font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full font-semibold py-3 rounded-xl transition-colors ${
                  plan.highlight
                    ? "bg-brand-600 hover:bg-brand-700 text-white"
                    : "bg-ink-100 dark:bg-[#171717] hover:bg-ink-200 dark:hover:bg-[#1E1E1E] text-ink-700 dark:text-ink-200"
                }`}
              >
                Выбрать план
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
