import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SearchNormal1, Buildings2, GlobalSearch } from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import CompanyCard from "../components/ui/CompanyCard";
import MapView from "../components/ui/MapView";
import { getPublicCompanies, searchCompanies, getCompaniesMap } from "../api/api";
import { buildCompanyMapPins } from "../utils/mapPins";

const DEFAULT_MAP_PINS = [
  {
    id: "default-1",
    lat: 41.311081,
    lng: 69.240562,
    color: "blue",
    label: 1,
    popover: [{ name: "UzMetallPro", company: "Ташкент, Чиланзарский р-н", verified: true }],
  },
  {
    id: "default-2",
    lat: 41.326386,
    lng: 69.288301,
    color: "blue",
    label: 2,
    popover: [{ name: "AltinCement", company: "Ташкент, Юнусабадский р-н", verified: false }],
  },
];

export default function CompaniesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);
  const [view, setView] = useState("grid");
  const [mapPins, setMapPins] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (view !== "map" || mapLoaded) return;
    const id = setTimeout(() => {
      setMapLoading(true);
    }, 0);
    getCompaniesMap({ page: 1, per_page: 100 })
      .then((data) => {
        const items = data?.content ?? [];
        const located = items.filter((c) => c.lat && c.lng);
        setMapPins(located.length === 0 ? DEFAULT_MAP_PINS : buildCompanyMapPins(located, navigate));
      })
      .catch(() => setMapPins(DEFAULT_MAP_PINS))
      .finally(() => {
        setMapLoading(false);
        setMapLoaded(true);
      });
    return () => clearTimeout(id);
  }, [view, mapLoaded, navigate]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (query.trim()) {
          const data = await searchCompanies({ query: query.trim(), page: 1, per_page: 30 });
          setCompanies(data?.content ?? []);
          setTotal(data?.totalElements ?? 0);
        } else {
          const data = await getPublicCompanies({ page: 1, per_page: 30 });
          setCompanies(data?.content ?? []);
          setTotal(data?.totalElements ?? 0);
        }
      } catch {
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    }, query ? 400 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <AppShell>
      <div className="p-5 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-10">
          <div className="sm:block hidden">
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white">{t("companies.title")}</h1>
            <p className="text-sm text-ink-400 mt-1">
              {loading ? t("common.loading") : t("companies.count", { count: total })}
            </p>
          </div>
          <div className="flex-col sm:flex-row flex sm:w-auto w-full h-full items-center gap-2 sm:gap-3">
            <div className="flex items-center w-full sm:w-auto gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 py-2.5 sm:w-64">
              <SearchNormal1 size={24} className="text-ink-400 shrink-0" />
              <input
                placeholder={t("common.searchCompany")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white"
              />
            </div>
            <button
              onClick={() => setView(view === "grid" ? "map" : "grid")}
              className={`flex items-center w-full sm:w-auto gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shrink-0 ${view === "map" ? "bg-brand-600 text-white" : "bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] text-ink-700 dark:text-ink-200 hover:border-ink-300 dark:hover:border-ink-600"
                }`}
            >
              <GlobalSearch size={24} />
              {t("common.searchByMap")}
            </button>
          </div>
        </div>

        {view === "map" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors"
          >
            <p className="font-semibold text-ink-900 dark:text-white mb-4">{t("companies.map")}</p>
            {mapLoading ? (
              <div className="h-[400px] sm:h-[600px] rounded-2xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
            ) : (
              <MapView pins={mapPins} height="h-[60vh] sm:h-[600px]" />
            )}
          </motion.div>
        ) : loading ? (
          <div className="sm:px-[60px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[255px] rounded-2xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-ink-400 gap-3">
            <Buildings2 size={48} />
            <p className="text-sm font-medium">{t("companies.notFound")}</p>
            {query && <p className="text-xs text-ink-400">{t("common.tryAnotherQuery")}</p>}
          </div>
        ) : (
          <div className="sm:px-[60px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {companies.map((c, i) => (
              <CompanyCard key={c.id} company={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
