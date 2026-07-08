import { FaStar } from "react-icons/fa6";

export default function RatingStars({ rating = 0, size = 20, showValue = false, count }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <FaStar 
            key={i}
            size={size}
            variant="Bold"
            className={i <= full ? "text-amber-400" : "text-ink-200 dark:text-ink-700"}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-[8.25px] text-ink-400 ml-1">
          {rating.toFixed(1)} {count ? `(${count} отзывов)` : ""}
        </span>
      )}
    </span>
  );
}
