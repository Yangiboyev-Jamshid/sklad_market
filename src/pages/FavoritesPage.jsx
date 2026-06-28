import { useState } from "react";
import { SearchNormal1, GlobalSearch } from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import ProductCard from "../components/ui/ProductCard";
import CompanyCard from "../components/ui/CompanyCard";
import PillToggle from "../components/ui/PillToggle";
import { productGrid, companies } from "../data/mockData";

export default function FavoritesPage() {
  const [tab, setTab] = useState("products");

  return (
    <AppShell>
      <div className="mx-auto p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white">Фавориты</h1>
            <p className="text-sm text-ink-400 dark:text-ink-500 mt-1">35 товаров</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 sm:flex-none flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 py-2.5 sm:w-64">
              <SearchNormal1 size={16} className="text-ink-400 shrink-0" />
              <input placeholder="Поиск товара" className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white" />
            </div>
            <button className="hidden sm:flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 py-2.5 text-sm font-medium text-ink-700 dark:text-ink-200 hover:border-ink-300 dark:hover:border-ink-600">
              <GlobalSearch size={16} /> Поиск по карте
            </button>
          </div>
        </div>

        <div className="overflow-x-auto mb-6 sm:mb-7">
          <PillToggle
            options={[
              { value: "products", label: "Товары" },
              { value: "companies", label: "Компании" },
            ]}
            value={tab}
            onChange={setTab}
            className="w-full"
          />
        </div>

        {tab === "products" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {productGrid.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {companies.map((c) => (
              <CompanyCard key={c.id} company={c} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
