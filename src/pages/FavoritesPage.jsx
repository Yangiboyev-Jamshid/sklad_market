import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SearchNormal1, GlobalSearch, Heart } from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import ProductCard from "../components/ui/ProductCard";
import CompanyCard from "../components/ui/CompanyCard";
import PillToggle from "../components/ui/PillToggle";
import MapView from "../components/ui/MapView";
import { useCart } from "../context/CartContext";
import { getFavorites, getCompanyFavorites, getCatalogMap, getCompaniesMap } from "../api/api";
import { buildProductMapPins, buildCompanyMapPins } from "../utils/mapPins";

const MAP_PAGE_CAP = 10;

// Neither /catalog/map nor /companies/map can be filtered by a list of ids,
// so matching favorites against them means paging through the full dataset.
async function fetchAllCatalogMapItems() {
  const perPage = 200;
  const first = await getCatalogMap({ page: 1, perPage });
  const items = [...(first?.items ?? [])];
  const totalPages = Math.min(first?.meta?.totalPages ?? 1, MAP_PAGE_CAP);
  for (let page = 2; page <= totalPages; page++) {
    const data = await getCatalogMap({ page, perPage });
    items.push(...(data?.items ?? []));
  }
  return items;
}

async function fetchAllCompanyMapItems() {
  const per_page = 100;
  const first = await getCompaniesMap({ page: 1, per_page });
  const items = [...(first?.content ?? [])];
  const totalPages = Math.min(first?.totalPages ?? 1, MAP_PAGE_CAP);
  for (let page = 2; page <= totalPages; page++) {
    const data = await getCompaniesMap({ page, per_page });
    items.push(...(data?.content ?? []));
  }
  return items;
}

