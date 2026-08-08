import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Box, SearchNormal1, Sort, Image } from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import ProductCard from "../components/ui/ProductCard";
import PillToggle from "../components/ui/PillToggle";
import BannerCarousel from "../components/ui/BannerCarousel";
import SearchSuggestions from "../components/ui/SearchSuggestions";
import { Input } from "antd";
import Catalog from "../components/modal/Catalog";
import { getCatalogBySaleType, searchProducts, getPopularProducts, getAllProducts } from "../api/api";
import { usePublicBanners } from "../hooks/usePublicBanners";
import { getPublicCompanyExtras } from "../utils/companyExtras";

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = prev[j];
      prev[j] = a[i - 1] === b[j - 1] ? diag : 1 + Math.min(diag, prev[j], prev[j - 1]);
      diag = temp;
    }
  }
  return prev[n];
}

function nameSimilarity(query, name) {
  const q = (query || "").toLowerCase().trim();
  const n = (name || "").toLowerCase().trim();
  if (!q || !n) return 0;
  if (n.includes(q)) return 1;
  let best = q.length;
  if (n.length <= q.length) {
    best = levenshtein(q, n);
  } else {
    for (let i = 0; i <= n.length - q.length; i++) {
      const dist = levenshtein(q, n.slice(i, i + q.length));
      if (dist < best) best = dist;
      if (best === 0) break;
    }
  }
  return 1 - best / q.length;
}

function normalizeProduct(p, imageMap, companyMap, t) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price ?? 0,
    unit: p.currency ?? "UZS",
    minProduct: p.minProduct ?? p.min,
    measureUnit: p.unit,
    company: companyMap?.get(p.companyId)?.name ?? (p.companyId ? t("common.companyFallback", { id: p.companyId }) : ""),
    image: p.imageUrl ?? p.images?.find((img) => img.is_primary)?.url ?? p.images?.[0]?.url ?? imageMap?.get(p.id) ?? null,
    verified: p.status === "ACTIVE" || p.isPromoted,
  };
}

