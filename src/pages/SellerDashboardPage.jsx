import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AddCircle } from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import OverviewTab from "../components/seller/OverviewTab";
import ProductsTab from "../components/seller/ProductsTab";
import RequestsTab from "../components/seller/RequestsTab";
import MessagesTab from "../components/seller/MessagesTab";
import SettingsTab from "../components/seller/SettingsTab";
import AddProductModal from "../components/seller/AddProductModal";

const tabs = [
  { id: "overview", label: "Обзор", Component: OverviewTab },
  { id: "products", label: "Товары", Component: ProductsTab },
  { id: "requests", label: "Запросы", Component: RequestsTab },
  { id: "messages", label: "Сообщения", Component: MessagesTab },
  { id: "settings", label: "Настройки", Component: SettingsTab },
];

export default function SellerDashboardPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [modalOpen, setModalOpen] = useState(false);

  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.Component || OverviewTab;

  return (
    <AppShell>
      <div className="p-5 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white">Панель продавца</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#1A94FF] hover:bg-brand-700 text-white dark:text-black text-sm font-semibold px-2.5 py-3 rounded-xl transition-colors shrink-0"
          >
            <AddCircle size={24} /> Добавить товар
          </button>
        </div>

        <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] px-4 py-2 flex gap-3 mb-5 sm:mb-6 overflow-x-auto transition-colors">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`relative py-2.5 text-xs sm:text-sm hover:text-black dark:hover:text-[#FFFFFF] font-medium transition-colors whitespace-nowrap ${
                activeTab === t.id ? "text-black dark:text-[#FFFFFF]" : "text-[#8A8A8A]"
              }`}
            >
              {activeTab === t.id && (
                <motion.div layoutId="seller-tab-bg" className="absolute inset-0 bg-brand-500/15 rounded-xl -z-10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              {t.label}
              {activeTab === t.id && (
                <motion.div
                  layoutId="seller-tab-border"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A94FF]"
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

      <AddProductModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </AppShell>
  );
}
