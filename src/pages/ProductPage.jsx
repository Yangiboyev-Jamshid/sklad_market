import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Minus,
  Add,
  ShoppingCart,
  Call,
  Heart,
  Location,
  ShieldTick,
  Truck,
  Shield,
  TickCircle,
  Box,
  Message,
} from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import ProductThumb from "../components/ui/ProductThumb";
import ProductCard from "../components/ui/ProductCard";
import RatingStars from "../components/ui/RatingStars";
import ReportModal from "../components/modal/ReportModal";
import { useCart } from "../context/CartContext";
import { getProductBySlug, getAllProducts, getProductReviews, createChat } from "../api/api";

const tabs = ["Описание", "Характеристики", "Доставка", "Отзывы"];

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

// Some backend responses nest currency/unit as an object ({code,symbol,...})
// instead of a plain string — render whichever primitive field is present
// instead of passing the object straight into JSX (React can't render objects).
function displayText(value, fallback = "") {
  if (value == null) return fallback;
  if (typeof value !== "object") return value;
  return value.symbol ?? value.label ?? value.name ?? value.code ?? fallback;
}

const AVAILABILITY_LABEL = {
  ACTIVE: "В наличии",
  PENDING: "На модерации",
  ARCHIVED: "Нет в наличии",
  REJECTED: "Нет в наличии",
};

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Описание");
  const [qty, setQty] = useState(1);
  const [showReport, setShowReport] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const { addToCart, favorites, toggleFavorite } = useCart();
  const navigate = useNavigate();
  const isFav = product ? favorites?.has(product.id) : false;

  const handleOpenChat = async () => {
    if (!product?.company?.id) return;
    try {
      const result = await createChat({ seller_company_id: product.company.id, product_id: product.id });
      navigate(`/seller?tab=messages&thread=${result.thread_id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    getProductBySlug(id)
      .then(setProduct)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product?.id) return;
    setReviewsLoading(true);
    getProductReviews(product.id, { page: 1, per_page: 20 })
      .then((data) => setReviews(data?.content ?? data?.items ?? []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    getAllProducts({ page: 1, perPage: 60 })
      .then((data) => {
        const items = (data?.items ?? []).filter((p) => p.categoryId === product.category?.id && p.id !== product.id);
        setSimilar(items.slice(0, 4).map(normalizeProduct));
      })
      .catch(() => setSimilar([]));
  }, [product]);

  if (loading) {
    return (
      <AppShell>
        <div className="bg-[#F9FAFB] dark:bg-[#121212] mx-auto p-4 sm:p-5 sm:px-10">
          <div className="hidden sm:block h-8 w-64 bg-ink-200 dark:bg-[#1C1C1C] rounded-xl animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-3">
            <div className="h-96 bg-ink-200 dark:bg-[#1C1C1C] rounded-2xl animate-pulse" />
            <div className="h-96 bg-ink-200 dark:bg-[#1C1C1C] rounded-2xl animate-pulse" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !product) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <p className="text-ink-400">{error || "Товар не найден"}</p>
        </div>
      </AppShell>
    );
  }

  const primaryImage = product.images?.find((img) => img.is_primary)?.url ?? product.images?.[0]?.url;
  const company = product.company;
  const firstAttributeValue = Object.values(product.attributes ?? {})[0];
  const tags = [
    product.category?.parentName,
    product.category?.name,
    typeof firstAttributeValue === "object" ? null : firstAttributeValue,
  ].filter(Boolean);

  return (
    <AppShell>
      <div className="bg-[#F9FAFB] dark:bg-[#121212] mx-auto p-4 sm:p-5 sm:px-10">
        <h1 className="hidden sm:block text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white mb-5 sm:mb-6">{product.name}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-3">
          <div className="p-3 sm:p-[18.85px] flex flex-col justify-start gap-3 sm:gap-4 bg-white dark:bg-[#0D0D0D] rounded-[12px] border border-ink-100 dark:border-[#1C1C1C]">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] rounded-xl flex items-center justify-center dark:bg-[#2A2A2A] bg-[#E2E2E2] overflow-hidden border border-ink-100 dark:border-[#1C1C1C]">
              {primaryImage
                ? <img src={primaryImage} alt={product.name} className="w-full h-full object-contain" />
                : <ProductThumb />
              }
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {(product.images ?? []).slice(0, 4).map((img, i) => (
                <div key={img.id ?? i} className="aspect-square h-[72px] w-[80px] sm:h-[90px] sm:w-[100px] shrink-0 flex items-center justify-center rounded-lg bg-[#E2E2E2] dark:bg-[#2A2A2A] overflow-hidden border border-ink-100 dark:border-[#1C1C1C]">
                  {img.url
                    ? <img src={img.thumbnail_urls?.sm ?? img.url} alt="" className="w-full h-full object-cover" />
                    : <ProductThumb height="14" width="42" />
                  }
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#0D0D0D] rounded-[12px] border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#155DFC] dark:text-[#2E6FFC] bg-[#DEECFF] dark:bg-[#00193B] px-1 py-0.5 rounded-[4px]">
                {product.category?.name ?? "—"}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-ink-400 dark:text-ink-500">
                <Eye size={15} /> {product.views_count_cache ?? 0} просмотров
              </span>
            </div>
            <h2 className="text-sm font-semibold text-ink-900 dark:text-white mb-1.5">{product.name}</h2>
            <div className="flex items-center justify-between gap-2 mb-4">
              <RatingStars rating={product.rating ?? 0} size={14} showValue count={product.reviewsCount} />
              <button
                onClick={() => setActiveTab("Отзывы")}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline shrink-0"
              >
                Перейти к отзывам
              </button>
            </div>

            <div className="bg-[#DEECFF] flex flex-col gap-1 dark:bg-[#00183A] rounded-xl p-4 mb-4">
              <p className="text-2xl font-bold text-[#155DFC] dark:text-[#2E6FFC]">
                {product.price} {displayText(product.currency)}
              </p>
              <p className="text-[12px] text-ink-500 dark:text-ink-400">за {displayText(product.unit, "шт.")}</p>
              <p className="text-[12px] text-ink-400 dark:text-ink-500">Минимальный заказ: {product.minProduct ?? 1} {displayText(product.unit, "шт.")}</p>
            </div>

            <p className="text-xs font-medium text-ink-700 dark:text-ink-200 mb-2">Количество</p>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl border border-ink-200 dark:border-[#1C1C1C] flex items-center justify-center text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717] shrink-0"
              >
                <Minus size={16} />
              </button>
              <input
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="flex-1 text-center border border-[#DFDFDF] bg-transparent dark:border-[#1C1C1C] dark:text-white rounded-xl py-[10px] outline-none font-medium"
              />
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-10 h-10 rounded-xl border border-ink-200 dark:border-[#1C1C1C] flex items-center justify-center text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717] shrink-0"
              >
                <Add size={16} />
              </button>
            </div>
            <p className="text-xs text-ink-400 dark:text-ink-500 mb-4">
              Итог: {product.price * qty} {displayText(product.currency)}
            </p>

            <button
              onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, qty })}
              className="w-full bg-brand-600 dark:text-[#0D0D0D] hover:bg-brand-700 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 mb-2 transition-colors"
            >
              <ShoppingCart size={18} /> Добавить в корзину
            </button>

            <button
              onClick={handleOpenChat}
              className="w-full border border-ink-200 dark:border-[#1C1C1C] hover:border-brand-400 font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 mb-2 text-ink-700 dark:text-ink-200 transition-colors"
            >
              <Message size={18} /> Написать продавцу
            </button>

            {company?.phonePrimary && (
              <a
                href={`tel:${company.phonePrimary}`}
                className="w-full border border-ink-200 dark:border-[#1C1C1C] hover:border-brand-400 font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 mb-2 text-ink-700 dark:text-ink-200 transition-colors"
              >
                <Call size={18} /> {company.phonePrimary}
              </a>
            )}

            <button
              onClick={() => toggleFavorite(product.id)}
              className="w-full border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 mb-2 text-ink-700 dark:text-ink-200 transition-colors"
            >
              <Heart size={18} variant={isFav ? "Bold" : "Linear"} className={isFav ? "text-danger-500" : ""} /> Добавить в фавориты
            </button>
            <button className="w-full border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 text-ink-700 dark:text-ink-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M10.6761 12.7192C10.5278 12.9488 10.2007 13.0074 9.9545 12.8485L5.75114 10.1345C5.50494 9.97557 5.42373 9.65333 5.57199 9.4237C5.72025 9.19407 6.04737 9.13546 6.29356 9.29442L10.4969 12.0084C10.7431 12.1673 10.8243 12.4896 10.6761 12.7192Z" fill="#7F7F7F" />
                <path d="M10.6761 4.42143C10.5278 4.19181 10.2007 4.1332 9.9545 4.29216L5.75114 7.0061C5.50494 7.16506 5.42373 7.4873 5.57199 7.71693C5.72025 7.94656 6.04737 8.00516 6.29356 7.8462L10.4969 5.13227C10.7431 4.97331 10.8243 4.65106 10.6761 4.42143Z" fill="#7F7F7F" />
                <path d="M6.16536 8.66927C6.16536 10.1426 4.97203 11.3359 3.4987 11.3359C2.02536 11.3359 0.832031 10.1426 0.832031 8.66927C0.832031 7.19594 2.02536 6.0026 3.4987 6.0026C4.97203 6.0026 6.16536 7.19594 6.16536 8.66927ZM1.83203 8.66927C1.83203 9.58927 2.5787 10.3359 3.4987 10.3359C4.4187 10.3359 5.16536 9.58927 5.16536 8.66927C5.16536 7.74927 4.4187 7.0026 3.4987 7.0026C2.5787 7.0026 1.83203 7.74927 1.83203 8.66927Z" fill="#7F7F7F" />
                <path d="M15.168 12.6641C15.168 14.0441 14.048 15.1641 12.668 15.1641C11.288 15.1641 10.168 14.0441 10.168 12.6641C10.168 11.2841 11.288 10.1641 12.668 10.1641C14.048 10.1641 15.168 11.2841 15.168 12.6641ZM11.168 12.6641C11.168 13.4907 11.8413 14.1641 12.668 14.1641C13.4946 14.1641 14.168 13.4907 14.168 12.6641C14.168 11.8374 13.4946 11.1641 12.668 11.1641C11.8413 11.1641 11.168 11.8374 11.168 12.6641Z" fill="#7F7F7F" />
                <path d="M15.168 3.33594C15.168 4.71594 14.048 5.83594 12.668 5.83594C11.288 5.83594 10.168 4.71594 10.168 3.33594C10.168 1.95594 11.288 0.835938 12.668 0.835938C14.048 0.835938 15.168 1.95594 15.168 3.33594ZM11.168 3.33594C11.168 4.1626 11.8413 4.83594 12.668 4.83594C13.4946 4.83594 14.168 4.1626 14.168 3.33594C14.168 2.50927 13.4946 1.83594 12.668 1.83594C11.8413 1.83594 11.168 2.50927 11.168 3.33594Z" fill="#7F7F7F" />
              </svg> Поделиться
            </button>
          </div>

          <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] transition-colors">
            <div className="flex border-b border-ink-100 dark:border-[#1C1C1C] px-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`relative px-3 sm:px-4 py-3.5 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t ? "text-ink-900 dark:text-white" : "text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"}`}
                >
                  {t === "Отзывы" ? `Отзывы (${product.reviewsCount ?? 0})` : t}
                  {activeTab === t && (
                    <motion.div layoutId="product-tab" className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-4">
              <AnimatePresence mode="wait">
                {activeTab === "Описание" && (
                  <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed mb-4">{product.description || product.short_description || "—"}</p>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span key={tag} className="text-xs font-medium text-ink-600 dark:text-ink-300 bg-ink-50 dark:bg-[#171717] px-2.5 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
                {activeTab === "Характеристики" && (
                  <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-[18.85px] justify-start">
                    <div className="grid grid-cols-[1fr_2fr] justify-start text-[14px]">
                      <span className="text-ink-400 dark:text-ink-500">Категория</span>
                      <span className="text-ink-900 dark:text-white font-medium text-left">{product.category?.name ?? "—"}</span>
                    </div>
                    {Object.entries(product.attributes ?? {}).map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[1fr_2fr] justify-start text-[14px]">
                        <span className="text-ink-400 dark:text-ink-500">{k}</span>
                        <span className="text-ink-900 dark:text-white font-medium text-left">{String(v)}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-[1fr_2fr] justify-start text-[14px]">
                      <span className="text-ink-400 dark:text-ink-500">Минимальный заказ</span>
                      <span className="text-ink-900 dark:text-white font-medium text-left">{product.minProduct ?? 1} {displayText(product.unit, "шт.")}</span>
                    </div>
                    <div className="grid grid-cols-[1fr_2fr] justify-start text-[14px]">
                      <span className="text-ink-400 dark:text-ink-500">Наличие</span>
                      <span className="text-ink-900 dark:text-white font-medium text-left">{AVAILABILITY_LABEL[product.status] ?? "—"}</span>
                    </div>
                  </motion.div>
                )}
                {activeTab === "Доставка" && (
                  <motion.div key="del" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-5">
                    <InfoBlock icon={Truck} color="brand" title="Доставка" desc="Доставка по региону - доступна" sub="Срок: 3-5 дней" />
                    <InfoBlock icon={Location} color="success" title="Склад / самовызов" desc="Узбекистан" />
                    <InfoBlock icon={Shield} color="ink" title="Условия" desc="Условия поставки обсуждаются с продавцом. Документы и счёта предоставляются." />
                  </motion.div>
                )}
                {activeTab === "Отзывы" && (
                  <motion.div key="rev" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                    <div className="flex items-center gap-2.5 pb-1">
                      <RatingStars rating={product.rating ?? 0} size={18} />
                      <span className="text-sm font-semibold text-ink-900 dark:text-white">{(product.rating ?? 0).toFixed(1)}</span>
                      <span className="text-xs text-ink-400">{product.reviewsCount ?? 0} отзывов</span>
                    </div>
                    {reviewsLoading ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="border-t border-ink-100 dark:border-[#1C1C1C] pt-4 first:border-0 first:pt-0">
                          <div className="h-4 w-32 rounded bg-ink-100 dark:bg-[#1C1C1C] animate-pulse mb-2" />
                          <div className="h-3 w-full rounded bg-ink-100 dark:bg-[#1C1C1C] animate-pulse" />
                        </div>
                      ))
                    ) : reviews.length === 0 ? (
                      <p className="text-sm text-ink-400 dark:text-ink-500 text-center py-6">Пока нет отзывов</p>
                    ) : (
                      reviews.map((r, i) => (
                        <div key={r.id ?? i} className="border-t border-ink-100 dark:border-[#1C1C1C] pt-4 first:border-0 first:pt-0">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <p className="text-sm font-semibold text-ink-900 dark:text-white">{r.author ?? r.authorName ?? r.userName ?? r.name ?? "Пользователь"}</p>
                            <RatingStars rating={r.rating ?? 0} size={13} />
                          </div>
                          <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed">{r.text ?? r.comment ?? r.body ?? ""}</p>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors">
              <p className="font-semibold text-ink-900 dark:text-white mb-3.5">О продавце</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                  {company?.logo_path
                    ? <img src={company.logo_path} alt="" className="w-full h-full object-cover" />
                    : (company?.name ?? "?").slice(0, 2).toUpperCase()
                  }
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-ink-900 dark:text-white flex items-center gap-1">
                    {company?.name ?? "—"} <TickCircle size={20} variant="Outline" className="text-brand-500" />
                  </p>
                  <p className="text-[12px] text-ink-400 dark:text-ink-500">
                    {[company?.industry, company?.city ?? company?.address?.split(",")[0]?.trim()].filter(Boolean).join(" ") || company?.slug}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <Stat value={company?.rating ?? "—"} label="Рейтинг" />
                <Stat value={company?.reviews ?? 0} label="Отзывы" />
                <Stat value={company?.productsCount ?? 0} label="Товаров" />
              </div>
              {company?.slug && (
                <a href={`/company/${company.slug}`} className="text-sm flex justify-center items-center font-medium text-brand-600 dark:text-brand-400 hover:underline">
                  Перейти на страницу компании →
                </a>
              )}
            </div>
            <div className="bg-white dark:bg-[#0D0D0D] rounded-[12px] border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 flex flex-col gap-5 transition-colors">
              <FeatureRow icon={ShieldTick} text="Безопасная сделка через платформу" />
              <FeatureRow icon={TickCircle} text="Верифицированный данные компании" />
              <FeatureRow icon={Box} text="Оригинальная продукция с документами" />
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-8 sm:mt-10">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-ink-900 dark:text-white mb-4">Похожие товары</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-6 sm:gap-5">
              {similar.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>

      {showReport && (
        <ReportModal
          targetType="PRODUCT"
          targetId={product.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </AppShell>
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

function InfoBlock({ icon: Icon, color, title, desc, sub }) {
  const colorMap = {
    brand: "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400",
    success: "bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-400",
    ink: "bg-ink-50 dark:bg-[#171717] text-ink-500 dark:text-ink-300",
  };
  return (
    <div className={`flex gap-3 rounded-xl p-4 ${colorMap[color]}`}>
      <Icon size={20} variant="Outline" className="shrink-0 mt-0.5" />
      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-semibold text-ink-900 dark:text-white">{title}</p>
        <p className="text-[12px] text-ink-500 dark:text-ink-400">{desc}</p>
        {sub && <p className="text-[12px] text-ink-400">{sub}</p>}
      </div>
    </div>
  );
}

function FeatureRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#7F7F7F]">
      <Icon size={24} variant="Outline" className="text-success-500 shrink-0" />
      {text}
    </div>
  );
}