export default function FavoritesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { favorites, companyFavorites } = useCart();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingC, setLoadingC] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");

  const [productMapPins, setProductMapPins] = useState([]);
  const [productMapLoading, setProductMapLoading] = useState(false);
  const [productMapLoaded, setProductMapLoaded] = useState(false);

  const [companyMapPins, setCompanyMapPins] = useState([]);
  const [companyMapLoading, setCompanyMapLoading] = useState(false);
  const [companyMapLoaded, setCompanyMapLoaded] = useState(false);

  useEffect(() => {
    getFavorites({ page: 1, perPage: 100 })
      .then((data) => setProducts(data?.content ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingP(false));

    getCompanyFavorites({ page: 1, perPage: 100 })
      .then((data) => setCompanies(data?.content ?? []))
      .catch(() => setCompanies([]))
      .finally(() => setLoadingC(false));
  }, []);

  // Drop a card the instant its heart is unliked elsewhere (CartContext's
  // `favorites` set), instead of waiting for a refetch/reload. Only react to
  // true -> false transitions so the still-loading (empty) set on first
  // render can't wipe the freshly-fetched list.
  const prevFavoritesRef = useRef(null);
  useEffect(() => {
    if (!favorites) return;
    if (prevFavoritesRef.current) {
      const prev = prevFavoritesRef.current;
      setProducts((list) => list.filter((p) => !prev.has(p.id) || favorites.has(p.id)));
    }
    prevFavoritesRef.current = favorites;
  }, [favorites]);

  const prevCompanyFavoritesRef = useRef(null);
  useEffect(() => {
    if (!companyFavorites) return;
    if (prevCompanyFavoritesRef.current) {
      const prev = prevCompanyFavoritesRef.current;
      setCompanies((list) => list.filter((c) => !prev.has(c.id) || companyFavorites.has(c.id)));
    }
    prevCompanyFavoritesRef.current = companyFavorites;
  }, [companyFavorites]);

  useEffect(() => {
    // Wait for favorites to finish loading — building the map from `products`
    // while getFavorites is still in flight would use an empty favoriteIds
    // set, show a zero-pin map, and mark itself "loaded" so it never retries.
    if (view !== "map" || tab !== "products" || productMapLoaded || loadingP) return;
    const id = setTimeout(() => setProductMapLoading(true), 0);
    const favoriteIds = new Set(products.map((p) => p.id));
    // There is no "get map pins by product ids" endpoint, so page through the
    // whole marketplace map dataset and keep only the user's favorites —
    // capped at PAGE_CAP pages so a favorite can't be silently dropped just
    // because it's on page 2+.
    fetchAllCatalogMapItems()
      .then((items) => {
        const matched = items.filter((it) => favoriteIds.has(it.productId));
        setProductMapPins(buildProductMapPins(matched, navigate));
      })
      .catch(() => setProductMapPins([]))
      .finally(() => {
        setProductMapLoading(false);
        setProductMapLoaded(true);
      });
    return () => clearTimeout(id);
  }, [view, tab, products, productMapLoaded, loadingP, navigate]);

  useEffect(() => {
    if (view !== "map" || tab !== "companies" || companyMapLoaded || loadingC) return;
    const id = setTimeout(() => setCompanyMapLoading(true), 0);
    const favoriteIds = new Set(companies.map((c) => c.id));
    fetchAllCompanyMapItems()
      .then((items) => {
        const matched = items.filter((c) => favoriteIds.has(c.companyId));
        setCompanyMapPins(buildCompanyMapPins(matched, navigate));
      })
      .catch(() => setCompanyMapPins([]))
      .finally(() => {
        setCompanyMapLoading(false);
        setCompanyMapLoaded(true);
      });
    return () => clearTimeout(id);
  }, [view, tab, companies, companyMapLoaded, loadingC, navigate]);

  const normalizeProduct = (p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price ?? 0,
    unit: p.currency ?? "UZS",
    company: p.companyId ? t("common.companyFallback", { id: p.companyId }) : "",
    image: p.images?.find((img) => img.is_primary)?.url ?? p.images?.[0]?.url ?? null,
    verified: p.status === "ACTIVE",
  });

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCompanies = companies.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const loading = tab === "products" ? loadingP : loadingC;
  const isEmpty = tab === "products" ? filteredProducts.length === 0 : filteredCompanies.length === 0;

  return (
    <AppShell>
      <div className="mx-auto p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="sm:block hidden">
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white">{t("favorites.title")}</h1>
            <p className="text-sm text-ink-400 dark:text-ink-500 mt-1">
              {t("favorites.subtitle")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2">
            <div className="flex-1 sm:flex-none flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 py-2.5 sm:w-64">
              <SearchNormal1 size={16} className="text-ink-400 shrink-0" />
              <input
                placeholder={tab === "products" ? t("common.searchProduct") : t("common.searchCompany")}
                value={search}
                onChange={(e) => { setSearch(e.target.value); }}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white"
              />
            </div>
            <button
              onClick={() => setView(view === "grid" ? "map" : "grid")}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shrink-0 ${view === "map" ? "bg-brand-600 text-white" : "bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] text-ink-700 dark:text-ink-200 hover:border-ink-300 dark:hover:border-ink-600"
                }`}
            >
              <GlobalSearch size={24} />
              {t("common.searchByMap")}
            </button>
          </div>
        </div>

        <div className="mb-6 overflow-x-auto">
          <PillToggle
            options={[
              { value: "products", label: t("favorites.tabProducts") },
              { value: "companies", label: t("favorites.tabCompanies") },
            ]}
            value={tab}
            onChange={(value) => { setTab(value); setSearch(""); }}
            className="w-full"
          />
        </div>

        {view === "map" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors"
          >
            <p className="font-semibold text-ink-900 dark:text-white mb-4">
              {tab === "products" ? t("favorites.mapProducts") : t("favorites.mapCompanies")}
            </p>
            {(tab === "products" ? productMapLoading : companyMapLoading) ? (
              <div className="h-[400px] sm:h-[600px] rounded-2xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
            ) : (
              <MapView pins={tab === "products" ? productMapPins : companyMapPins} height="h-[400px] sm:h-[600px]" />
            )}
          </motion.div>
        ) : loading ? (
          <div className={`grid gap-3 sm:gap-5 ${tab === "products" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
            {Array.from({ length: tab === "products" ? 8 : 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] h-64 animate-pulse" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-4"><Heart size={24} /></p>
            <p className="text-lg font-semibold text-ink-700 dark:text-white">
              {search ? t("favorites.nothingFound") : tab === "products" ? t("favorites.noProducts") : t("favorites.noCompanies")}
            </p>
            <p className="text-sm text-ink-400 mt-1">
              {search ? t("common.tryAnotherQuery") : t("favorites.hint")}
            </p>
          </div>
        ) : tab === "products" ? (
          <div className="sm:px-[60px] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredProducts.map((p, i) => (
              <ProductCard key={p.id} product={normalizeProduct(p)} index={i} />
            ))}
          </div>
        ) : (
          <div className="sm:px-[60px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {filteredCompanies.map((c, i) => (
              <CompanyCard key={c.id} company={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
