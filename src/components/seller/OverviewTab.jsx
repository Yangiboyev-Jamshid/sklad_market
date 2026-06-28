import { motion } from "framer-motion";
import { Box, I3DSquare } from "iconsax-reactjs";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { trendData } from "../../data/mockData";
import ProductThumb from "../ui/ProductThumb";
import { useTheme } from "../../context/ThemeContext";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-xl px-2 py-1 text-xs">
      <p className="mb-2 text-[10px] text-[#7D8794]">{label} 2025</p>
      <div className="flex gap-9">
        <div>
          <p className="mb-1 text-sm font-medium text-ink-900 dark:text-white">Запасы</p>
          <p className="text-lg font-medium text-[#3B72F6]">{value}</p>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-ink-900 dark:text-white">Доход</p>
          <p className="text-lg font-medium text-[#3B72F6]">1 000$</p>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-ink-900 dark:text-white">Прибыль</p>
          <p className="text-lg font-medium text-[#3B72F6]">1 000$</p>
        </div>
      </div>
    </div>
  );
}

export default function OverviewTab() {
  const { theme } = useTheme();
  const tickColor = theme === "dark" ? "#565C66" : "#667085";
  const gridColor = theme === "dark" ? "#20242A" : "#E5E7EB";

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-1.5">
        <StatCard label="Активные товары" value="1 326" icon={Box} color="brand" />
        <StatCard label="Запросы" value="23" icon={I3DSquare} color="purple" />
        <StatCard label="Контакты" value="7" icon={I3DSquare} color="purple" />
      </div>

      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] px-4 py-5 sm:px-9 sm:py-7 transition-colors">
        <p className="mb-5 text-2xl font-bold text-ink-900 dark:text-white">Тренд</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-10 mb-3">
          <div>
            <p className="text-sm font-medium text-[#9AA4B2]">Запасы</p>
            <p className="text-3xl font-medium text-ink-900 dark:text-white">1500</p>
            <p className="text-sm text-[#9AA4B2]"><span className="font-semibold text-[#6EDB75]">+3,4%</span> за последний месяц</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#9AA4B2]">Общее доход продукции</p>
            <p className="text-3xl font-medium text-[#3B72F6]">3 500 $</p>
            <p className="text-sm text-[#9AA4B2]"><span className="font-semibold text-[#6EDB75]">+3,4%</span> за последний месяц</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#9AA4B2]">Общее прибыль продукции</p>
            <p className="text-3xl font-medium text-[#3B72F6]">3 500 $</p>
            <p className="text-sm text-[#9AA4B2]"><span className="font-semibold text-[#6EDB75]">+3,4%</span> за последний месяц</p>
          </div>
        </div>
        <div className="h-72 sm:h-[330px] -ml-2 sm:-ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E6FFC" stopOpacity={0.22} />
                  <stop offset="85%" stopColor="#2E6FFC" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} vertical stroke={gridColor} strokeDasharray="4 4" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: tickColor }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: tickColor }} ticks={[0, 200, 500, 700, 1000]} domain={[0, 1000]} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#3B72F6", strokeDasharray: "4 4", strokeWidth: 1.5 }}
                wrapperStyle={{ outline: "none" }}
              />
              <Area type="linear" dataKey="value" stroke="#3B72F6" strokeWidth={2} fill="url(#trendFill)" dot={false} activeDot={{ r: 7, fill: "#0D0D0D", stroke: "#3B72F6", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-ink-900 dark:text-white">Последние проданые товары</p>
          <button className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">Все товары</button>
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 sm:gap-4 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-3">
              <div className="w-12 h-12 flex items-center justify-center sm:w-[126px] sm:h-[66px] bg-[#E2E2E2] dark:bg-[#2A2A2A] overflow-hidden">
                <ProductThumb shape="coil" width="21" height="8"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">Оцинкованный рулон</p>
                <p className="text-[8.25px] text-ink-400 dark:text-ink-500 mt-1">Asia Steel Group</p>
                <p className="text-[8.25px] text-ink-400 dark:text-ink-500 mt-3">от 610 $ / тонна</p>
              </div>
              <span className="text-xs font-medium bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-400 px-2 py-1 rounded-[4px] shrink-0">Продано</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colorMap = {
    brand: "bg-brand-600",
    purple: "bg-purple-500",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#F5F5F5] dark:bg-[#171717] rounded-2xl p-4 sm:p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-ink-500 dark:text-ink-400">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white dark:text-[#0D0D0D] shrink-0 ${colorMap[color]}`}>
        <Icon size={20} variant="Outline" />
      </div>
    </motion.div>
  );
}
