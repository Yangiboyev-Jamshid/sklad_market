import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Call,
  Global,
  Location,
  Buildings,
  Buildings2,
  Box1,
  DocumentText,
  TickCircle,
  Message,
  Sms,
  GlobalSearch,
  SecurityUser,
  ArrowDown2,
  SearchNormal1,
  Filter,
  Flag,
} from "iconsax-reactjs";
import ReportModal from "../components/modal/ReportModal";
import ReviewModal from "../components/modal/ReviewModal";
import CreateCompanyForm from "../components/company/CreateCompanyForm";
import AppShell from "../components/layout/AppShell";
import MapView from "../components/ui/MapView";
import PillToggle from "../components/ui/PillToggle";
import RatingStars from "../components/ui/RatingStars";
import { useAuth } from "../context/AuthContext";
import { getCompanyBySlug, getMyCompany, getMyProducts, getCompanyProductsByCategory, getCompanyReviews, getCompanyRating, createCompanyReview, createChat, getCategoryTree, getCompanyBranches } from "../api/api";
import { CHAT_ENABLED } from "../config/chatConfig";
import ProductCard from "../components/ui/ProductCard";
import { getPublicCompanyExtras } from "../utils/companyExtras";
import { flattenCategoryTree } from "../utils/categories";
import { getLegalFormLabel } from "../data/legalForms";
import { UNIT_OPTIONS } from "../data/units";
import { calcCapacityUtilization } from "../utils/productionCapacity";

function normalizeProduct(p, t, companyName) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price ?? 0,
    unit: p.currency ?? "UZS",
    minProduct: p.minProduct ?? p.min,
    measureUnit: p.unit,
    company: companyName || (p.companyId ? t("common.companyFallback", { id: p.companyId }) : ""),
    image: p.images?.find((img) => img.is_primary)?.url ?? p.images?.[0]?.url ?? null,
    verified: p.status === "ACTIVE" || p.isPromoted,
    categoryId: p.category?.id ?? p.categoryId ?? null,
    rawStatus: p.status,
  };
}

