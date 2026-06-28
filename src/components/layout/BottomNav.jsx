import { NavLink } from "react-router-dom";
import { Home2, Box2, Heart, ShoppingCart, Buildings2 } from "iconsax-reactjs";
import { useCart } from "../../context/CartContext";

const navItems = [
  { to: "/", label: "Главная", icon: Home2 },
  { to: "/catalog", label: "Каталог", icon: Box2 },
  { to: "/favorites", label: "Фавориты", icon: Heart },
  { to: "/cart", label: "Корзина", icon: ShoppingCart },
  { to: "/companies", label: "Компании", icon: Buildings2 },
];

export default function BottomNav() {
  const { items, favorites } = useCart();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white dark:bg-[#0D0D0D] border-t border-ink-200/70 dark:border-[#1C1C1C] flex items-center justify-around z-40 transition-colors">
      {navItems.map(({ to, label, icon: Icon }) => {
        const badge =
          to === "/favorites" ? favorites?.size : to === "/cart" ? items?.length : 0;
        return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] transition-colors ${
                isActive ? "text-brand-600 dark:text-brand-400" : "text-ink-400 dark:text-ink-500"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon size={22} variant={isActive ? "Bold" : "Linear"} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-brand-600 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </span>
                {label}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