export default function HomePage() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [saleType, setSaleType] = useState("wholesale");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { banners, loading: bannersLoading } = usePublicBanners();
  const [imageMap, setImageMap] = useState(null);
  const [companyMap, setCompanyMap] = useState(null);
  const [allProducts, setAllProducts] = useState(null);
  const [topSuggestOpen, setTopSuggestOpen] = useState(false);
  const [heroSuggestOpen, setHeroSuggestOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    getAllProducts({ page: 1, perPage: 200 })
      .then((data) => {
        const items = data?.items ?? [];
        setAllProducts(items);
        const map = new Map();
        items.forEach((p) => {
          const url = p.images?.find((img) => img.is_primary)?.url ?? p.images?.[0]?.url;
          if (url) map.set(p.id, url);
        });
        setImageMap(map);
      })
      .catch(() => {
        setImageMap(new Map());
        setAllProducts([]);
      });

    getPublicCompanyExtras()
      .then(setCompanyMap)
      .catch(() => setCompanyMap(new Map()));
  }, []);

  useEffect(() => {
    if (imageMap === null || companyMap === null || allProducts === null) return;
    clearTimeout(debounceRef.current);
    let ignore = false;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (query.trim()) {
          const q = query.trim();
          const data = await searchProducts({ query: q, page: 1, perPage: 20 });
          if (ignore) return;
          const exact = data?.content ?? [];
          const exactIds = new Set(exact.map((p) => p.id));
          const fuzzy = allProducts
            .filter((p) => !exactIds.has(p.id))
            .map((p) => ({ product: p, score: nameSimilarity(q, p.name) }))
            .filter((x) => x.score >= 0.5)
            .sort((a, b) => b.score - a.score)
            .slice(0, Math.max(0, 20 - exact.length))
            .map((x) => x.product);
          setProducts([...exact, ...fuzzy].map((p) => normalizeProduct(p, imageMap, companyMap, t)));
        } else {
          const data = await getCatalogBySaleType(saleType.toUpperCase(), { page: 1, perPage: 20 });
          if (ignore) return;
          setProducts((data?.content ?? []).map((p) => normalizeProduct(p, imageMap, companyMap, t)));
        }
      } catch {
        try {
          const popular = await getPopularProducts({ page: 1, size: 20 });
          if (ignore) return;
          setProducts((popular?.content ?? []).map((p) => normalizeProduct(p, imageMap, companyMap, t)));
        } catch {
          if (!ignore) setProducts([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }, query ? 400 : 0);
    return () => { ignore = true; clearTimeout(debounceRef.current); };
  }, [query, saleType, imageMap, companyMap, allProducts, t]);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 md:p-10 bg-[#F9FAFB] dark:bg-[#121212]">
        <div className="relative mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium text-ink-700 dark:text-ink-200 hover:border-ink-300 dark:hover:border-ink-600 transition-colors shrink-0">
              {isOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9.16937 15.5794C8.97937 15.5794 8.78938 15.5094 8.63938 15.3594C8.34938 15.0694 8.34938 14.5894 8.63938 14.2994L14.2994 8.63938C14.5894 8.34938 15.0694 8.34938 15.3594 8.63938C15.6494 8.92937 15.6494 9.40937 15.3594 9.69937L9.69937 15.3594C9.55937 15.5094 9.35937 15.5794 9.16937 15.5794Z" fill="currentColor" />
                  <path d="M14.8294 15.5794C14.6394 15.5794 14.4494 15.5094 14.2994 15.3594L8.63938 9.69937C8.34938 9.40937 8.34938 8.92937 8.63938 8.63938C8.92937 8.34938 9.40937 8.34938 9.69937 8.63938L15.3594 14.2994C15.6494 14.5894 15.6494 15.0694 15.3594 15.3594C15.2094 15.5094 15.0194 15.5794 14.8294 15.5794Z" fill="currentColor" />
                </svg>
              ) : (
                <Sort size={24} variant="Linear" />
              )}
              <span className="sm:inline hidden">{t("nav.catalog")}</span>
            </button>
            <div className="relative flex w-full items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 sm:px-5 py-2.5 sm:py-3">
              <SearchNormal1 size={18} className="text-ink-400 shrink-0" />
              <input
                placeholder={t("common.searchProduct")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setTopSuggestOpen(true)}
                onBlur={() => setTimeout(() => setTopSuggestOpen(false), 120)}
                onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
                className="sm:w-full min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white"
              />
              {topSuggestOpen && (
                <SearchSuggestions
                  products={products.slice(0, 6)}
                  loading={loading}
                  onSelect={() => setTopSuggestOpen(false)}
                />
              )}
            </div>
          </div>
          <Catalog isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>

        <div className="mb-6 sm:mb-8 relative z-1">
          {bannersLoading ? (
            <div className="h-44 sm:h-56 rounded-2xl bg-ink-100 dark:bg-[#1C1C1C] animate-pulse" />
          ) : banners.length === 0 ? (
            < div className="flex flex-col items-center justify-center h-44 sm:h-[50vh] rounded-2xl border border-dashed border-ink-200 dark:border-[#2A2A2A] gap-2 text-ink-400 dark:text-ink-600">
              <Image size={32} />
              <p className="text-sm">{t("home.bannersEmpty")}</p>
            </div>
          ) : (
            <BannerCarousel banners={banners} />
          )}
        </div>

        <div className="mb-6 sm:mb-8 overflow-x-auto relative z-1">
          <PillToggle
            options={[
              { value: "wholesale", label: t("home.wholesale") },
              { value: "retail", label: t("home.retail") },
            ]}
            value={saleType}
            onChange={setSaleType}
            className="w-full scrollbar-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between px-1 sm:px-8 md:px-16 gap-3 mb-4 sm:mb-5 relative z-1">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-ink-900 dark:text-white">{t("home.popularProducts")}</h2>
          <div className="relative sm:flex items-center w-full sm:w-64">
            <Input
              placeholder={t("common.searchProduct")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setHeroSuggestOpen(true)}
              onBlur={() => setTimeout(() => setHeroSuggestOpen(false), 120)}
              prefix={<SearchNormal1 size="24" className="text-ink-500 dark:text-ink-400 mr-2" />}
              className="!rounded-chip px-4 py-2 text-sm bg-white dark:bg-[#0D0D0D] dark:text-white dark:[&_input]:text-white dark:[&_input]:placeholder:text-ink-500"
            />
            {heroSuggestOpen && (
              <SearchSuggestions
                products={products.slice(0, 6)}
                loading={loading}
                onSelect={() => setHeroSuggestOpen(false)}
              />
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 px-1 sm:px-8 md:px-16 sm:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-6 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] h-64 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="mb-3 text-ink-400 dark:text-ink-600">
              <Box size="54" />
            </p>
            <p className="text-base font-semibold text-ink-700 dark:text-white">{t("home.productsNotFound")}</p>
            {query && (
              <p className="text-sm text-ink-400 mt-1">{t("common.tryAnotherQuery")}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 px-1 sm:px-8 md:px-16 sm:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-6 sm:gap-5">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </AppShell >
  );
}
