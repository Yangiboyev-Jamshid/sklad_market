import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppShell from "../components/layout/AppShell";
import ModOverviewTab from "../components/moderator/ModOverviewTab";
import ModProductsTab from "../components/moderator/ModProductsTab";
import ModCompaniesTab from "../components/moderator/ModCompaniesTab";
import ComplaintsTab from "../components/moderator/ComplaintsTab";
import AccountsTab from "../components/moderator/AccountsTab";

const tabs = [
  { id: "overview", label: "Обзор", Component: ModOverviewTab },
  { id: "products", label: "Товары", Component: ModProductsTab },
  { id: "companies", label: "Компании", Component: ModCompaniesTab },
  { id: "complaints", label: "Жалобы", Component: ComplaintsTab },
  { id: "accounts", label: "Аккаунты", Component: AccountsTab },
];

export default function ModeratorDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.Component || ModOverviewTab;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white mb-5 sm:mb-6">Панель модератора</h1>

        <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-1.5 flex gap-1 mb-5 sm:mb-6 overflow-x-auto transition-colors">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`relative px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === t.id ? "text-brand-600 dark:text-brand-400" : "text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
              }`}
            >
              {activeTab === t.id && (
                <motion.div layoutId="mod-tab-bg" className="absolute inset-0 bg-brand-50 dark:bg-brand-500/15 rounded-xl -z-10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
