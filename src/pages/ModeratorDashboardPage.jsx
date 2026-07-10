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
      <div className="p-5 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white mb-5 sm:mb-6">Панель модератора</h1>

        <div style={{ scrollbarWidth: "none" }} className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-transparent sm:border-ink-100 dark:border-[#1C1C1C] px-4 py-2 flex gap-3 mb-5 sm:mb-6 overflow-x-auto transition-colors">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`relative py-2.5 px-3 sm:px-0 text-xs sm:text-sm hover:text-black dark:hover:text-[#FFFFFF] font-medium transition-colors whitespace-nowrap ${activeTab === t.id ? "text-black sm:border-none border rounded-xl dark:text-[#FFFFFF]" : "text-[#8A8A8A]"
                }`}
            >
              {activeTab === t.id && (
                <motion.div layoutId="seller-tab-bg" className="absolute inset-0 bg-brand-500/15 rounded-xl -z-10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              {t.label}
              {activeTab === t.id && (
                <motion.div
                  layoutId="seller-tab-border"
                  className="hidden sm:block absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A94FF]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
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
