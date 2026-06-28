import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Notification,
  Heart,
  ShoppingCart,
  ArrowDown2,
  Logout,
  Sun1,
  Moon,
  HamburgerMenu,
  CloseCircle,
  SearchNormal1,
  Messages1,
  Messages2,
  Profile,
  Element3,
  ElementPlus,
  Buildings,
  Setting,
} from "iconsax-reactjs";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const { user, logout } = useAuth();
  const { items, favorites } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <header className="h-16 md:h-[72px] shrink-0 bg-white dark:bg-[#0D0D0D] border-b border-ink-200/70 dark:border-[#1E1E1E] flex items-center justify-between px-3 sm:px-4 md:px-10 gap-2 sm:gap-4 transition-colors relative z-30">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden text-ink-600 dark:text-ink-300 p-1.5 -ml-1 shrink-0"
          aria-label="Открыть меню"
        >
          <HamburgerMenu size={24} variant="Linear" />
        </button>

        <Link
          to="/"
          className="text-base sm:text-2xl font-extrabold text-ink-900 dark:text-white tracking-tight shrink-0"
        >
          <span className="sm:hidden">SX</span>
          <span className="hidden sm:inline">Sklad Market</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 shrink-0">
          <button
            onClick={() => navigate("/ai-agent")}
            className="hidden sm:flex items-center gap-5 px-4 py-2 rounded-full border border-ink-200 dark:border-[#1C1C1C] text-ink-500 dark:text-ink-400 hover:border-brand-300 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-sm w-full max-w-xs"
          >
            <Messages1 size={18} variant="Linear" />
            <span className="flex-1 text-left text-xs text-black dark:text-white">Ai agent</span>
            <kbd className="text-[14px] bg-ink-100 dark:bg-[#2A2A2A] px-3 rounded-full ml-5 font-mono text-ink-500 dark:text-white">
              ⌘ K
            </kbd>
          </button>
          <button
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="sm:hidden text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white transition-colors p-1"
            aria-label="Поиск"
          >
            <SearchNormal1 size={21} variant="Linear" />
          </button>

          {/* theme toggle */}
          <button
            onClick={toggleTheme}
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-ink-100 dark:bg-[#1C1C1C] flex items-center justify-center text-ink-600 dark:text-amber-300 hover:bg-ink-200 dark:hover:bg-[#1E1E1E] transition-colors shrink-0"
            aria-label="Переключить тему"
            title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                {theme === "dark" ? <Sun1 size={18} variant="Bold" /> : <Moon size={18} variant="Bold" />}
              </motion.span>
            </AnimatePresence>
          </button>

          <button className="hidden xs:inline-flex text-ink-500 dark:text-[#CDD1D6] hover:text-ink-900 dark:hover:text-white transition-colors">
            <Notification size={24} variant="Linear" />
          </button>
          <Link
            to="/favorites"
            className="relative text-ink-500 dark:text-[#CDD1D6] hover:text-ink-900 dark:hover:text-white transition-colors hidden xs:inline-flex"
          >
            <Heart size={24} variant="Linear" />
            {favorites?.size > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {favorites.size}
              </span>
            )}
          </Link>
          <Link
            to="/seller?tab=messages"
            className="hidden md:inline-flex text-ink-500 dark:text-[#CDD1D6] hover:text-ink-900 dark:hover:text-white transition-colors"
          >
            <Messages2 size={24} variant="Linear" />
          </Link>
          <Link to="/cart" className="relative text-ink-500 dark:text-[#CDD1D6] hover:text-ink-900 dark:hover:text-white transition-colors">
            <ShoppingCart size={22} variant="Linear" />
            {items?.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative hidden sm:block" ref={ref}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 dark:border-[#1C1C1C]"
              >
                <div className="w-9 h-9 rounded-full border border-ink-100 dark:bg-[#0D0D0D] flex items-center justify-center text-ink-500 dark:text-ink-300">
                  <Profile size={16} variant="Linear" />
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-[14px] text-nowrap font-semibold text-ink-900 dark:text-white leading-tight">{user.name}</p>
                  <p className="text-[13px] text-nowrap text-ink-400 leading-tight">{user.role}</p>
                </div>
                <ArrowDown2 size={16} className={`text-ink-400 ml-4 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-14 w-72 bg-[#FAFAFA] dark:bg-[#121212] rounded-2xl shadow-popover border border-ink-100 dark:border-[#1C1C1C] p-2 z-50"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#0D0D0D] mb-1">
                      <div className="w-10 h-10 rounded-full border border-ink-200 dark:bg-[#0D0D0D] flex items-center justify-center text-ink-600 dark:text-[#8A8A8A]">
                        <Profile size={18} variant="Linear" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-ink-400">{user.company}</p>
                      </div>
                    </div>
                    <DropdownItem icon={Element3} label="Панель продавца" onClick={() => { navigate("/seller"); setOpen(false); }} />
                    <DropdownItem icon={ElementPlus} label="Панель модератора" onClick={() => { navigate("/moderator"); setOpen(false); }} />
                    <DropdownItem icon={Buildings} label="Профиль компании" onClick={() => { navigate("/profile"); setOpen(false); }} />
                    <DropdownItem icon={Setting} label="Настройка" onClick={() => { navigate("/seller?tab=settings"); setOpen(false); }} />
                    <div className="h-px bg-ink-100 dark:bg-[#1C1C1C] my-1" />
                    <DropdownItem
                      icon={Logout}
                      label="Выйти из аккаунта"
                      danger
                      onClick={() => {
                        logout();
                        setOpen(false);
                        navigate("/login");
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="hover:bg-gray-300 dark:text-white dark:hover:bg-gray-800 border border-gray-300 text-xs sm:text-sm font-semibold px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">Зарегистрироваться</span>
              <span className="sm:hidden">Войти</span>
            </Link>
          )}
        </div>
      </header>

      {/* mobile search bar (expands below header) */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden bg-white dark:bg-[#0D0D0D] border-b border-ink-200/70 dark:border-[#1C1C1C] overflow-hidden relative z-20"
          >
            <div className="flex items-center gap-2 px-3 py-3">
              <div className="flex-1 flex items-center gap-2 bg-ink-50 dark:bg-[#171717] rounded-full px-4 py-2.5">
                <SearchNormal1 size={16} className="text-ink-400" />
                <input
                  autoFocus
                  placeholder="Поиск товара"
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white"
                />
              </div>
              <button onClick={() => setMobileSearchOpen(false)} className="text-ink-400 p-1">
                <CloseCircle size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}

function DropdownItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${danger
          ? "text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10"
          : "text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-[#171717]"
        }`}
    >
      <Icon size={18} variant="Linear" />
      {label}
    </button>
  );
}
