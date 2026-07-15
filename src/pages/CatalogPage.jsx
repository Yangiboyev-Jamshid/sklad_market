import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SearchNormal1, ArrowDown2, CloseCircle, GlobalSearch, Filter } from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import ProductCard from "../components/ui/ProductCard";
import MapView from "../components/ui/MapView";
import { getAllProducts, searchProducts, getCategories, getCatalogMap, getSearchSuggestions, getCatalogFilters, getCategoryCounts } from "../api/api";
import { buildProductMapPins } from "../utils/mapPins";

function normalizeProduct(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price ?? 0,
    unit: p.currency ?? "UZS",
    company: p.companyId ? `Компания #${p.companyId}` : "",
    image: p.imageUrl ?? p.images?.find((img) => img.is_primary)?.url ?? p.images?.[0]?.url ?? null,
    verified: p.status === "ACTIVE",
  };
}

export default function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategoryState] = useState(searchParams.get("category") ?? "all");

  const setActiveCategory = (id) => {
    setActiveCategoryState(id);
    setSearchParams(id === "all" ? {} : { category: id }, { replace: true });
  };
  const [view, setView] = useState("grid");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [filterMeta, setFilterMeta] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [mapPins, setMapPins] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const debounceRef = useRef(null);
  const suggestDebounceRef = useRef(null);

  useEffect(() => {
    if (view !== "map" || mapLoaded) return;
    const id = setTimeout(() => {
      setMapLoading(true);
    }, 0);
    getCatalogMap({ page: 1, perPage: 200 })
      .then((data) => {
        setMapPins(buildProductMapPins(data?.items ?? [], navigate));
      })
      .catch(() => setMapPins([]))
      .finally(() => {
        setMapLoading(false);
        setMapLoaded(true);
      });
    return () => clearTimeout(id);
  }, [view, mapLoaded, navigate]);

  useEffect(() => {
    getCategories({ page: 0, size: 100 })
      .then((data) => {
        const all = (data?.content ?? []).filter((c) => c.isActive && (!c.parentId || c.parentId === 0));
        all.sort((a, b) => a.sortOrder - b.sortOrder);
        setCategories(all.map((c) => ({
          id: String(c.id),
          name: c.nameRu || c.nameUz || c.slug,
          icon: c.icon,
        })));
      })
      .catch(() => { });

    getCategoryCounts()
      .then((rows) => {
        const map = {};
        (rows ?? []).forEach((r) => { map[r.categoryId] = r.count; });
        setCategoryCounts(map);
      })
      .catch(() => { });

    getCatalogFilters()
      .then(setFilterMeta)
      .catch(() => { });
  }, []);

  useEffect(() => {
    clearTimeout(suggestDebounceRef.current);
    if (!query.trim()) {
      suggestDebounceRef.current = setTimeout(() => setSuggestions([]), 0);
      return () => clearTimeout(suggestDebounceRef.current);
    }
    suggestDebounceRef.current = setTimeout(() => {
      getSearchSuggestions(query.trim()).then(setSuggestions).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(suggestDebounceRef.current);
  }, [query]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const category = activeCategory !== "all" ? activeCategory : undefined;
    const filterParams = {
      minPrice: minPrice.trim() ? Number(minPrice) : undefined,
      maxPrice: maxPrice.trim() ? Number(maxPrice) : undefined,
      inStock: inStockOnly || undefined,
      verified: verifiedOnly || undefined,
    };
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (query.trim()) {
          const data = await searchProducts({ query: query.trim(), page: 1, perPage: 40, category, ...filterParams });
          setProducts((data?.content ?? []).map(normalizeProduct));
          setTotal(data?.totalElements ?? 0);
        } else {
          const data = await getAllProducts({ page: 1, perPage: 40, category, ...filterParams });
          setProducts((data?.items ?? []).map(normalizeProduct));
          setTotal(data?.meta?.total ?? 0);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, query ? 400 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [query, activeCategory, minPrice, maxPrice, inStockOnly, verifiedOnly]);

  return (
    <AppShell>
      <div className="mx-auto h-full px-4 sm:p-10 py-5 dark:bg-[#121212] bg-[#F9FAFB]">
        <div className="flex flex-col items-center sm:flex-row justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="hidden sm:block ">
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white">Каталог товаров</h1>
            <p className="text-sm text-ink-400 dark:text-white mt-1">
              {loading ? "Загрузка..." : `${total} товаров`}
            </p>
          </div>
          <div className="sm:flex grid grid-cols-[1fr_1.1fr] sm:w-auto w-full h-full items-center gap-2 sm:gap-3">
            <SearchBox
              wrapperClass="hidden sm:block sm:w-64"
              query={query}
              setQuery={setQuery}
              suggestions={suggestions}
              suggestionsOpen={suggestionsOpen}
              setSuggestionsOpen={setSuggestionsOpen}
            />
            <button
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden text-sm flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 py-2.5 text-sm font-medium text-ink-700 dark:text-ink-200 shrink-0"
            >
              <Filter size={24} /> Фильтр
            </button>
            <button
              onClick={() => setView(view === "grid" ? "map" : "grid")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shrink-0 ${view === "map" ? "bg-brand-600 text-white" : "bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] text-ink-700 dark:text-ink-200 hover:border-ink-300 dark:hover:border-ink-600"
                }`}
            >
              <GlobalSearch size={24} />
              Поиск по карте
            </button>
          </div>
        </div>
        <SearchBox
          wrapperClass="sm:hidden mb-6"
          query={query}
          setQuery={setQuery}
          suggestions={suggestions}
          suggestionsOpen={suggestionsOpen}
          setSuggestionsOpen={setSuggestionsOpen}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-3">
          <aside className="hidden sticky top-2 lg:block bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] px-4 py-6 h-fit transition-colors">
            <FiltersContent
              categories={categories}
              categoryCounts={categoryCounts}
              filterMeta={filterMeta}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
              verifiedOnly={verifiedOnly}
              setVerifiedOnly={setVerifiedOnly}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
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
                  className="lg:hidden fixed inset-0  overflow-y-auto bg-white dark:bg-[#121212] z-50 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-ink-900 dark:text-white">Фильтры</p>
                    <button onClick={() => setFiltersOpen(false)} className="text-ink-400">
                      <CloseCircle size={24} />
                    </button>
                  </div>
                  <FiltersContent
                    categories={categories}
                    categoryCounts={categoryCounts}
                    filterMeta={filterMeta}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    inStockOnly={inStockOnly}
                    setInStockOnly={setInStockOnly}
                    verifiedOnly={verifiedOnly}
                    setVerifiedOnly={setVerifiedOnly}
                    minPrice={minPrice}
                    setMinPrice={setMinPrice}
                    maxPrice={maxPrice}
                    setMaxPrice={setMaxPrice}
                    showHeader={false}
                  />
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="w-full bg-brand-600 text-white font-semibold py-3.5 rounded-2xl mt-2"
                  >
                    Сохранить
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-6 sm:gap-5 content-start sm:px-6">
              {loading
                ? Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] h-72 animate-pulse" />
                ))
                : products.length === 0
                  ? <p className="col-span-3 text-center py-16 text-ink-400">Товары не найдены</p>
                  : products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
              }
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="sm:bg-white sm:dark:bg-[#0D0D0D] rounded-2xl sm:border border-ink-100 dark:border-ink-800 p-4 sm:p-5 transition-colors"
            >
              <p className="font-semibold text-ink-900 dark:text-white mb-4">Карта с товарами</p>
              {mapLoading ? (
                <div className="h-[400px] sm:h-[600px] rounded-2xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
              ) : (
                <MapView pins={mapPins} height="h-[60vh] sm:h-[600px]" />
              )}
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function SearchBox({ wrapperClass, query, setQuery, suggestions, suggestionsOpen, setSuggestionsOpen }) {
  return (
    <div className={`relative ${wrapperClass}`}>
      <div className="flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 py-2.5 w-full">
        <SearchNormal1 size={24} className="text-ink-400 shrink-0" />
        <input
          placeholder="Поиск товара"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSuggestionsOpen(true); }}
          onFocus={() => setSuggestionsOpen(true)}
          onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
          className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white"
        />
      </div>
      {suggestionsOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl shadow-popover z-20 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => { setQuery(s); setSuggestionsOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-[#171717] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FiltersContent({
  categories = [],
  categoryCounts = {},
  filterMeta,
  activeCategory,
  setActiveCategory,
  inStockOnly,
  setInStockOnly,
  verifiedOnly,
  setVerifiedOnly,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  showHeader = true,
}) {
  const resetFilters = () => {
    setActiveCategory("all");
    setInStockOnly(false);
    setVerifiedOnly(false);
    setMinPrice("");
    setMaxPrice("");
  };
  return (
    <>
      {showHeader && (
        <div className="flex items-center gap-2 font-semibold text-ink-900 dark:text-white mb-4">
          <Filter size={20} />
          Фильтры
        </div>
      )}

      <p className="text-xs font-medium text-black dark:text-ink-400 mb-2">Категории</p>
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
            {categoryCounts[c.id] > 0 && (
              <span className="text-ink-400 text-xs">{categoryCounts[c.id]}</span>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs font-medium text-black dark:text-white mb-2">Цены</p>
      <div className="flex flex-col gap-2 mb-5">
        <input
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          placeholder={filterMeta?.minPrice != null ? `от ${filterMeta.minPrice}` : "от"}
          className="bg-ink-50 dark:bg-[#0D0D0D] border dark:border-[#2D2D2D] rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-ink-400 dark:text-white"
        />
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder={filterMeta?.maxPrice != null ? `до ${filterMeta.maxPrice}` : "до"}
          className="bg-ink-50 dark:bg-[#0D0D0D] border dark:border-[#2D2D2D] rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-ink-400 dark:text-white"
        />
      </div>

      <p className="text-xs font-medium text-black dark:text-white mb-2">Регионы</p>
      <button className="w-full flex items-center justify-between bg-ink-50 dark:bg-[#0D0D0D] border dark:border-[#2D2D2D] rounded-xl px-4 py-2.5 text-sm text-ink-400 mb-5">
        Все регионы <ArrowDown2 size={16} />
      </button>

      <ToggleRow label="Только наличии" checked={inStockOnly} onChange={setInStockOnly} />
      <ToggleRow label="Верифицированные продавцы" checked={verifiedOnly} onChange={setVerifiedOnly} />

      <button
        onClick={resetFilters}
        className="w-full bg-danger-50 dark:bg-danger-500/10 text-danger-600 dark:text-danger-400 font-medium text-sm py-3 rounded-2xl mt-5 hover:bg-danger-100 dark:hover:bg-danger-500/20 transition-colors"
      >
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
