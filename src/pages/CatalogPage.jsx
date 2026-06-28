import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchNormal1, FilterSearch, ArrowDown2, CloseCircle, GlobalSearch, Filter } from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import ProductCard from "../components/ui/ProductCard";
import MapView from "../components/ui/MapView";
import { categories, productGrid } from "../data/mockData";

const mapPins = [
  { id: 1, x: 78, y: 58, color: "red", label: 3 },
  { id: 2, x: 60, y: 40, color: "purple", label: 2 },
  { id: 3, x: 30, y: 58, color: "red", label: 4 },
  { id: 4, x: 56, y: 64, color: "purple", label: 3 },
  { id: 5, x: 70, y: 52, color: "red", label: 1 },
  { id: 6, x: 95, y: 50, color: "purple", label: 1 },
  {
    id: 7,
    x: 95,
    y: 48,
    color: "purple",
    label: 1,
    popover: [
      { name: "Листовая сталь 3мм", company: "UzMetallPro", rating: 5 },
      { name: "Листовая сталь 3мм", company: "UzMetallPro", rating: 4 },
      { name: "Листовая сталь 3мм", company: "UzMetallPro", rating: 3 },
    ],
  },
  { id: 8, x: 65, y: 78, color: "red", label: 2 },
  { id: 9, x: 87, y: 78, color: "purple", label: 4 },
];

export default function CatalogPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [view, setView] = useState("grid"); // 'grid' | 'map'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <AppShell>
      <div className="mx-auto px-4 sm:p-10 py-5 dark:bg-[#121212] bg-[#F9FAFB]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white">Каталог товаров</h1>
            <p className="text-sm text-ink-400 dark:text-white mt-1">1 500 товаров</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 sm:flex-none flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 py-2.5 sm:w-64">
              <SearchNormal1 size={24} className="text-ink-400 shrink-0" />
              <input placeholder="Поиск товара" className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white" />
            </div>
            <button
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-full px-4 py-2.5 text-sm font-medium text-ink-700 dark:text-ink-200 shrink-0"
            >
              <FilterSearch size={16} />
            </button>
            <button
              onClick={() => setView(view === "grid" ? "map" : "grid")}
              className={`hidden sm:flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shrink-0 ${view === "map" ? "bg-brand-600 text-white" : "bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] text-ink-700 dark:text-ink-200 hover:border-ink-300 dark:hover:border-ink-600"
                }`}
            >
              <GlobalSearch size={24} />
              Поиск по карте
            </button>
          </div>
        </div>

        <button
          onClick={() => setView(view === "grid" ? "map" : "grid")}
          className={`sm:hidden w-full flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors mb-4 ${view === "map" ? "bg-brand-600 text-white" : "bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-200"
            }`}
        >
          <GlobalSearch size={16} />
          {view === "map" ? "Вернуться к списку" : "Поиск по карте"}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-3">
          <aside className="hidden sticky top-2 lg:block bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] px-4 py-6 h-fit transition-colors">
            <FiltersContent
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
              verifiedOnly={verifiedOnly}
              setVerifiedOnly={setVerifiedOnly}
            />
          </aside>

          <AnimatePresence>
            {filtersOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setFiltersOpen(false)}
                  className="lg:hidden fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50"
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="lg:hidden fixed bottom-0 inset-x-0 max-h-[85vh] overflow-y-auto bg-white dark:bg-ink-900 rounded-t-3xl z-50 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-ink-900 dark:text-white">Фильтры</p>
                    <button onClick={() => setFiltersOpen(false)} className="text-ink-400">
                      <CloseCircle size={24} />
                    </button>
                  </div>
                  <FiltersContent
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    inStockOnly={inStockOnly}
                    setInStockOnly={setInStockOnly}
                    verifiedOnly={verifiedOnly}
                    setVerifiedOnly={setVerifiedOnly}
                    showHeader={false}
                  />
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="w-full bg-brand-600 text-white font-semibold py-3.5 rounded-xl mt-2"
                  >
                    Показать результаты
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 content-start px-6">
              {productGrid.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-ink-800 p-4 sm:p-5 transition-colors"
            >
              <p className="font-semibold text-ink-900 dark:text-white mb-4">Карта с товарами</p>
              <MapView pins={mapPins} height="h-[400px] sm:h-[600px]" />
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function FiltersContent({
  activeCategory,
  setActiveCategory,
  inStockOnly,
  setInStockOnly,
  verifiedOnly,
  setVerifiedOnly,
  showHeader = true,
}) {
  return (
    <>
      {showHeader && (
        <div className="flex items-center gap-2 font-semibold text-ink-900 dark:text-white mb-4">
          <Filter size={20} />
          Фильтры
        </div>
      )}

      <p className="text-xs font-medium text-ink-500 dark:text-ink-400 mb-2">Категории</p>
      <div className="flex flex-col gap-1 mb-5">
        <button
          onClick={() => setActiveCategory("all")}
          className={`text-left text-xs px-3 py-2.5 rounded-lg transition-colors ${activeCategory === "all"
            ? "bg-brand-50 dark:bg-[#00183A] text-brand-600 dark:text-[#2E6FFC] font-medium"
            : "text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800"
            }`}
        >
          Все категории
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`flex items-center justify-between text-left text-xs px-3 py-2.5 rounded-lg transition-colors ${activeCategory === c.id
              ? "bg-brand-50 dark:bg-[#00183A] text-brand-600 dark:text-[#2E6FFC] font-medium"
              : "text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800"
              }`}
          >
            {c.name}
            <span className="text-ink-400 text-xs">{c.count}</span>
          </button>
        ))}
      </div>

      <p className="text-xs font-medium text-ink-500 dark:text-white mb-2">Цены</p>
      <div className="flex flex-col gap-2 mb-5">
        <input placeholder="от" className="bg-ink-50 dark:bg-[#0D0D0D] border dark:border-[#2D2D2D] rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-ink-400 dark:text-white" />
        <input placeholder="до" className="bg-ink-50 dark:bg-[#0D0D0D] border dark:border-[#2D2D2D] rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-ink-400 dark:text-white" />
      </div>

      <p className="text-xs font-medium text-ink-500 dark:text-white mb-2">Регионы</p>
      <button className="w-full flex items-center justify-between bg-ink-50 dark:bg-[#0D0D0D] border dark:border-[#2D2D2D] rounded-xl px-4 py-2.5 text-sm text-ink-400 mb-5">
        Все регионы <ArrowDown2 size={16} />
      </button>

      <ToggleRow label="Только наличии" checked={inStockOnly} onChange={setInStockOnly} />
      <ToggleRow label="Верифицированные продавцы" checked={verifiedOnly} onChange={setVerifiedOnly} />

      <button className="w-full bg-danger-50 dark:bg-danger-500/10 text-danger-600 dark:text-danger-400 font-medium text-sm py-3 rounded-2xl mt-5 hover:bg-danger-100 dark:hover:bg-danger-500/20 transition-colors">
        Сбросить фильтры
      </button>
    </>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-start gap-3 py-2">
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${checked ? "bg-brand-600" : "bg-ink-200 dark:bg-[#1E1E1E]"}`}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-[#0D0D0D] rounded-full shadow"
          animate={{ x: checked ? 16 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
      <span className="text-sm text-ink-700 dark:text-ink-300">{label}</span>
    </div>
  );
}
