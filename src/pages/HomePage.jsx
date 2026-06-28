import { useState } from "react";
import { motion } from "framer-motion";
import { SearchNormal1, Sort } from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import ProductCard from "../components/ui/ProductCard";
import PillToggle from "../components/ui/PillToggle";
import { productGrid } from "../data/mockData";
import img1 from '../assets/hero/hero-1.jpg'
import img2 from '../assets/hero/hero-2.jpg'
import img3 from '../assets/hero/hero-3.png'
import img4 from '../assets/hero/hero-4.jpg'
import { Input } from "antd";
import Catalog from "../components/modal/Catalog";

export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [saleType, setSaleType] = useState("wholesale");
  const banners = [
    { id: 1, img: img1 },
    { id: 2, img: img2 },
    { id: 3, img: img3 },
    { id: 4, img: img4 },
  ]

  return (
    <AppShell>
      <div className="p-10 sm:p-10 bg-[#F9FAFB] dark:bg-[#121212]">
        <div className="relative mb-5 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-ink-700 dark:text-ink-200 hover:border-ink-300 dark:hover:border-ink-600 transition-colors shrink-0">
              {isOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9.16937 15.5794C8.97937 15.5794 8.78938 15.5094 8.63938 15.3594C8.34938 15.0694 8.34938 14.5894 8.63938 14.2994L14.2994 8.63938C14.5894 8.34938 15.0694 8.34938 15.3594 8.63938C15.6494 8.92937 15.6494 9.40937 15.3594 9.69937L9.69937 15.3594C9.55937 15.5094 9.35937 15.5794 9.16937 15.5794Z" fill="currentColor" />
                  <path d="M14.8294 15.5794C14.6394 15.5794 14.4494 15.5094 14.2994 15.3594L8.63938 9.69937C8.34938 9.40937 8.34938 8.92937 8.63938 8.63938C8.92937 8.34938 9.40937 8.34938 9.69937 8.63938L15.3594 14.2994C15.6494 14.5894 15.6494 15.0694 15.3594 15.3594C15.2094 15.5094 15.0194 15.5794 14.8294 15.5794Z" fill="currentColor" />
                </svg>
              ) : (
                <Sort size={24} variant="Linear" />
              )}
              <span className="hidden xs:inline">Каталог</span>
            </button>
            <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 sm:px-5 py-2.5 sm:py-3">
              <SearchNormal1 size={18} className="text-ink-400 shrink-0" />
              <input
                placeholder="Поиск товара"
                className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white"
              />
            </div>
          </div>
          <Catalog isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 relative z-1">
          {banners.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`overflow-hidden relative h-28 sm:h-40 rounded-2xl overflow-hidden bg-gradient-to-br flex flex-col justify-end text-white cursor-pointer hover:scale-[1.01] transition-transform`}
            >
              <img src={b.img} alt="img" className="object-cover w-full" />
            </motion.div>
          ))}
        </div>

        <div className="mb-6 sm:mb-8 overflow-x-auto relative z-1">
          <PillToggle
            options={[
              { value: "wholesale", label: "Оптом" },
              { value: "retail", label: "За штуку" },
            ]}
            value={saleType}
            onChange={setSaleType}
            className="w-full"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between px-16 gap-3 mb-4 sm:mb-5 relative z-1">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-ink-900 dark:text-white">Популярные товары</h2>
          <div className="sm:flex items-center w-64">
            <Input
              placeholder="Поиск товара"
              prefix={<SearchNormal1 size="24" className="text-ink-500 dark:text-ink-400 mr-2" />}
              className="!rounded-chip px-4 py-2 text-sm bg-white dark:bg-[#0D0D0D] dark:text-white dark:[&_input]:text-white dark:[&_input]:placeholder:text-ink-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 px-16 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {productGrid.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </AppShell >
  );
}
