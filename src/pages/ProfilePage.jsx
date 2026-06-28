import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Call,
  Global,
  Location,
  Buildings2,
  Calendar,
  Box1,
  Sms,
  ArrowDown2,
  TickCircle,
  Message,
  GlobalSearch,
  SecurityUser,
} from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import RatingStars from "../components/ui/RatingStars";
import ProductThumb from "../components/ui/ProductThumb";
import MapView from "../components/ui/MapView";
import { companies, products, reviews } from "../data/mockData";

const pins = [
  { id: 1, x: 78, y: 50, color: "purple", label: 1 },
  { id: 2, x: 38, y: 36, color: "purple", label: 2 },
  { id: 3, x: 32, y: 56, color: "purple", label: 3 },
  { id: 4, x: 56, y: 72, color: "purple", label: 4 },
];

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const company = companies.find((c) => c.id === id) || companies[0];
  const [tab, setTab] = useState("products");
  const [showMap, setShowMap] = useState(false);

  return (
    <AppShell>
      <div className="mx-auto p-4 sm:p-10 bg-[#F9FAFB] dark:bg-[#121212]">
        <div className="flex items-center justify-between mb-5 sm:mb-10 gap-3">
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white">Профиль</h1>
          <button
            onClick={() => navigate("/seller")}
            className="flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#2D2D2D] rounded-xl px-3.5 sm:px-12 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-ink-700 dark:text-ink-200 hover:border-ink-300 dark:hover:border-ink-600 transition-colors shrink-0"
          >
            <SecurityUser size={20} /> <span className="hidden sm:inline">Панель продавца</span>
          </button>
        </div>

        <div className="relative bg-white dark:bg-[#0D0D0D] pt-[64px] pb-[20px] px-[27px] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] overflow-hidden mb-5 sm:mb-6 transition-colors">
          <div className="absolute -z-2 top-0 left-0 right-0 bottom-[40%] dark:bg-[#00183A] bg-[#DEECFF] rounded-2xl" />
          <div className="relative z-2 px-4 sm:px-6 pb-5 sm:pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-3 sm:gap-4">
              <div className="p-9 bg-[#F6F6F6] dark:bg-[#161616] rounded-full">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg sm:text-2xl shadow-card shrink-0">
                  {company.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold mr-6 text-lg sm:text-2xl text-ink-900 dark:text-white">{company.name}</p>
                  {company.verified && (
                    <span className="flex items-center gap-1 text-xs font-medium text-success-700 dark:text-success-400 bg-success-50 dark:bg-success-500/15 px-2.5 py-1 rounded-[4px]">
                      <TickCircle size={12} variant="Outline" /> Верефицирован
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-400 dark:text-ink-500">{company.industry} {company.city}</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-2.5 overflow-x-auto">
              <button className="flex items-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white dark:text-black text-xs sm:text-sm px-2 sm:px-2 py-2.5 sm:py-3 rounded-2xl transition-colors shrink-0">
                <Message size={20} /> Написать
              </button>
              <button className="flex items-center gap-2.5 border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 text-xs sm:text-sm font-medium px-2 sm:px-2 py-2 sm:py-3 rounded-2xl text-ink-700 dark:text-ink-200 transition-colors shrink-0">
                <Call size={20} /> <span className="hidden xs:inline">Позвонить</span>
              </button>
              <button
                onClick={() => setShowMap((v) => !v)}
                className={`flex items-center gap-2.5 text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 sm:py-3 rounded-2xl transition-colors shrink-0 ${showMap ? "bg-brand-600 text-white" : "border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 text-ink-700 dark:text-ink-200"
                  }`}
              >
                <GlobalSearch size={20} /> Карта
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {showMap ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors"
            >
              <div className="grid grid-cols-2 items-center justify-between mb-4">
                <p className="font-semibold text-ink-900 dark:text-white">Карта с магазинами</p>
                <button className="flex justify-between border border-[#DFDFDF] items-center gap-2 dark:border-[#2D2D2D] rounded-xl px-4 py-2 text-sm text-ink-700 dark:text-ink-200">
                  Ташкент <ArrowDown2 size={16} />
                </button>
              </div>
              <MapView pins={pins} height="h-[360px] sm:h-[480px]" center={{ x: 55, y: 50 }} />
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 sm:gap-6">
              <div className="flex flex-col gap-4">
                <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors">
                  <p className="font-semibold text-ink-900 dark:text-white mb-2">О продавце</p>
                  <p className="text-[14px] text-ink-500 dark:text-ink-100 leading-relaxed mb-4">{company.description}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Stat value={company.rating} label="Рейтинг" />
                    <Stat value={company.reviews} label="Отзывы" />
                    <Stat value={company.rating} label="Товаров" />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors">
                  <p className="font-semibold text-ink-900 dark:text-white mb-4">Информация</p>
                  <InfoRow icon={Location} label="Местоположение" value={`${company.city}, Узбекистан`} />
                  <InfoRow icon={Buildings2} label="Отрасль" value={company.industry} />
                  <InfoRow icon={Calendar} label="Основана" value={`${company.since} год`} />
                  <InfoRow icon={Box1} label="Товаров" value={company.productsCount} last />
                </div>

                <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors">
                  <p className="font-semibold text-ink-900 dark:text-white mb-4">Контакты</p>
                  <InfoRow icon={Call} label="Телефон" value={company.phone} />
                  <InfoRow icon={Sms} label="Email" value={company.email} />
                  <InfoRow icon={Global} label="Website" value={company.website} />
                </div>
              </div>

              <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] transition-colors">
                <div className="flex border-b border-ink-100 dark:border-[#1C1C1C] px-2 overflow-x-auto">
                  {[
                    { v: "products", l: `Товары (${products.length})` },
                    { v: "reviews", l: `Отзывы (${reviews.length + 21})` },
                  ].map((t) => (
                    <button
                      key={t.v}
                      onClick={() => setTab(t.v)}
                      className={`relative px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap ${tab === t.v ? "text-ink-900 dark:text-white" : "text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
                        }`}
                    >
                      {t.l}
                      {tab === t.v && <motion.div layoutId="profile-tab" className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand-600" />}
                    </button>
                  ))}
                </div>

                <div className="p-4 sm:p-6">
                  {tab === "products" ? (
                    <>
                      <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed mb-4">{products[0].description}</p>
                      <div className="flex gap-2 flex-wrap mb-6">
                        {products[0].tags.map((t) => (
                          <span key={t} className="text-xs bg-ink-100 dark:bg-[#171717] text-ink-600 dark:text-ink-300 px-3 py-1.5 rounded-full">{t}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        {products.slice(0, 2).map((p) => (
                          <div key={p.id} className="border border-ink-100 p-5 dark:border-[#1C1C1C] rounded-xl overflow-hidden">
                            <div className="h-[220px] w-full aspect-square relative flex items-center justify-center bg-[#E2E2E2] dark:bg-[#2A2A2A] rounded-xl">
                              <ProductThumb />
                            </div>
                            <div className="p-3">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-sm font-semibold text-ink-900 dark:text-white">{p.name}</p>
                                {p.verified && (
                                  <span className="text-[10px] font-medium bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-400 px-1.5 py-0.5 rounded-full shrink-0">
                                    Verified
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-ink-400 dark:text-ink-500 mb-2">{p.company}</p>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-ink-400 dark:text-ink-500">от {p.price} $ / тонна</p>
                                <button
                                  onClick={() => navigate(`/product/${p.id}`)}
                                  className="text-xs font-medium text-black dark:bg-[#2A2A2A] dark:text-white bg-[#E2E2E2] px-2.5 py-1 rounded-full hover:bg-brand-50 dark:hover:bg-brand-500/10 shrink-0"
                                >
                                  Подробнее
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {reviews.map((r) => (
                        <div key={r.id} className="flex gap-3 border border-[#F0F0F0] dark:border-[#1C1C1C] p-3 rounded-xl">
                          <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {r.author.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                              <p className="text-sm font-semibold text-ink-900 dark:text-white flex items-center gap-1">
                                {r.author} {r.verified && <TickCircle size={20} className="text-brand-500" variant="Bold" />}
                              </p>
                              <RatingStars rating={r.rating} size={12} />
                            </div>
                            <p className="text-xs text-ink-400 dark:text-ink-500 mb-1">{r.industry}</p>
                            <p className="text-sm text-ink-600 dark:text-white leading-relaxed">{r.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function Stat({ value, label }) {
  return (
    <div className="bg-ink-50/70 dark:bg-[#121212] rounded-xl py-2.5">
      <p className="text-sm font-bold text-ink-900 dark:text-white">{value}</p>
      <p className="text-[11px] text-ink-400 dark:text-ink-500">{label}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className={`flex items-center gap-3 py-3`}>
      <div className="w-9 h-9 rounded-lg bg-ink-50 dark:bg-[#1A1A1A] flex items-center justify-center text-ink-500 dark:text-ink-300 shrink-0">
        <Icon size={16} variant="Linear" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-400">{label}</p>
        <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}
