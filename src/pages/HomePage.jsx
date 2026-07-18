import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Box, SearchNormal1, Sort, Image } from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import ProductCard from "../components/ui/ProductCard";
import PillToggle from "../components/ui/PillToggle";
import { Input } from "antd";
import Catalog from "../components/modal/Catalog";
import { getHomepageData, getCatalogBySaleType, searchProducts, getPopularProducts, getAllProducts } from "../api/api";

function normalizeProduct(p, imageMap, t) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price ?? 0,
    unit: p.currency ?? "UZS",
    company: p.companyId ? t("common.companyFallback", { id: p.companyId }) : "",
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
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [imageMap, setImageMap] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    getAllProducts({ page: 1, perPage: 200 })
      .then((data) => {
        const map = new Map();
        (data?.items ?? []).forEach((p) => {
          const url = p.images?.find((img) => img.is_primary)?.url ?? p.images?.[0]?.url;
          if (url) map.set(p.id, url);
        });
        setImageMap(map);
      })
      .catch(() => setImageMap(new Map()));
  }, []);

  useEffect(() => {
    getHomepageData()
      .then((data) => {
        setBanners(
          (data?.banners ?? []).map((b) => ({ id: b.id, img: b.imageUrl, href: b.targetUrl }))
        );
      })
      .catch(() => setBanners([]))
      .finally(() => setBannersLoading(false));
  }, []);

  useEffect(() => {
    if (imageMap === null) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (query.trim()) {
          const data = await searchProducts({ query: query.trim(), page: 1, perPage: 20 });
          setProducts((data?.content ?? []).map((p) => normalizeProduct(p, imageMap, t)));
        } else {
          const data = await getCatalogBySaleType(saleType.toUpperCase(), { page: 1, perPage: 20 });
          setProducts((data?.content ?? []).map((p) => normalizeProduct(p, imageMap, t)));
        }
      } catch {
        try {
          const popular = await getPopularProducts({ page: 1, size: 20 });
          setProducts((popular?.content ?? []).map((p) => normalizeProduct(p, imageMap, t)));
        } catch {
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    }, query ? 400 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [query, saleType, imageMap, t]);

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
            <div className="flex w-full items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 sm:px-5 py-2.5 sm:py-3">
              <SearchNormal1 size={18} className="text-ink-400 shrink-0" />
              <input
                placeholder={t("common.searchProduct")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="sm:w-full min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white"
              />
            </div>
          </div>
          <Catalog isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>

        <div className="mb-6 sm:mb-8 relative z-1">
          {bannersLoading ? (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 sm:h-40 w-[80%] xs:w-[72%] sm:w-[280px] lg:w-[312px] shrink-0 rounded-2xl bg-ink-100 dark:bg-[#1C1C1C] animate-pulse"
                />
              ))}
            </div>
          ) : banners.length === 0 ? (
            < div className="flex flex-col items-center justify-center h-32 sm:h-40 rounded-2xl border border-dashed border-ink-200 dark:border-[#2A2A2A] gap-2 text-ink-400 dark:text-ink-600">
              <Image size={32} />
              <p className="text-sm">{t("home.bannersEmpty")}</p>
            </div>
          ) : (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
              {banners.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="overflow-hidden relative h-32 sm:h-40 w-[80%] xs:w-[72%] sm:w-[280px] lg:w-[320px] shrink-0 snap-center rounded-2xl flex items-center justify-center cursor-pointer hover:scale-[1.01] transition-transform"
                >
                  <img src={b.img} alt="banner" className="object-cover w-full h-full" />
                </motion.div>
              ))}
            </div>
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
          <div className="sm:flex items-center w-full sm:w-64">
            <Input
              placeholder={t("common.searchProduct")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              prefix={<SearchNormal1 size="24" className="text-ink-500 dark:text-ink-400 mr-2" />}
              className="!rounded-chip px-4 py-2 text-sm bg-white dark:bg-[#0D0D0D] dark:text-white dark:[&_input]:text-white dark:[&_input]:placeholder:text-ink-500"
            />
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
