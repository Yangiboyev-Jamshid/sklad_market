import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloseCircle,
  Sun1,
  Moon,
  Home2,
  Buildings,
  BoxAdd,
  UserSquare,
  SecurityUser,
  DollarCircle,
  ClipboardText,
  ElementPlus,
  Setting,
  Logout,
  LoginCurve,
  UserAdd,
  Profile,
} from "iconsax-reactjs";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import LanguageSwitcher from "./LanguageSwitcher";
import logo from "../../assets/logo.png";

const navItems = [
  { to: "/", labelKey: "nav.home", icon: Home2 },
  { to: "/catalog", labelKey: "nav.catalog", icon: BoxAdd },
  { to: "/requests", labelKey: "nav.requests", icon: ClipboardText, hideForModerator: true },
  { to: "/profile", labelKey: "nav.profile", icon: UserSquare, sellerOnly: true },
  { to: "/companies", labelKey: "nav.companies", icon: Buildings },
  { to: "/seller", labelKey: "nav.seller", icon: SecurityUser, sellerOnly: true },
  { to: "/moderator", labelKey: "nav.moderator", icon: ElementPlus, moderatorOnly: true },
  { to: "/tariffs", labelKey: "nav.tariffs", icon: DollarCircle },
];

export default function MobileMenu({ open, onClose }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const roleUpper = (user?.role || "").toUpperCase();
  const isSeller = roleUpper === "SELLER";
  const isModerator = roleUpper.includes("MODERATOR") || roleUpper.includes("ADMIN");
  const visibleNavItems = navItems.filter(
    (item) =>
      (!item.sellerOnly || isSeller) &&
      (!item.moderatorOnly || isModerator) &&
      (!item.hideForModerator || !isModerator)
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-[60] md:hidden"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed inset-y-0 left-0 w-[82%] max-w-[300px] bg-white dark:bg-[#0D0D0D] z-[70] md:hidden flex flex-col shadow-popover rounded-r-[10px] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 h-16 shrink-0 border-b border-ink-100 dark:border-[#1C1C1C]">
              <Link to="/" onClick={onClose} className="flex items-center gap-2 min-w-0">
              <img src={logo} alt="" width={25} height={26} className="object-contain shrink-0" />
              <span className="text-base font-display font-extrabold tracking-tight truncate">
                <span className="text-[#0B1F33] dark:text-white">Sklad</span> <span className="text-[#039484]">Market</span>
              </span>
              </Link>
              <button
                onClick={onClose}
                className="text-ink-400 hover:text-ink-700 dark:hover:text-white transition-colors p-1 -mr-1"
                aria-label={t("common.close")}
              >
                <CloseCircle size={24} variant="Linear" />
              </button>
            </div>

            {user && (
              <button
                onClick={() => { navigate("/account"); onClose(); }}
                className="flex items-center gap-3 mx-4 mt-4 p-3 rounded-2xl bg-ink-50 dark:bg-[#171717] shrink-0 text-left"
              >
                <div className="w-10 h-10 rounded-full border border-ink-200 dark:border-[#2A2A2A] bg-white dark:bg-[#0D0D0D] flex items-center justify-center text-ink-500 dark:text-ink-300 shrink-0 overflow-hidden">
                  {user.photoUrl ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" /> : <Profile size={18} variant="Linear" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-ink-400 truncate">{user.role}</p>
                </div>
              </button>
            )}

            <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
              {visibleNavItems.map(({ to, labelKey, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition-colors ${isActive
                      ? "font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/15"
                      : "font-medium text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-[#171717] hover:text-ink-800 dark:hover:text-ink-200"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={20} variant={isActive ? "Bold" : "Linear"} />
                      <span>{t(labelKey)}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="px-3 pb-4 pt-3 border-t border-ink-100 dark:border-[#1C1C1C] flex flex-col gap-1 shrink-0">
              <LanguageSwitcher variant="mobile" />
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-[#171717] hover:text-ink-800 dark:hover:text-ink-200 transition-colors"
              >
                {theme === "dark" ? <Sun1 size={20} variant="Linear" /> : <Moon size={20} variant="Linear" />}
                <span>{theme === "dark" ? t("header.lightTheme") : t("header.darkTheme")}</span>
              </button>

              {user ? (
                <>
                  {isSeller && (
                    <button
                      onClick={() => {
                        navigate("/seller?tab=settings");
                        onClose();
                      }}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-[#171717] hover:text-ink-800 dark:hover:text-ink-200 transition-colors"
                    >
                      <Setting size={20} variant="Linear" />
                      <span>{t("header.settings")}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      onClose();
                      navigate("/login");
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors"
                  >
                    <Logout size={20} variant="Linear" />
                    <span>{t("header.logout")}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      navigate("/login", { state: { mode: "login" } });
                      onClose();
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold text-ink-900 dark:text-white hover:bg-ink-50 dark:hover:bg-[#171717] transition-colors"
                  >
                    <LoginCurve size={20} variant="Linear" />
                    <span>{t("mobileMenu.login")}</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate("/login", { state: { mode: "register" } });
                      onClose();
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                  >
                    <UserAdd size={20} variant="Linear" />
                    <span>{t("mobileMenu.register")}</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
