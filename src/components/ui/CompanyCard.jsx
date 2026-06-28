import { Link, useNavigate } from "react-router-dom";
import { Heart, ArrowRight, TickCircle } from "iconsax-reactjs";
import { useCart } from "../../context/CartContext";

export default function CompanyCard({ company }) {
  const { favorites, toggleFavorite } = useCart();
  const isFav = favorites?.has(company.id);
  const initials = company.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center mb-1 gap-1.5">
              <p className="font-semibold text-ink-900 dark:text-white text-sm">{company.name}</p>
              {company.verified && <TickCircle size={20} variant="Outline" className="text-brand-500" />}
            </div>
            <p className="text-xs text-[#7F7F7F] mb-1">
              {company.industry} {company.city}
            </p>
            <p className="text-xs text-[#7F7F7F]">с {company.since} г</p>
          </div>
        </div>
        <button onClick={() => toggleFavorite(company.id)} className="shrink-0">
          <Heart size={24} variant={isFav ? "Bold" : "Linear"} className={isFav ? "text-danger-500" : "text-ink-300 dark:text-ink-600"} />
        </button>
      </div>

      <p className="text-xs text-[#7F7F7F] leading-relaxed">{company.description}</p>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat value={company.rating} label="Рейтинг" />
        <Stat value={company.reviews} label="Отзывы" />
        <Stat value={company.rating} label="Товаров" />
      </div>

      <div className="flex justify-center">
        <Link to={`/company/${company.id}`}
          className="text-xs text-center sm:text-sm font-medium text-brand-600 dark:text-brand-400 flex items-center gap-1.5 hover:gap-2.5 transition-all"
        > Перейти на страницу компании <ArrowRight size={16} /></Link>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="bg-ink-50/70 dark:bg-[#121212] rounded-xl py-2 sm:py-2.5">
      <p className="text-sm font-bold text-ink-900 dark:text-[#CDD1D6]">{value}</p>
      <p className="text-[10px] sm:text-[11px] text-[#7F7F7F]">{label}</p>
    </div>
  );
}
