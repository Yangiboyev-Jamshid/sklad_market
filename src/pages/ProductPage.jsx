import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Minus,
  Add,
  ShoppingCart,
  Message2,
  Call,
  Heart,
  Verify,
  Location,
  ShieldTick,
  Box1,
  Truck,
  Shield,
  TickCircle,
  Box,
} from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import ProductThumb from "../components/ui/ProductThumb";
import RatingStars from "../components/ui/RatingStars";
import { products, companies, reviews } from "../data/mockData";
import { useCart } from "../context/CartContext";

const tabs = ["Описание", "Характеристики", "Доставка", "Отзывы"];

export default function ProductPage() {
  const { id } = useParams();
  const baseId = id?.split("-")[0] || "p1";
  const product = products.find((p) => p.id === baseId) || products[0];
  const company = companies.find((c) => c.id === product.companyId) || companies[0];
  const [activeTab, setActiveTab] = useState("Описание");
  const [qty, setQty] = useState(product.minOrder);
  const { addToCart, favorites, toggleFavorite } = useCart();
  const isFav = favorites?.has(id);

  return (
    <AppShell>
      <div className="bg-[#F9FAFB] dark:bg-[#121212] mx-auto p-5 sm:px-10">
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white mb-5 sm:mb-6">{product.name}</h1>

        <div className="grid grid-cols-[3fr_1fr] gap-3">
          <div className="p-[18.85px] flex flex-col justify-start gap-4 dark:bg-[#0D0D0D] rounded-[12px] border dark:border-[#1C1C1C]">
            <div className="aspect-[16/10] rounded-xl flex items-center justify-center dark:bg-[#2A2A2A] bg-[#E2E2E2] overflow-hidden border border-ink-100 dark:border-[#1C1C1C]">
              <ProductThumb />
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-square h-[90px] w-[100px] flex items-center justify-center rounded-lg bg-[#E2E2E2] dark:bg-[#2A2A2A] overflow-hidden border border-ink-100 dark:border-[#1C1C1C]">
                  <ProductThumb height="14" width="42" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-[#0D0D0D] rounded-[12px] border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#155DFC] dark:text-[#2E6FFC] bg-[#DEECFF] dark:bg-[#00193B] px-1 py-0.5 rounded-[4px]">{product.category}</span>
              <span className="flex items-center gap-1 text-[10px] text-ink-400 dark:text-ink-500">
                <Eye size={15} /> {product.views} просмотров
              </span>
            </div>
            <h2 className="text-sm font-semibold text-ink-900 dark:text-white mb-1">{product.name}</h2>
            <RatingStars rating={product.rating} count={product.reviews} showValue />

            <div className="bg-[#DEECFF] flex flex-col gap-1 dark:bg-[#00183A] rounded-xl p-4 mt-4 mb-4">
              <p className="text-2xl font-bold text-[#155DFC] dark:text-[#2E6FFC]">${product.price}</p>
              <p className="text-[12px] text-ink-500 dark:text-ink-400">за {product.unit}</p>
              <p className="text-[12px] text-ink-500 dark:text-ink-400">Минимальный заказ: {product.minOrder} тонны</p>
            </div>

            <p className="text-xs font-medium text-ink-700 dark:text-ink-200 mb-2">Количество</p>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setQty((q) => Math.max(product.minOrder, q - 1))}
                className="w-10 h-10 rounded-xl border border-ink-200 dark:border-[#1C1C1C] flex items-center justify-center text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717] shrink-0"
              >
                <Minus size={16} />
              </button>
              <input
                value={qty}
                onChange={(e) => setQty(Number(e.target.value) || product.minOrder)}
                className="flex-1 text-center border border-[#DFDFDF] bg-transparent dark:border-[#1C1C1C] dark:text-white rounded-xl py-[10px] outline-none font-medium"
              />
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-10 h-10 rounded-xl border border-ink-200 dark:border-[#1C1C1C] flex items-center justify-center text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717] shrink-0"
              >
                <Add size={16} />
              </button>
            </div>
            <p className="text-xs text-ink-400 dark:text-ink-500 mb-4">Итог: ${product.price}</p>

            <button
              onClick={() => addToCart({ ...product, qty })}
              className="w-full bg-brand-600 dark:text-[#0D0D0D] hover:bg-brand-700 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 mb-3 transition-colors"
            >
              <ShoppingCart size={18} /> Добавить в корзину
            </button>
            <button className="w-full border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 mb-3 text-ink-700 dark:text-ink-200 transition-colors">
              <Message2 size={18} /> Написать продавцу
            </button>
            <button className="w-full border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 mb-3 text-ink-700 dark:text-ink-200 transition-colors">
              <Call size={18} /> {company.phone}
            </button>
            <button
              onClick={() => toggleFavorite(id)}
              className="w-full border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 mb-3 text-ink-700 dark:text-ink-200 transition-colors"
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
            <div className="flex border-b border-ink-100 dark:border-[#1C1C1C] px-2 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`relative px-3 sm:px-4 py-3.5 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t ? "text-ink-900 dark:text-white" : "text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
                    }`}
                >
                  {t} {t === "Отзывы" && `(${product.reviews})`}
                  {activeTab === t && (
                    <motion.div layoutId="product-tab" className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="px-4 sm:p-4">
              <AnimatePresence mode="wait">
                {activeTab === "Описание" && (
                  <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed mb-4">{product.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      {product.tags.map((t) => (
                        <span key={t} className="text-xs bg-ink-100 dark:bg-[#171717] text-ink-600 dark:text-ink-300 px-3 py-1.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
                {activeTab === "Характеристики" && (
                  <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-[18.85px] justify-start">
                    {Object.entries(product.specs).map(([k, v], i) => (
                      <div
                        key={k}
                        className={`grid grid-cols-[1fr_2fr] justify-start text-[14px]`}
                      >
                        <span className="text-ink-400 dark:text-ink-500">{k}</span>
                        <span className="text-ink-900 dark:text-white font-medium text-left">{v}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
                {activeTab === "Доставка" && (
                  <motion.div key="del" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-5">
                    <InfoBlock icon={Truck} color="brand" title="Доставка" desc="Доставка по региону - доступна" sub="Срок: 3-5 дней" />
                    <InfoBlock icon={Location} color="success" title="Склад / самовызов" desc="Ташкент, Узбекистан" />
                    <InfoBlock icon={Shield} color="ink" title="Условия" desc="Условия поставки обсуждаются с продавцом. Документы и счёта предоставляются." />
                  </motion.div>
                )}
                {activeTab === "Отзывы" && (
                  <motion.div key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                    {reviews.map((r) => (
                      <div key={r.id} className="flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {r.author.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <p className="text-sm font-semibold text-ink-900 dark:text-white flex items-center gap-1">
                              {r.author} {r.verified && <Verify size={14} className="text-brand-500" variant="Bold" />}
                            </p>
                            <RatingStars rating={r.rating} size={12} />
                          </div>
                          <p className="text-xs text-ink-400 dark:text-ink-500 mb-1">{r.industry}</p>
                          <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed">{r.text}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors">
              <p className="font-semibold text-ink-900 dark:text-white mb-3.5">О продавце</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {company.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-ink-900 dark:text-white flex items-center gap-1">
                    {company.name} <TickCircle size={20} variant="Outline" className="text-brand-500" />
                  </p>
                  <p className="text-[12px] text-ink-400 dark:text-ink-500">{company.industry} {company.city}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <Stat value={company.rating} label="Рейтинг" />
                <Stat value={company.reviews} label="Отзывы" />
                <Stat value={company.rating} label="Товаров" />
              </div>
              <a href={`/company/${company.id}`} className="text-sm flex justify-center items-center font-medium text-brand-600 dark:text-brand-400 hover:underline">
                Перейти на страницу компании →
              </a>
            </div>
            <div className="bg-white dark:bg-[#0D0D0D] rounded-[12px] border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 flex flex-col gap-5 transition-colors">
              <FeatureRow icon={ShieldTick} text="Безопасная сделка через платформу" />
              <FeatureRow icon={TickCircle} text="Верифицированный данные компании" />
              <FeatureRow icon={Box} text="Оригинальная продукция с документами" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ value, label }) {
  return (
    <div className="bg-ink-50/70 dark:bg-[#171717] rounded-xl py-2.5">
      <p className="text-[17px] font-bold text-ink-900 dark:text-white">{value}</p>
      <p className="text-[12px] text-ink-400 dark:text-ink-500">{label}</p>
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
