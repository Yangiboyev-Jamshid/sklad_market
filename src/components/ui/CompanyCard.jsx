import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TickCircle, Heart } from "iconsax-reactjs";
import { motion } from "framer-motion";
import { useCart } from "../../context/CartContext";
import { getCompanyBySlug, getCompanySummaryById } from "../../api/api";

const VERIFIED_STATUSES = ["VERIFIED", "ACTIVE"];

const descriptionCache = new Map();
function rememberDescription(c) {
  if (!c?.id) return;
  const text = c.shortDescription ?? c.description;
  if (text) descriptionCache.set(c.id, text);
}

function mergeDefined(base, fallback) {
  const merged = { ...fallback, ...base };
  for (const key of Object.keys(merged)) {
    if (merged[key] == null && fallback[key] != null) merged[key] = fallback[key];
  }
  return merged;
}

export default function CompanyCard({ company: companyProp, index = 0 }) {
  const { companyFavorites, toggleCompanyFavorite } = useCart();
  const [detail, setDetail] = useState(null);
  const [extrasFallback, setExtrasFallback] = useState(null);
  const company = detail ? mergeDefined(companyProp, detail) : companyProp;
  const logoUrl = company.logoUrl ?? extrasFallback?.logoUrl ?? null;
  const createdAt = company.createdAt ?? extrasFallback?.createdAt ?? null;
  const description = company.shortDescription ?? company.description ?? descriptionCache.get(company.id) ?? null;
  const isFav = companyFavorites?.has(company.id);

  useEffect(() => {
    rememberDescription(companyProp);
  }, [companyProp.id, companyProp.shortDescription, companyProp.description]);

  useEffect(() => {
    if (!companyProp.slug) return;
    let cancelled = false;
    getCompanyBySlug(companyProp.slug)
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [companyProp.slug]);

  useEffect(() => {
    if ((companyProp.logoUrl && companyProp.createdAt) || !companyProp.id) return;
    let cancelled = false;
    getCompanySummaryById(companyProp.id).then((summary) => {
      if (!cancelled) setExtrasFallback(summary ? { logoUrl: summary.logoUrl ?? null, createdAt: summary.createdAt ?? null } : null);
    });
    return () => { cancelled = true; };
  }, [companyProp.logoUrl, companyProp.createdAt, companyProp.id]);

  const initials = (company.name ?? "??")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isVerified = VERIFIED_STATUSES.includes(company.verificationStatus) || company.verified;
  const createdYear = createdAt ? new Date(createdAt).getFullYear() : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 overflow-hidden">
            {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <div>
            <div className="flex items-center mb-1 gap-1.5">
              <p className="font-semibold text-ink-900 dark:text-white text-sm">{company.name}</p>
              {isVerified && <TickCircle size={18} variant="Outline" className="text-brand-500 shrink-0" />}
            </div>
            <p className="text-xs text-ink-400 dark:text-ink-500">
              {[company.industry, company.city ?? company.address?.split(",")[0]?.trim()].filter(Boolean).join(" ")}
            </p>
            {createdYear && (
              <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">с {createdYear} г.</p>
            )}
          </div>
        </div>
        <button
          onClick={() => toggleCompanyFavorite(company.id)}
          className="shrink-0 p-1 hover:scale-110 transition-transform"
        >
          <Heart
            size={22}
            variant={isFav ? "Bold" : "Linear"}
            className={isFav ? "text-danger-500" : "text-ink-300 dark:text-ink-600"}
          />
        </button>
      </div>

      {description && (
        <p className="text-xs text-ink-400 dark:text-[#7F7F7F] leading-relaxed line-clamp-2">
          {description}
        </p>
      )}

      {(company.rating != null || company.reviews != null || company.productsCount != null) && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat value={company.rating ?? "—"} label="Рейтинг" />
          <Stat value={company.reviews ?? 0} label="Отзывы" />
          <Stat value={company.productsCount ?? 0} label="Товаров" />
        </div>
      )}

      <div className="flex justify-center items-center mt-auto">
        <Link
          to={`/company/${company.slug ?? company.id}`}
          className="text-xs sm:text-sm font-medium text-brand-600 dark:text-brand-400 flex items-center gap-1.5 hover:gap-2.5 transition-all"
        >
          Перейти на страницу компании <ArrowRight size={16} />
        </Link>
      </div>
    </motion.div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="bg-ink-50/70 dark:bg-[#171717] rounded-xl py-2.5 px-1">
      <p className="text-[17px] font-bold text-ink-900 dark:text-white">{value}</p>
      <p className="text-[11px] text-ink-400 dark:text-ink-500">{label}</p>
    </div>
  );
}
