import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Call,
  Global,
  Location,
  Buildings2,
  Calendar,
  Box1,
  TickCircle,
  Message,
  Sms,
  GlobalSearch,
  SecurityUser,
  Heart,
  ArrowDown2,
} from "iconsax-reactjs";
import ReportModal from "../components/modal/ReportModal";
import CreateCompanyForm from "../components/company/CreateCompanyForm";
import AppShell from "../components/layout/AppShell";
import MapView from "../components/ui/MapView";
import PillToggle from "../components/ui/PillToggle";
import RatingStars from "../components/ui/RatingStars";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { getCompanyBySlug, getMyCompany, getCompaniesMap, getCompanyProducts, getCompanyReviews, createChat } from "../api/api";
import { buildCompanyMapPins } from "../utils/mapPins";
import ProductCard from "../components/ui/ProductCard";

function normalizeProduct(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price ?? 0,
    unit: p.currency ?? "UZS",
    company: p.companyId ? `Компания #${p.companyId}` : "",
    image: p.images?.find((img) => img.is_primary)?.url ?? p.images?.[0]?.url ?? null,
    verified: p.status === "ACTIVE" || p.isPromoted,
  };
}

const VERIFY_BADGE = {
  VERIFIED: { label: "Верифицирован", cls: "text-success-700 dark:text-success-400 bg-success-50 dark:bg-success-500/15" },
  PENDING: { label: "На проверке", cls: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" },
  DRAFT: { label: "Черновик", cls: "text-ink-500 dark:text-ink-400 bg-ink-100 dark:bg-[#1C1C1C]" },
  REJECTED: { label: "Отклонён", cls: "text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10" },
};

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isOwnProfile = !id;

  const { user } = useAuth();
  const isSeller = user?.accountType === "seller";

  const { companyFavorites, toggleCompanyFavorite } = useCart();

  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("products");
  const [showMap, setShowMap] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [companyMapPins, setCompanyMapPins] = useState([]);
  const [companyMapLoading, setCompanyMapLoading] = useState(false);
  const [companyMapLoaded, setCompanyMapLoaded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (!showMap || companyMapLoaded) return;
    setCompanyMapLoading(true);
    getCompaniesMap({ page: 1, per_page: 200 })
      .then((data) => {
        const items = (data?.content ?? []).filter((c) => c.lat && c.lng);
        setCompanyMapPins(buildCompanyMapPins(items, navigate));
      })
      .catch(() => setCompanyMapPins([]))
      .finally(() => {
        setCompanyMapLoading(false);
        setCompanyMapLoaded(true);
      });
  }, [showMap, companyMapLoaded, navigate]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const fetcher = isOwnProfile ? getMyCompany() : getCompanyBySlug(id);
    fetcher
      .then(setCompany)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isOwnProfile]);

  useEffect(() => {
    if (!company?.slug) return;
    setProductsLoading(true);
    getCompanyProducts(company.slug, { page: 1, per_page: 30 })
      .then((data) => {
        setProducts((data?.content ?? []).map(normalizeProduct));
        setProductsTotal(data?.totalElements ?? 0);
      })
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [company?.slug]);

  useEffect(() => {
    if (!company?.id) return;
    setReviewsLoading(true);
    getCompanyReviews(company.id, { page: 1, per_page: 20 })
      .then((data) => setReviews(data?.content ?? data?.items ?? []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [company?.id]);

  const handleOpenChat = async () => {
    if (!company?.id) return;
    setChatLoading(true);
    try {
      const result = await createChat({ seller_company_id: company.id });
      navigate(`/seller?tab=messages&thread=${result.thread_id}`);
    } catch (err) {
      alert(err.message);
    } finally {
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
            <CreateCompanyForm onCreated={setCompany} />
          ) : (
            <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-6 sm:p-10 max-w-lg mx-auto text-center transition-colors">
              <p className="font-semibold text-lg text-ink-900 dark:text-white mb-1">Создание компании недоступно</p>
              <p className="text-sm text-ink-400 dark:text-ink-500">
                Только пользователи с ролью «Продавец» могут создавать компанию на Sklad Market.
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
          {error || "Компания не найдена"}
        </div>
      </AppShell>
    );
  }

  const verificationStatus = company.verificationStatus ?? company.status ?? "DRAFT";
  const badge = VERIFY_BADGE[verificationStatus] ?? VERIFY_BADGE.DRAFT;
  const isVerified = verificationStatus === "VERIFIED";
  const isFav = companyFavorites?.has(company.id);
  const initials = (company.name ?? "??").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const createdYear = company.createdAt ? new Date(company.createdAt).getFullYear() : null;
  const cityShort = company.city ?? company.address?.split(",")[0]?.trim();
  const email = company.email ?? (company.website ? `info@${company.website.replace(/^www\./, "")}` : null);

  const hasMapCoords = company.lat && company.lng;

  return (
    <AppShell>
      <div className="mx-auto p-4 sm:p-10 bg-[#F9FAFB] dark:bg-[#121212]">

        <div className="hidden sm:flex items-center justify-between mb-5 sm:mb-10 gap-3">
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white">
            {isOwnProfile ? "Профиль компании" : "Компания"}
          </h1>
          {isOwnProfile && (
            <button
              onClick={() => navigate("/seller")}
              className="flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#2D2D2D] rounded-xl px-3.5 sm:px-12 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-ink-700 dark:text-ink-200 hover:border-ink-300 dark:hover:border-ink-600 transition-colors shrink-0"
            >
              <SecurityUser size={20} /> <span className="hidden sm:inline">Панель продавца</span>
            </button>
          )}
        </div>

        <div className="relative bg-white sm:pb-8 pt-20 dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] overflow-hidden mb-5 sm:mb-6 transition-colors">
          <div className="absolute top-0 left-0 right-0 bottom-[80%] sm:bottom-[50%] rounded-2xl -z-1 bg-[#DEECFF] dark:bg-[#00183A]"></div>
          <div className="px-4 sm:px-6 pb-5 sm:pb-6 relative z-1">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-10">
              <div className="flex items-start sm:items-end gap-3 sm:gap-4">
                <div className="p-5 sm:p-10 rounded-full bg-white dark:bg-[#0D0D0D] text-white flex items-center justify-center font-bold text-lg sm:text-2xl shadow-card shrink-0 overflow-hidden">
                  <span className="bg-brand-600 w-[48px] h-[48px] sm:w-[130px] sm:h-[130px] rounded-3xl flex items-center justify-center text-[17px] sm:text-[46px]">{initials}</span>
                </div>
                <div className="pb-1 mt-8 sm:mb-0">
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <p className="font-bold text-[24px] sm:text-lg sm:text-2xl text-ink-900 dark:text-white">{company.name}</p>
                    <span className={`hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-[4px] ${badge.cls}`}>
                      {isVerified && <TickCircle size={13} />} {badge.label}
                    </span>
                  </div>
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
                <button
                  onClick={handleOpenChat}
                  disabled={chatLoading}
                  className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-2xl sm:rounded-xl transition-colors shrink-0"
                >
                  <Message size={18} /> {chatLoading ? "..." : "Написать"}
                </button>
                {company.phonePrimary && (
                  <a
                    href="#"
                    className="flex items-center justify-center gap-2 border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 text-sm font-medium px-4 py-2.5 rounded-2xl sm:rounded-xl text-ink-700 dark:text-ink-200 transition-colors shrink-0"
                  >
                    <Call size={18} /> Позвонить
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
                    <GlobalSearch size={18} /> Карта
                  </button>
                )}
                {!isOwnProfile && (
                  <button
                    onClick={() => toggleCompanyFavorite(company.id)}
                    className="flex items-center justify-center gap-2 border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 text-sm font-medium px-4 py-2.5 rounded-2xl sm:rounded-xl text-ink-700 dark:text-ink-200 transition-colors shrink-0"
                  >
                    <Heart size={18} variant={isFav ? "Bold" : "Linear"} className={isFav ? "text-danger-500" : ""} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

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
                <p className="font-semibold text-ink-900 dark:text-white">Карта с магазинами</p>
                <div className="flex items-center w-[50%] gap-2">
                  <button className="hidden w-full sm:flex items-center justify-between gap-2 bg-ink-50 dark:bg-[#171717] rounded-xl px-3.5 py-2 text-sm text-ink-700 dark:text-ink-200">
                    {cityShort ?? "Все регионы"} <ArrowDown2 size={16} />
                  </button>
                </div>
              </div>
              {companyMapLoading ? (
                <div className="h-[400px] sm:h-[550px] rounded-2xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
              ) : (
                <MapView pins={companyMapPins} height="h-[400px] sm:h-[550px]" center={{ lat: company.lat, lng: company.lng }} />
              )}
            </motion.div>
          ) : <>
            <div className="sm:hidden mb-4">
              <PillToggle
                options={[
                  { value: "products", label: "Товары" },
                  { value: "reviews", label: "Отзывы" },
                  { value: "info", label: "Информация" },
                ]}
                value={tab}
                onChange={setTab}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 sm:gap-6">

              <div className="hidden lg:flex flex-col gap-4">
                <CompanyMetaCards company={company} productsTotal={productsTotal} createdYear={createdYear} cityShort={cityShort} email={email} />
              </div>

              <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] transition-colors">
                <div className="hidden sm:flex border-b border-ink-100 dark:border-[#1C1C1C] px-2 overflow-x-auto">
                  <TabBtn active={tab === "products"} onClick={() => setTab("products")}>
                    Товары{productsTotal > 0 && ` (${productsTotal})`}
                  </TabBtn>
                  <TabBtn active={tab === "reviews"} onClick={() => setTab("reviews")}>
                    Отзывы{company.reviews > 0 && ` (${company.reviews})`}
                  </TabBtn>
                </div>

                <div className="p-4 sm:p-5">
                  {tab === "products" && (
                    <>
                      {productsLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-48 rounded-xl bg-ink-100 dark:bg-[#1C1C1C] animate-pulse" />
                          ))}
                        </div>
                      ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2 text-ink-400 dark:text-ink-500">
                          <Buildings2 size={36} variant="Linear" />
                          <p className="text-sm">Нет опубликованных товаров</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                          {products.map((p, i) => (
                            <ProductCard product={p} index={i} />
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {tab === "reviews" && (
                    <div className="flex flex-col gap-4">
                      {reviewsLoading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="border-t border-ink-100 dark:border-[#1C1C1C] pt-4 first:border-0 first:pt-0">
                            <div className="h-4 w-32 rounded bg-ink-100 dark:bg-[#1C1C1C] animate-pulse mb-2" />
                            <div className="h-3 w-full rounded bg-ink-100 dark:bg-[#1C1C1C] animate-pulse" />
                          </div>
                        ))
                      ) : reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-ink-400 dark:text-ink-500">
                          <p className="text-sm">Пока нет отзывов</p>
                        </div>
                      ) : (
                        reviews.map((r, i) => (
                          <div key={r.id ?? i} className="border-t border-ink-100 dark:border-[#1C1C1C] pt-4 first:border-0 first:pt-0">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <p className="text-sm font-semibold text-ink-900 dark:text-white flex items-center gap-1">
                                {r.author ?? r.authorName ?? r.userName ?? r.name ?? "Пользователь"}
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
                      <CompanyMetaCards company={company} productsTotal={productsTotal} createdYear={createdYear} cityShort={cityShort} email={email} bare />
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

function CompanyMetaCards({ company, productsTotal, createdYear, cityShort, email, bare = false }) {
  return (
    <>
      {(company.description || company.shortDescription) && (
        <div className={bare ? "border border-ink-100 dark:border-[#1C1C1C] rounded-2xl p-4" : "bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors"}>
          <p className="font-semibold text-ink-900 dark:text-white mb-2">О продавце</p>
          <p className="text-sm text-ink-500 dark:text-ink-300 leading-relaxed mb-4">
            {company.description || company.shortDescription}
          </p>
          {(company.rating != null || company.reviews != null || company.productsCount != null) && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat value={company.rating ?? "—"} label="Рейтинг" />
              <Stat value={company.reviews ?? 0} label="Отзывы" />
              <Stat value={company.productsCount ?? productsTotal} label="Товаров" />
            </div>
          )}
        </div>
      )}

      <div className={bare ? "border border-ink-100 dark:border-[#1C1C1C] rounded-2xl p-4" : "bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors"}>
        <p className="font-semibold text-ink-900 dark:text-white mb-3">Информация</p>
        {cityShort && (
          <InfoRow icon={Location} label="Местоположение" value={`${cityShort}, Узбекистан`} />
        )}
        {company.industry && (
          <InfoRow icon={Buildings2} label="Отрасль" value={company.industry} />
        )}
        {createdYear && (
          <InfoRow icon={Calendar} label="Основана" value={`${createdYear} год`} />
        )}
        <InfoRow icon={Box1} label="Товаров" value={company.productsCount ?? productsTotal} />
      </div>

      {(company.phonePrimary || email || company.website) && (
        <div className={bare ? "border border-ink-100 dark:border-[#1C1C1C] rounded-2xl p-4" : "bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors"}>
          <p className="font-semibold text-ink-900 dark:text-white mb-3">Контакты</p>
          {company.phonePrimary && (
            <InfoRow icon={Call} label="Телефон" value={company.phonePrimary} href={`tel:${company.phonePrimary}`} />
          )}
          {email && (
            <InfoRow icon={Sms} label="Email" value={email} href={`mailto:${email}`} />
          )}
          {company.website && (
            <InfoRow icon={Global} label="Website" value={company.website} href={`https://${company.website.replace(/^https?:\/\//, "")}`} />
          )}
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
