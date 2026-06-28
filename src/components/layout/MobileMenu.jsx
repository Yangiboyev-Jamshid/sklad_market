import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloseCircle,
  Home2,
  Box1,
  Box2,
  Profile,
  Buildings2,
  DollarSquare,
  Wallet2,
  Category2,
  Setting2,
  Logout,
  Sun1,
  Moon,
} from "iconsax-reactjs";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const navItems = [
  { to: "/", label: "Главная", icon: Home2 },
  { to: "/catalog", label: "Каталог", icon: Box2 },
  { to: "/products-explore", label: "Продукты", icon: Box1 },
  { to: "/profile", label: "Профиль", icon: Profile },
  { to: "/companies", label: "Компании", icon: Buildings2 },
  { to: "/seller", label: "Панель продавца", icon: DollarSquare },
  { to: "/moderator", label: "Панель модератора", icon: Category2 },
  { to: "/tariffs", label: "Тарифы", icon: Wallet2 },
];

export default function MobileMenu({ open, onClose }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
            className="fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-[#0D0D0D] z-[70] md:hidden flex flex-col shadow-popover"
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-ink-100 dark:border-[#1C1C1C]">
              <p className="font-display font-extrabold text-lg text-ink-900 dark:text-white">
                SKLAD<span className="text-brand-600">X</span>
              </p>
              <button onClick={onClose} className="text-ink-400">
                <CloseCircle size={24} />
              </button>
            </div>

            {user && (
              <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-100 dark:border-[#1C1C1C]">
                <div className="w-10 h-10 rounded-full bg-ink-100 dark:bg-[#171717] flex items-center justify-center text-ink-500 dark:text-ink-300">
                  <Buildings2 size={18} variant="Linear" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-ink-400">{user.company}</p>
                </div>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400"
                        : "text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717]"
                    }`
                  }
                >
                  <Icon size={20} variant="Linear" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="p-3 border-t border-ink-100 dark:border-[#1C1C1C] flex flex-col gap-1">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717] transition-colors"
              >
                {theme === "dark" ? <Sun1 size={20} variant="Linear" /> : <Moon size={20} variant="Linear" />}
                {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
              </button>
              <button
                onClick={() => {
                  navigate("/seller?tab=settings");
                  onClose();
                }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717] transition-colors"
              >
                <Setting2 size={20} variant="Linear" />
                Настройка
              </button>
              {user && (
                <button
                  onClick={() => {
                    logout();
                    onClose();
                    navigate("/login");
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors"
                >
                  <Logout size={20} variant="Linear" />
                  Выйти из аккаунта
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
