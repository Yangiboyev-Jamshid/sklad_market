import { NavLink } from "react-router-dom";
import {
  Home2,
  Buildings,
  BoxAdd,
  UserSquare,
  SecurityUser,
  DollarCircle,
  ClipboardText
} from "iconsax-reactjs";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

const navItems = [
  { to: "/", labelKey: "nav.home", icon: Home2 },
  { to: "/catalog", labelKey: "nav.catalog", icon: BoxAdd },
  { to: "/requests", labelKey: "nav.requests", icon: ClipboardText, hideForModerator: true },
  { to: "/profile", labelKey: "nav.profile", icon: UserSquare, sellerOnly: true },
  { to: "/companies", labelKey: "nav.companies", icon: Buildings },
  { to: "/seller", labelKey: "nav.seller", icon: SecurityUser, sellerOnly: true },
  { to: "/tariffs", labelKey: "nav.tariffs", icon: DollarCircle },
];

export default function SidebarRail() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const roleUpper = (user?.role || "").toUpperCase();
  const isSeller = roleUpper === "SELLER";
  const isModerator = roleUpper.includes("MODERATOR") || roleUpper.includes("ADMIN");
  const visibleNavItems = navItems.filter(
    (item) => (!item.sellerOnly || isSeller) && (!item.hideForModerator || !isModerator)
  );
  return (
    <aside className="hidden md:block relative w-[72px] shrink-0">
      <div className="group absolute inset-y-0 left-0 z-40 w-[72px] hover:w-64 flex flex-col items-start bg-white dark:bg-[#0D0D0D] border-r border-ink-200/70 dark:border-[#1E1E1E] py-4 gap-1 overflow-hidden shadow-none hover:shadow-popover transition-[width] duration-200 ease-out">
        <NavLink
          to="/"
          className="flex items-center shrink-0 mb-3 ml-4 text-black dark:text-white"
        >
          <span className="w-10 h-10 flex items-center justify-center gap-2 shrink-0">
            <img src={logo} alt="" width={25} height={26} className="object-contain" />
          </span>
          <span className="whitespace-nowrap text-[18px] font-display font-bold pr-4 max-w-0 group-hover:max-w-[160px] opacity-0 group-hover:opacity-100 overflow-hidden transition-all duration-200">
            <span className="text-[#0B1F33] dark:text-white">Sklad</span> <span className="text-[#039484]">Market</span>
          </span>
        </NavLink>
        <div className=" h-px bg-ink-200 dark:bg-[#1C1C1C] mb-2 ml-5 shrink-0" />
        <nav className="flex flex-col gap-1 w-full items-start">
          {visibleNavItems.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={t(labelKey)}
              className={({ isActive }) =>
                `relative flex items-center h-11 w-11 group-hover:w-[196px] rounded-xl ml-[14px] mr-2 shrink-0 overflow-hidden transition-[width,color] duration-200 ${isActive
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-[#171717] hover:text-ink-700 dark:hover:text-ink-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-brand-50 dark:bg-brand-500/15"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="w-11 h-11 flex items-center justify-center shrink-0 relative z-10">
                    <Icon size={20} variant={isActive ? "Bold" : "Linear"} />
                  </span>
                  <span className="relative z-10 whitespace-nowrap text-sm font-medium pr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {t(labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
