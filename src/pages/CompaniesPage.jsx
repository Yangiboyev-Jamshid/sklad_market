import { useState } from "react";
import { SearchNormal1, ArrowDown2, GlobalSearch } from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import CompanyCard from "../components/ui/CompanyCard";
import MapView from "../components/ui/MapView";
import { companies } from "../data/mockData";

const mapPins = [
  { id: 1, x: 78, y: 50, color: "purple", label: 1 },
  { id: 2, x: 38, y: 36, color: "purple", label: 2 },
  { id: 3, x: 32, y: 56, color: "purple", label: 3 },
  { id: 4, x: 56, y: 72, color: "purple", label: 4 },
];

export default function CompaniesPage() {
  const [view, setView] = useState("grid");

  return (
    <AppShell>
      <div className="p-5 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white">Компании</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 sm:flex-none flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 py-2.5 sm:w-64">
              <SearchNormal1 size={24} className="text-black dark:text-white shrink-0" />
              <input placeholder="Поиск компании" className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white" />
            </div>
            <button
              onClick={() => setView(view === "grid" ? "map" : "grid")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shrink-0 ${
                view === "map" ? "bg-brand-600 text-white" : "bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] text-ink-700 dark:text-ink-200 hover:border-ink-300 dark:hover:border-ink-600"
              }`}
            >
              <GlobalSearch size={24} /> <span className="hidden sm:inline">Поиск по карте</span>
            </button>
          </div>
        </div>

        {view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 px-[130px]">
            {[...companies, ...companies, ...companies].slice(0, 9).map((c, i) => (
              <CompanyCard key={`${c.id}-${i}`} company={c} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-ink-900 dark:text-white">Карта с компаними</p>
              <button className="flex items-center gap-2 bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-2 text-sm text-ink-700 dark:text-ink-200">
                Ташкент <ArrowDown2 size={16} />
              </button>
            </div>
            <MapView pins={mapPins} height="h-[400px] sm:h-[600px]" center={{ x: 55, y: 50 }} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
