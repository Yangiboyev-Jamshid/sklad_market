import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Box, I3DSquare, Eye, Heart } from "iconsax-reactjs";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import ProductThumb from "../ui/ProductThumb";
import { useTheme } from "../../context/ThemeContext";
import { getMyCompany, getSellerDashboard } from "../../api/api";

const PRODUCT_STATUS_MAP = {
  PENDING: { label: "На модерации", cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  ACTIVE: { label: "Активен", cls: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400" },
  REJECTED: { label: "Отклонён", cls: "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400" },
  ARCHIVED: { label: "Архив", cls: "bg-ink-100 dark:bg-[#1C1C1C] text-ink-500 dark:text-ink-400" },
};

function productStatusBadge(status) {
  const s = PRODUCT_STATUS_MAP[status] ?? { label: status, cls: "bg-ink-100 text-ink-500" };
  return <span className={`text-xs font-medium px-2 py-1 rounded-[4px] shrink-0 ${s.cls}`}>{s.label}</span>;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#171717] border border-ink-100 dark:border-[#1C1C1C] shadow-lg">
      <p className="mb-2 text-[10px] text-[#7D8794]">{label}</p>
      <div className="flex gap-5">
        <div>
          <p className="mb-1 text-sm font-medium text-ink-900 dark:text-white">Просмотры</p>
          <p className="text-lg font-medium text-[#3B72F6]">{row.views}</p>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-ink-900 dark:text-white">Запросы</p>
          <p className="text-lg font-medium text-[#3B72F6]">{row.leads}</p>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-ink-900 dark:text-white">Чаты</p>
          <p className="text-lg font-medium text-[#3B72F6]">{row.chats}</p>
        </div>
      </div>
    </div>
  );
}

export default function OverviewTab() {
  const { theme } = useTheme();
  const tickColor = theme === "dark" ? "#565C66" : "#667085";
  const gridColor = theme === "dark" ? "#20242A" : "#E5E7EB";

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCompany()
      .then((company) => getSellerDashboard({ companyId: company.id }))
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, []);

  const summary = dashboard?.summary;
  const trend = dashboard?.trend;
  const recentProducts = dashboard?.recentProducts ?? [];
  const chartData = (trend?.labels ?? []).map((label, i) => ({
    month: label,
    views: trend.viewsSeries?.[i] ?? 0,
    leads: trend.leadsSeries?.[i] ?? 0,
    chats: trend.chatsSeries?.[i] ?? 0,
  }));

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-1.5">
        <StatCard label="Активные товары" value={loading ? "…" : summary?.activeProducts ?? 0} icon={Box} color="brand" />
        <StatCard label="Запросы" value={loading ? "…" : summary?.leads ?? 0} icon={I3DSquare} color="purple" />
        <StatCard label="Контакты" value={loading ? "…" : summary?.contacts ?? 0} icon={I3DSquare} color="purple" />
        <StatCard label="Просмотры" value={loading ? "…" : summary?.totalViews ?? 0} icon={Eye} color="blue" />
        <StatCard label="Избранное" value={loading ? "…" : summary?.totalFavorites ?? 0} icon={Heart} color="pink" />
      </div>

      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] px-4 py-5 sm:px-9 sm:py-7 transition-colors">
        <p className="mb-5 text-2xl font-bold text-ink-900 dark:text-white">Тренд</p>
        <div className="hidden sm:grid sm:grid-cols-3 gap-4 sm:gap-10 mb-3">
          <div>
            <p className="text-sm font-medium text-[#9AA4B2]">Просмотры</p>
            <p className="text-3xl font-medium text-ink-900 dark:text-white">{trend?.totalViews ?? 0}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#9AA4B2]">Запросы</p>
            <p className="text-3xl font-medium text-[#3B72F6]">{trend?.totalLeads ?? 0}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#9AA4B2]">Чаты</p>
            <p className="text-3xl font-medium text-[#3B72F6]">{trend?.totalChats ?? 0}</p>
          </div>
        </div>
        <div className="h-72 sm:h-[330px] -ml-2 sm:-ml-4">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E6FFC" stopOpacity={0.22} />
                  <stop offset="85%" stopColor="#2E6FFC" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} vertical stroke={gridColor} strokeDasharray="4 4" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: tickColor }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: tickColor }} allowDecimals={false} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#3B72F6", strokeDasharray: "4 4", strokeWidth: 1.5 }}
                wrapperStyle={{ outline: "none" }}
              />
              <Area type="linear" dataKey="views" stroke="#3B72F6" strokeWidth={2} fill="url(#trendFill)" dot={false} activeDot={{ r: 7, fill: "#0D0D0D", stroke: "#3B72F6", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
        <div className="flex items-start sm:items-center justify-between mb-4 gap-5">
          <p className="font-semibold text-[20px] sm:text-[24px] text-ink-900 dark:text-white">Недавние товары</p>
        </div>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[66px] rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
            ))}
          </div>
        ) : recentProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-400 gap-2">
            <Box size={36} />
            <p className="text-sm">Товаров пока нет</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentProducts.map((p) => (
              <div key={p.productId} className="flex items-center gap-3 sm:gap-4 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-3">
                <div className="w-[126px] h-[66px] flex items-center justify-center sm:w-[126px] sm:h-[66px] bg-[#E2E2E2] dark:bg-[#2A2A2A] rounded-lg overflow-hidden shrink-0">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <ProductThumb width="21" height="8" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-[8.25px] text-ink-400 dark:text-ink-500 mt-1">{p.price?.toLocaleString()} {p.currency}</p>
                  <p className="text-[8.25px] text-ink-400 dark:text-ink-500 mt-1">{p.viewsCount ?? 0} просмотров · {p.favoritesCount ?? 0} в избранном</p>
                </div>
                {productStatusBadge(p.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colorMap = {
    brand: "bg-brand-600",
    purple: "bg-purple-500",
    blue: "bg-blue-500",
    pink: "bg-pink-500",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#F5F5F5] dark:bg-[#171717] rounded-2xl p-4 sm:p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-[#8A8A8A]">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white dark:text-[#0D0D0D] shrink-0 ${colorMap[color]}`}>
        <Icon size={20} variant="Outline" />
      </div>
    </motion.div>
  );
}
