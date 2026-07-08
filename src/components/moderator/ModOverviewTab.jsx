import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Box, I3DSquare, Buildings2, Flag } from "iconsax-reactjs";
import ProductThumb from "../ui/ProductThumb";
import { getAdminDashboard, getProductModerationQueue, getCompanyModerationQueue } from "../../api/api";

export default function ModOverviewTab() {
  const [stats, setStats] = useState(null);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminDashboard().catch(() => null),
      getProductModerationQueue().catch(() => []),
      getCompanyModerationQueue().catch(() => []),
    ]).then(([dashboard, products, companies]) => {
      setStats(dashboard);
      setPendingProducts((products ?? []).slice(0, 3));
      setPendingCompanies((companies ?? []).slice(0, 2));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-1.5">
        <StatCard label="На проверке товаров" value={stats?.pendingProducts ?? (loading ? "…" : 0)} icon={Box} color="dark:bg-[#5860BB] bg-[#4851B1]" />
        <StatCard label="Компании в ожидании" value={stats?.pendingCompanies ?? (loading ? "…" : 0)} icon={I3DSquare} color="bg-[#9C48B1] dark:bg-[#A758BB]" />
        <StatCard label="Жалобы" value={stats?.openReports ?? (loading ? "…" : 0)} icon={Flag} color="bg-[#9C48B1] dark:bg-[#A758BB]" />
      </div>

      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
        <p className="font-semibold text-ink-900 text-[24px] dark:text-white mb-4">Ожидают проверки</p>
        <div className="flex flex-col gap-3">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />)
          ) : pendingProducts.length === 0 && pendingCompanies.length === 0 ? (
            <p className="text-center py-8 text-ink-400 text-sm">Нет объектов, ожидающих проверки</p>
          ) : (
            <>
              {pendingProducts.map((p) => (
                <div key={`p-${p.id}`} className="flex items-center gap-3 sm:gap-4 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-3">
                  <div className="w-11 h-11 sm:w-[126px] sm:h-[66px] flex items-center justify-center bg-[#E2E2E2] dark:bg-[#2A2A2A] rounded-lg overflow-hidden shrink-0">
                    <ProductThumb width="21" height="9" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-[#7F7F7F] mt-3">{p.price} {p.currency}</p>
                  </div>
                  <span className="text-xs font-medium px-2.5 sm:px-3 py-1 rounded-[4px] whitespace-nowrap bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    Товар
                  </span>
                </div>
              ))}
              {pendingCompanies.map((c) => (
                <div key={`c-${c.id}`} className="flex items-center gap-3 sm:gap-4 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-3">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    <Buildings2 size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{c.name}</p>
                    {c.stir && <p className="text-xs text-[#7F7F7F] mt-3">ИНН: {c.stir}</p>}
                  </div>
                  <span className="text-xs font-medium px-2.5 sm:px-3 py-1 rounded-[4px] whitespace-nowrap bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    Компания
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#F5F5F5] border border-[#F0F0F0] dark:border-[#1C1C1C] dark:bg-[#171717] rounded-2xl p-4 sm:p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-[#8A8A8A]">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white dark:text-black ${color} shrink-0`}>
        <Icon size={20} variant="Outline" />
      </div>
    </motion.div>
  );
}