const VERIFY_BADGE_KEYS = {
  VERIFIED: { labelKey: "profile.verifiedStatus", cls: "text-success-700 dark:text-success-400 bg-success-50 dark:bg-success-500/15" },
  PENDING: { labelKey: "profile.pendingStatus", cls: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" },
  DRAFT: { labelKey: "profile.draftStatus", cls: "text-ink-500 dark:text-ink-400 bg-ink-100 dark:bg-[#1C1C1C]" },
  REJECTED: { labelKey: "profile.rejectedStatus", cls: "text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10" },
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isOwnProfile = !id;

  const { user, isLoggedIn } = useAuth();
  const isSeller = user?.accountType === "seller";

  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("products");
  const [showMap, setShowMap] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatSubmittingRef = useRef(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSummary, setReviewSummary] = useState({ rating: 0, count: 0 });
  const [showReview, setShowReview] = useState(false);
  const [logoFallback, setLogoFallback] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allCategoryIds, setAllCategoryIds] = useState([]);
  const [productCategory, setProductCategory] = useState("all");

  useEffect(() => {
    getCategoryTree()
      .then((data) => {
        const all = [...(data ?? [])];
        all.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setCategories(all.map((c) => ({ id: String(c.id), name: c.name })));
        setAllCategoryIds(flattenCategoryTree(data).map((c) => c.id));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (company?.logoUrl || !company?.id) return;
    let cancelled = false;
    getPublicCompanyExtras().then((map) => {
      if (!cancelled) setLogoFallback({ id: company.id, logoUrl: map.get(company.id)?.logoUrl ?? null });
    });
    return () => { cancelled = true; };
  }, [company?.logoUrl, company?.id]);

  useEffect(() => {
    setLoading(true);
    setError("");
    let ignore = false;
    const fetcher = isOwnProfile ? getMyCompany() : getCompanyBySlug(id);
    fetcher
      .then((c) => {
        if (ignore) return;
        setCompany(c);
        if (c?.id) {
          getCompanyBranches(c.id)
            .then((branches) => { if (!ignore) setCompany((prev) => ({ ...prev, branches })); })
            .catch(() => {});
        }
      })
      .catch((err) => { if (!ignore) setError(err.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [id, isOwnProfile]);

  useEffect(() => {
    if (!company?.id) return;
    setProductsLoading(true);
    setProductsError("");
    let ignore = false;

    const onError = (err, source) => {
      if (ignore) return;
      console.error(`[ProfilePage] ${source} failed for company ${company.id}:`, err);
      setProductsError(err.message || "Unknown error");
      setProducts([]);
      setProductsTotal(0);
    };

    if (isOwnProfile) {
      getMyProducts({ page: 1, per_page: 100, company_id: company.id })
        .then((data) => {
          if (ignore) return;
          const all = (data?.items ?? data?.content ?? []).map((p) => normalizeProduct(p, t, company.name));
          setProductsTotal(data?.totalElements ?? data?.total ?? all.length);
          setProducts(
            productCategory !== "all" ? all.filter((p) => String(p.categoryId) === productCategory) : all
          );
        })
        .catch((err) => onError(err, "getMyProducts"))
        .finally(() => { if (!ignore) setProductsLoading(false); });
      return () => { ignore = true; };
    }

    if (!company?.slug) return;

    if (productCategory !== "all") {
      getCompanyProductsByCategory(company.slug, productCategory, { page: 1, per_page: 100 })
        .then((data) => {
          if (ignore) return;
          const items = (data?.content ?? data?.items ?? []).map((p) => normalizeProduct(p, t, company.name));
          setProducts(items);
        })
        .catch((err) => onError(err, "getCompanyProductsByCategory"))
        .finally(() => { if (!ignore) setProductsLoading(false); });
      return () => { ignore = true; };
    }

    if (allCategoryIds.length === 0) {
      setProductsLoading(false);
      return;
    }
    Promise.allSettled(
      allCategoryIds.map((cid) => getCompanyProductsByCategory(company.slug, cid, { page: 1, per_page: 100 }))
    )
      .then((results) => {
        if (ignore) return;
        const merged = new Map();
        results.forEach((r) => {
          if (r.status !== "fulfilled") {
            console.warn(`[ProfilePage] a category request failed while loading company ${company.id}'s products:`, r.reason);
            return;
          }
          const items = r.value?.content ?? r.value?.items ?? [];
          items.forEach((p) => merged.set(p.id, normalizeProduct(p, t, company.name)));
        });
        const all = Array.from(merged.values());
        setProductsTotal(all.length);
        setProducts(all);
      })
      .finally(() => { if (!ignore) setProductsLoading(false); });
    return () => { ignore = true; };
  }, [company?.id, company?.slug, company?.name, isOwnProfile, t, productCategory, allCategoryIds]);

  const reloadReviews = (ignore = false) => {
    if (!company?.id) return;
    setReviewsLoading(true);
    getCompanyReviews(company.id, { page: 1, per_page: 20 })
      .then((data) => { if (!ignore) setReviews(data?.content ?? data?.items ?? []); })
      .catch((err) => {
        if (ignore) return;
        console.error(`[ProfilePage] getCompanyReviews failed for company ${company.id}:`, err);
        setReviews([]);
      })
      .finally(() => { if (!ignore) setReviewsLoading(false); });

    getCompanyRating(company.id)
      .then((data) => { if (!ignore) setReviewSummary({ rating: data.averageRating, count: data.reviewCount }); })
      .catch((err) => {
        if (ignore) return;
        console.error(`[ProfilePage] getCompanyRating failed for company ${company.id}:`, err);
        setReviewSummary({ rating: 0, count: 0 });
      });
  };

  useEffect(() => {
    if (!company?.id) return;
    let ignore = false;
    reloadReviews(ignore);
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  const handleWriteReview = () => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: { pathname: `/profile/${company?.id ?? ""}` } } });
      return;
    }
    setShowReview(true);
  };

  const handleOpenChat = async () => {
    if (!CHAT_ENABLED) { alert(t("chat.temporarilyUnavailable")); return; }
    if (!company?.id || chatSubmittingRef.current) return;
    chatSubmittingRef.current = true;
    setChatLoading(true);
    try {
      const result = await createChat({ seller_company_id: company.id });
      navigate(`/chat?thread=${result.thread_id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      chatSubmittingRef.current = false;
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto p-4 sm:p-10 bg-[#F9FAFB] dark:bg-[#121212]">
          <div className="h-48 rounded-2xl bg-ink-100 dark:bg-[#171717] animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
              ))}
            </div>
            <div className="h-96 rounded-2xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (isOwnProfile && (error || !company)) {
    return (
      <AppShell>
        <div className="mx-auto p-4 sm:p-10 flex items-center justify-center">
          {isSeller ? (
            <CreateCompanyForm
              onCreated={(c) => {
                setError("");
                setCompany(c);
              }}
            />
          ) : (
            <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-6 sm:p-10 max-w-lg mx-auto text-center transition-colors">
              <p className="font-semibold text-lg text-ink-900 dark:text-white mb-1">{t("profile.createUnavailable")}</p>
              <p className="text-sm text-ink-400 dark:text-ink-500">
                {t("profile.createUnavailableDesc")}
              </p>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  if (error || !company) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64 text-ink-400">
          {error || t("profile.companyNotFound")}
        </div>
      </AppShell>
    );
  }

  const verificationStatus = company.verificationStatus ?? company.status ?? "DRAFT";
  const badgeInfo = VERIFY_BADGE_KEYS[verificationStatus] ?? VERIFY_BADGE_KEYS.DRAFT;
  const badge = { label: t(badgeInfo.labelKey), cls: badgeInfo.cls };
  const isVerified = verificationStatus === "VERIFIED";
  const initials = (company.name ?? "??").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const cityShort = company.city ?? company.address?.split(",")[0]?.trim();
  const email = company.email ?? (company.website ? `info@${company.website.replace(/^www\./, "")}` : null);
  const logoUrl = company.logoUrl ?? (logoFallback?.id === company.id ? logoFallback.logoUrl : null);
  const backgroundUrl = company.backgroundUrl ?? logoUrl;

  const hasMapCoords = company.lat && company.lng;
  const mainPin = hasMapCoords
    ? [{
      id: "company",
      lat: Number(company.lat),
      lng: Number(company.lng),
      color: "blue",
      label: 1,
      popover: [{
        name: company.name,
        company: company.address ?? cityShort ?? "",
        verified: isVerified,
      }],
    }]
    : [];
  const branchPins = (company.branches ?? [])
    .filter((b) => b.lat != null && b.lng != null)
    .map((b, i) => ({
      id: b.id,
      lat: Number(b.lat),
      lng: Number(b.lng),
      color: "blue",
      label: i + 2,
      popover: [{ name: b.name, company: b.address ?? "", verified: isVerified }],
    }));
  const companyMapPins = [...mainPin, ...branchPins];

  return (
    <AppShell>
      <div className="mx-auto p-4 sm:p-10 bg-[#F9FAFB] dark:bg-[#121212]">

        <div className="hidden sm:flex items-center justify-between mb-5 sm:mb-10 gap-3">
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white">
            {isOwnProfile ? t("profile.companyProfileTitle") : t("profile.companyTitle")}
          </h1>
          {isOwnProfile && (
            <button
              onClick={() => navigate("/seller")}
              className="flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#2D2D2D] rounded-xl px-3.5 sm:px-12 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-ink-700 dark:text-ink-200 hover:border-ink-300 dark:hover:border-ink-600 transition-colors shrink-0"
            >
              <SecurityUser size={20} /> <span className="hidden sm:inline">{t("profile.sellerDashboard")}</span>
            </button>
          )}
        </div>

        <div className="relative bg-white sm:pb-8 pt-20 dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] overflow-hidden mb-5 sm:mb-6 transition-colors">
          <div className="absolute top-0 left-0 right-0 bottom-[80%] sm:bottom-[50%] rounded-2xl -z-1 overflow-hidden bg-[#DEECFF] dark:bg-[#00183A]">
            {backgroundUrl && (
              <img src={backgroundUrl} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="px-4 sm:px-6 pb-5 sm:pb-6 relative z-1">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-10">
              <div className="flex items-start sm:items-end gap-3 sm:gap-4">
                <div className="p-5 sm:p-10 rounded-full bg-white dark:bg-[#0D0D0D] text-white flex items-center justify-center font-bold text-lg sm:text-2xl shadow-card shrink-0 overflow-hidden">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={company.name}
                      className="w-[48px] h-[48px] sm:w-[130px] sm:h-[130px] rounded-3xl object-cover"
                    />
                  ) : (
                    <span className="bg-brand-600 w-[48px] h-[48px] sm:w-[130px] sm:h-[130px] rounded-3xl flex items-center justify-center text-[17px] sm:text-[46px]">{initials}</span>
                  )}
                </div>
                <div className="pb-1 mt-8 sm:mb-0">
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <p className="font-bold text-[24px] sm:text-lg sm:text-2xl text-ink-900 dark:text-white">
                      <span translate="no" className="notranslate">
                        {company.name}
                        {company.legalForm && ` ${company.legalForm}`}
                      </span>
                    </p>
                    <span className={`hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-[4px] ${badge.cls}`}>
                      {isVerified && <TickCircle size={13} />} {badge.label}
                    </span>
                  </div>
                  {company.stir && (
                    <p className="text-sm text-ink-400 dark:text-ink-500 mt-0.5">
                      {t("profile.stir")}: {company.stir}
                    </p>
                  )}
                  <p className="text-sm text-ink-400 dark:text-ink-500 mb-3 mt-0.5">
                    {[company.industry, cityShort].filter(Boolean).join(" ")}
                  </p>
                  <div className="flex sm:hidden items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-[4px] ${badge.cls}`}>
                      {isVerified && <TickCircle size={13} />} {badge.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-2.5">
                {!isOwnProfile && (
                  <button
                    onClick={handleOpenChat}
                    disabled={chatLoading}
                    className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-2xl sm:rounded-xl transition-colors shrink-0"
                  >
                    <Message size={18} /> {chatLoading ? "..." : t("profile.write")}
                  </button>
                )}
                {company.phonePrimary && (
                  <a
                    href={`tel:${company.phonePrimary}`}
                    className="flex items-center justify-center gap-2 border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 text-sm font-medium px-4 py-2.5 rounded-2xl sm:rounded-xl text-ink-700 dark:text-ink-200 transition-colors shrink-0"
                  >
                    <Call size={18} /> {t("profile.call")}
                  </a>
                )}
                {hasMapCoords && (
                  <button
                    onClick={() => setShowMap((v) => !v)}
                    className={`flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-2xl sm:rounded-xl transition-colors shrink-0 ${showMap
                      ? "bg-brand-600 text-white"
                      : "border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 text-ink-700 dark:text-ink-200"
                      }`}
                  >
                    <GlobalSearch size={18} /> {t("profile.map")}
                  </button>
                )}
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center justify-center gap-2 border border-ink-200 dark:border-[#1C1C1C] hover:border-danger-300 dark:hover:border-danger-500 text-sm font-medium px-4 py-2.5 rounded-2xl sm:rounded-xl text-ink-700 dark:text-ink-200 hover:text-danger-600 dark:hover:text-danger-400 transition-colors shrink-0"
                >
                  <Flag size={18} /> {t("report.title")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showReview && (
          <ReviewModal
            subject="company"
            onSubmit={(payload) => createCompanyReview(company.id, payload)}
            onClose={() => setShowReview(false)}
            onSubmitted={() => reloadReviews()}
          />
        )}

        {showReport && (
          <ReportModal
            targetType="COMPANY"
            targetId={company.id}
            onClose={() => setShowReport(false)}
          />
        )}

        <AnimatePresence mode="wait">
          {showMap && hasMapCoords ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors mb-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="font-semibold text-ink-900 dark:text-white">{t("profile.mapWithShops")}</p>
                <div className="flex items-center w-[50%] gap-2">
                  <button className="hidden w-full sm:flex items-center justify-between gap-2 bg-ink-50 dark:bg-[#171717] rounded-xl px-3.5 py-2 text-sm text-ink-700 dark:text-ink-200">
                    {cityShort ?? t("profile.allRegions")} <ArrowDown2 size={16} />
                  </button>
                </div>
              </div>
              <MapView pins={companyMapPins} height="h-[400px] sm:h-[550px]" center={{ lat: company.lat, lng: company.lng }} />
            </motion.div>
          ) : <>
            <div className="sm:hidden mb-4">
              <PillToggle
                options={[
                  { value: "products", label: t("profile.tabProducts") },
                  { value: "reviews", label: t("profile.tabReviews") },
                  { value: "info", label: t("profile.tabInfo") },
                ]}
                value={tab}
                onChange={setTab}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 sm:gap-6">

              <div className="hidden lg:flex flex-col gap-4">
                <CompanyMetaCards company={company} productsTotal={productsTotal} reviewSummary={reviewSummary} cityShort={cityShort} email={email} />
              </div>

              <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] transition-colors">
                <div className="hidden sm:flex border-b border-ink-100 dark:border-[#1C1C1C] px-2 overflow-x-auto">
                  <TabBtn active={tab === "products"} onClick={() => setTab("products")}>
                    {t("profile.tabProducts")}{productsTotal > 0 && ` (${productsTotal})`}
                  </TabBtn>
                  <TabBtn active={tab === "reviews"} onClick={() => setTab("reviews")}>
                    {t("profile.tabReviews")}{reviewSummary.count > 0 && ` (${reviewSummary.count})`}
                  </TabBtn>
                </div>

                <div className="p-4 sm:p-5">
                  {tab === "products" && (
                    <>
                      {!productsLoading && productsTotal > 0 && categories.length > 0 && (
                        <div className="flex items-center justify-end mb-4">
                          <div
                            className={`relative flex items-center gap-2 rounded-xl border pl-3.5 pr-9 py-2.5 transition-colors ${productCategory !== "all"
                              ? "border-brand-200 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/10"
                              : "border-ink-300 dark:border-[#1C1C1C] bg-white dark:bg-[#0D0D0D] hover:border-ink-400 dark:hover:border-ink-600"
                              }`}
                          >
                            <Filter
                              size={16}
                              variant="Linear"
                              className={`shrink-0 ${productCategory !== "all" ? "text-brand-600 dark:text-brand-400" : "text-ink-400"}`}
                            />
                            <select
                              value={productCategory}
                              onChange={(e) => setProductCategory(e.target.value)}
                              className={`appearance-none bg-transparent outline-none text-sm font-medium cursor-pointer max-w-[45vw] sm:max-w-none truncate ${productCategory !== "all" ? "text-brand-600 dark:text-brand-400" : "text-ink-700 dark:text-ink-200"
                                }`}
                            >
                              <option value="all">{t("catalogPage.allCategories")}</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <ArrowDown2
                              size={14}
                              variant="Linear"
                              className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 ${productCategory !== "all" ? "text-brand-500" : "text-ink-400"}`}
                            />
                          </div>
                        </div>
                      )}

                      {productsLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-48 rounded-xl bg-ink-100 dark:bg-[#1C1C1C] animate-pulse" />
                          ))}
                        </div>
                      ) : productsError ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2 text-danger-500">
                          <Buildings2 size={36} variant="Linear" />
                          <p className="text-sm">{productsError}</p>
                        </div>
                      ) : productsTotal === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2 text-ink-400 dark:text-ink-500">
                          <Buildings2 size={36} variant="Linear" />
                          <p className="text-sm">{t("profile.noProducts")}</p>
                        </div>
                      ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2 text-ink-400 dark:text-ink-500">
                          <SearchNormal1 size={36} variant="Linear" />
                          <p className="text-sm">{t("profile.noProductsFiltered")}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                          {products.map((p, i) => (
                            <ProductCard key={p.id} product={p} index={i} />
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {tab === "reviews" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-2.5 pb-1">
                        <div className="flex items-center gap-2.5">
                          <RatingStars rating={reviewSummary.rating} size={18} />
                          <span className="text-sm font-semibold text-ink-900 dark:text-white">{reviewSummary.rating.toFixed(1)}</span>
                          <span className="text-xs text-ink-400">{t("profile.reviewsCount", { count: reviewSummary.count })}</span>
                        </div>
                        {!isOwnProfile && (
                          <button
                            onClick={handleWriteReview}
                            className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline shrink-0"
                          >
                            {t("review.writeReview")}
                          </button>
                        )}
                      </div>
                      {reviewsLoading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="border-t border-ink-100 dark:border-[#1C1C1C] pt-4 first:border-0 first:pt-0">
                            <div className="h-4 w-32 rounded bg-ink-100 dark:bg-[#1C1C1C] animate-pulse mb-2" />
                            <div className="h-3 w-full rounded bg-ink-100 dark:bg-[#1C1C1C] animate-pulse" />
                          </div>
                        ))
                      ) : reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-ink-400 dark:text-ink-500">
                          <p className="text-sm">{t("profile.noReviews")}</p>
                        </div>
                      ) : (
                        reviews.map((r, i) => (
                          <div key={r.id ?? i} className="border-t border-ink-100 dark:border-[#1C1C1C] pt-4 first:border-0 first:pt-0">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <p className="text-sm font-semibold text-ink-900 dark:text-white flex items-center gap-1">
                                {r.author ?? r.authorName ?? r.userName ?? r.name ?? t("profile.anonymousUser")}
                                {r.verified && <TickCircle size={15} variant="Outline" className="text-brand-500" />}
                              </p>
                              <RatingStars rating={r.rating ?? 0} size={14} />
                            </div>
                            <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed">{r.text ?? r.comment ?? r.body ?? ""}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {tab === "info" && (
                    <div className="sm:hidden flex flex-col gap-4">
                      <CompanyMetaCards company={company} productsTotal={productsTotal} reviewSummary={reviewSummary} cityShort={cityShort} email={email} bare />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function CompanyMetaCards({ company, productsTotal, reviewSummary = { rating: 0, count: 0 }, cityShort, email, bare = false }) {
  const { t, i18n } = useTranslation();
  const cardCls = bare ? "border border-ink-100 dark:border-[#1C1C1C] rounded-2xl p-4" : "bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors";
  const capacityUnitLabel = company.capacityUnit ? t(UNIT_OPTIONS.find((u) => u.value === company.capacityUnit)?.labelKey ?? "") || company.capacityUnit : "";
  const utilization = calcCapacityUtilization(company.annualCapacity, company.actualAnnualOutput);
  return (
    <>
      {(company.description || company.shortDescription) && (
        <div className={bare ? "border border-ink-100 dark:border-[#1C1C1C] rounded-2xl p-4" : "bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors"}>
          <p className="font-semibold text-ink-900 dark:text-white mb-2">{t("profile.aboutSeller")}</p>
          <p className="text-sm text-ink-500 dark:text-ink-300 leading-relaxed mb-4">
            {company.description || company.shortDescription}
          </p>
          {(reviewSummary.count > 0 || productsTotal > 0 || company.productsCount != null) && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat value={reviewSummary.count > 0 ? reviewSummary.rating.toFixed(1) : "—"} label={t("common.rating")} />
              <Stat value={reviewSummary.count ?? 0} label={t("common.reviews")} />
              <Stat value={company.productsCount ?? productsTotal} label={t("common.productsCount")} />
            </div>
          )}
        </div>
      )}

      <div className={cardCls}>
        <p className="font-semibold text-ink-900 dark:text-white mb-3">{t("profile.info")}</p>
        {cityShort && (
          <InfoRow icon={Location} label={t("profile.location")} value={t("profile.locationValue", { city: cityShort })} />
        )}
        {company.industry && (
          <InfoRow icon={Buildings2} label={t("profile.industry")} value={company.industry} />
        )}
        {company.legalForm && (
          <InfoRow icon={Buildings} label={t("seller.fieldLegalForm")} value={getLegalFormLabel(company.legalForm, i18n.language)} />
        )}
        {company.stir && (
          <InfoRow icon={DocumentText} label={t("profile.stir")} value={company.stir} />
        )}
        <InfoRow icon={Box1} label={t("common.productsCount")} value={company.productsCount ?? productsTotal} />
      </div>

      {company.annualCapacity != null && company.annualCapacity !== "" && (
        <div className={cardCls}>
          <p className="font-semibold text-ink-900 dark:text-white mb-3">{t("seller.productionCapacityTitle")}</p>
          <div className="flex flex-col gap-1.5 text-sm">
            <p className="text-ink-600 dark:text-ink-300">
              {t("seller.annualCapacity")}: <span className="font-semibold text-ink-900 dark:text-white">{company.annualCapacity} {capacityUnitLabel}</span>
            </p>
            {company.actualAnnualOutput != null && company.actualAnnualOutput !== "" && (
              <p className="text-ink-600 dark:text-ink-300">
                {t("seller.actualOutput")}: <span className="font-semibold text-ink-900 dark:text-white">{company.actualAnnualOutput} {capacityUnitLabel}</span>
              </p>
            )}
            {utilization != null && (
              <p className="text-ink-600 dark:text-ink-300">
                {t("seller.capacityUtilization")}: <span className="font-semibold text-ink-900 dark:text-white">{utilization}%</span>
              </p>
            )}
            {company.capacityDataYear && (
              <p className="text-ink-400 dark:text-ink-500 text-xs">{t("seller.capacityDataYear")}: {company.capacityDataYear}</p>
            )}
            {company.capacityNote && <p className="text-ink-400 dark:text-ink-500 text-xs mt-1">{company.capacityNote}</p>}
          </div>
        </div>
      )}

      {(company.phonePrimary || email || company.website) && (
        <div className={cardCls}>
          <p className="font-semibold text-ink-900 dark:text-white mb-3">{t("profile.contacts")}</p>
          {company.phonePrimary && (
            <InfoRow icon={Call} label={t("profile.phone")} value={company.phonePrimary} href={`tel:${company.phonePrimary}`} />
          )}
          {email && (
            <InfoRow icon={Sms} label={t("profile.email")} value={email} href={`mailto:${email}`} />
          )}
          {company.website && (
            <InfoRow icon={Global} label={t("profile.website")} value={company.website} href={`https://${company.website.replace(/^https?:\/\//, "")}`} />
          )}
        </div>
      )}

      {company.branches?.length > 0 && (
        <div className={cardCls}>
          <p className="font-semibold text-ink-900 dark:text-white mb-3">{t("profile.branchesTitle")}</p>
          <div className="flex flex-col gap-3">
            {company.branches.map((b) => (
              <div key={b.id}>
                <p className="text-sm font-medium text-ink-900 dark:text-white">{b.name}</p>
                <p className="text-xs text-ink-400 dark:text-ink-500">
                  {b.address}{b.phone ? ` · ${b.phone}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
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

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap ${active ? "text-ink-900 dark:text-white" : "text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
        }`}
    >
      {children}
      {active && (
        <motion.div layoutId="profile-tab" className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand-600" />
      )}
    </button>
  );
}

function InfoRow({ icon: Icon, label, value, href }) {
  const content = (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-ink-50 dark:bg-[#1A1A1A] flex items-center justify-center text-ink-500 dark:text-ink-300 shrink-0">
        <Icon size={15} variant="Linear" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-ink-400 dark:text-ink-500">{label}</p>
        <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="block hover:opacity-80 transition-opacity">
      {content}
    </a>
  ) : content;
}
