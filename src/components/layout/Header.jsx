import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getChatUnreadCount, getNotifications, getNotificationsUnreadCount, markNotificationsRead } from "../../api/api";
import {
  Notification,
  Heart,
  ShoppingCart,
  ArrowDown2,
  Logout,
  Sun1,
  Moon,
  HamburgerMenu,
  Messages1,
  Messages2,
  Profile,
  Element3,
  ElementPlus,
  Buildings,
  Setting,
  TickCircle,
  UserSquare,
} from "iconsax-reactjs";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import MobileMenu from "./MobileMenu";
import LanguageSwitcher from "./LanguageSwitcher";
import { cartIconRefs } from "../../utils/cartFly";

const NOTIF_LABEL_KEYS = {
  PRODUCT_CREATED: "header.notifProductCreated",
  COMPANY_CREATED: "header.notifCompanyCreated",
};

function notifLabel(type, t) {
  return NOTIF_LABEL_KEYS[type] ? t(NOTIF_LABEL_KEYS[type]) : type?.replace(/_/g, " ") ?? t("header.notifDefault");
}

const PAGE_TITLE_KEYS = [
  { test: (p) => p === "/", titleKey: "nav.home" },
  { test: (p) => p.startsWith("/catalog"), titleKey: "nav.catalog" },
  { test: (p) => p.startsWith("/product/"), titleKey: "nav.product" },
  { test: (p) => p.startsWith("/favorites"), titleKey: "nav.favorites" },
  { test: (p) => p.startsWith("/cart"), titleKey: "nav.cart" },
  { test: (p) => p.startsWith("/ai-agent"), titleKey: "nav.aiAgent" },
  { test: (p) => p.startsWith("/companies"), titleKey: "nav.companies" },
  { test: (p) => p.startsWith("/company/"), titleKey: "nav.profile" },
  { test: (p) => p.startsWith("/profile"), titleKey: "nav.profile" },
  { test: (p) => p.startsWith("/seller"), titleKey: "nav.seller" },
  { test: (p) => p.startsWith("/moderator"), titleKey: "nav.moderator" },
  { test: (p) => p.startsWith("/tariffs"), titleKey: "nav.tariffs" },
];

function getPageTitle(pathname, t) {
  const found = PAGE_TITLE_KEYS.find(({ test }) => test(pathname));
  return found ? t(found.titleKey) : t("common.brand");
}

function notifBody(item) {
  const p = item.payload ?? {};
  return (
    p.message ?? p.text ?? p.description ?? p.product_name ?? p.company_name ?? ""
  );
}

function timeAgo(iso, t) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t("header.timeJustNow");
  if (m < 60) return t("header.timeMinutesAgo", { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("header.timeHoursAgo", { count: h });
  return t("header.timeDaysAgo", { count: Math.floor(h / 24) });
}

export default function Header() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { items, favorites } = useCart();
  const { theme, toggleTheme } = useTheme();
  const roleUpper = (user?.role || "").toUpperCase();
  const isSeller = roleUpper === "SELLER";
  const isModerator = roleUpper.includes("MODERATOR") || roleUpper.includes("ADMIN");

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartMenuOpen, setCartMenuOpen] = useState(false);

  const [chatUnread, setChatUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const cartMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname, t);
  const cartBumpControls = useAnimation();

  useEffect(() => {
    const handler = () => {
      cartBumpControls.start({
        scale: [1, 1.35, 0.9, 1.08, 1],
        transition: { duration: 0.5, ease: "easeInOut" },
      });
    };
    window.addEventListener("cart-bump", handler);
    return () => window.removeEventListener("cart-bump", handler);
  }, [cartBumpControls]);

  useEffect(() => {
    if (!user) return;
    const fetchCounts = () => {
      getChatUnreadCount().then(setChatUnread).catch(() => {});
      getNotificationsUnreadCount().then(setNotifUnread).catch(() => {});
    };
    fetchCounts();
    const id = setInterval(fetchCounts, 30000);
    return () => clearInterval(id);
  }, [user]);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const data = await getNotifications({ per_page: 20 });
      setNotifications(data?.items ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    if (notifOpen) loadNotifications();
  }, [notifOpen, loadNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (cartMenuRef.current && !cartMenuRef.current.contains(e.target)) setCartMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkAll = async () => {
    try {
      await markNotificationsRead({ mark_all: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
      setNotifUnread(0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await markNotificationsRead({ notification_ids: [id] });
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setNotifUnread((c) => Math.max(0, c - 1));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <header className="h-16 md:h-[72px] shrink-0 bg-white dark:bg-[#0D0D0D] border-b border-ink-200/70 dark:border-[#1E1E1E] flex items-center justify-between px-3 sm:px-4 md:px-10 gap-2 sm:gap-4 transition-colors relative z-30">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden text-ink-600 dark:text-ink-300 p-1.5 -ml-1 shrink-0"
          aria-label={t("header.openMenu")}
        >
          <HamburgerMenu size={24} variant="Linear" />
        </button>

        <Link
          to="/"
          className="hidden sm:block text-2xl font-extrabold text-ink-900 dark:text-white tracking-tight shrink-0"
        >
          {t("common.brand")}
        </Link>

        <p className="sm:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-base font-semibold text-ink-900 dark:text-white">
          {pageTitle}
        </p>

        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 shrink-0">
          <button
            onClick={() => navigate("/ai-agent")}
            className="hidden sm:flex items-center gap-5 px-4 py-2 rounded-full border border-ink-200 dark:border-[#1C1C1C] text-ink-500 dark:text-ink-400 hover:border-brand-300 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-sm w-full max-w-xs"
          >
            <Messages1 size={18} variant="Linear" />
            <span className="flex-1 text-left text-xs text-black dark:text-white">{t("nav.aiAgent")}</span>
            <kbd className="text-[14px] bg-ink-100 dark:bg-[#2A2A2A] px-3 rounded-full ml-5 font-mono text-ink-500 dark:text-white">
              ⌘ K
            </kbd>
          </button>

          <LanguageSwitcher />

          <button
            onClick={toggleTheme}
            className="hidden sm:flex relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-ink-100 dark:bg-[#1C1C1C] items-center justify-center text-ink-600 dark:text-amber-300 hover:bg-ink-200 dark:hover:bg-[#1E1E1E] transition-colors shrink-0"
            aria-label={t("header.toggleTheme")}
            title={theme === "dark" ? t("header.lightTheme") : t("header.darkTheme")}
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

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="hidden sm:inline-flex relative text-ink-500 dark:text-[#CDD1D6] hover:text-ink-900 dark:hover:text-white transition-colors"
            >
              <Notification size={24} variant={notifOpen ? "Bold" : "Linear"} />
              {notifUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {notifUnread > 9 ? "9+" : notifUnread}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 w-auto sm:w-80 bg-[#FAFAFA] dark:bg-[#121212] rounded-2xl shadow-popover border border-ink-100 dark:border-[#1C1C1C] z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-[#1C1C1C]">
                    <span className="font-semibold text-sm text-ink-900 dark:text-white">
                      {t("header.notifications")}
                      {notifUnread > 0 && (
                        <span className="ml-2 bg-danger-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                          {notifUnread}
                        </span>
                      )}
                    </span>
                    {notifUnread > 0 && (
                      <button
                        onClick={handleMarkAll}
                        className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        <TickCircle size={13} />
                        {t("header.markAllRead")}
                      </button>
                    )}
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {notifLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex gap-3 px-4 py-3 border-b border-ink-50 dark:border-[#1C1C1C]">
                          <div className="w-8 h-8 rounded-full bg-ink-100 dark:bg-[#1C1C1C] animate-pulse shrink-0" />
                          <div className="flex-1 flex flex-col gap-2">
                            <div className="h-3 bg-ink-100 dark:bg-[#1C1C1C] rounded animate-pulse w-3/4" />
                            <div className="h-2.5 bg-ink-100 dark:bg-[#1C1C1C] rounded animate-pulse w-1/2" />
                          </div>
                        </div>
                      ))
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-ink-400 dark:text-ink-500">
                        <Notification size={28} variant="Linear" />
                        <p className="text-sm">{t("header.noNotifications")}</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isUnread = !n.read_at;
                        return (
                          <button
                            key={n.id}
                            onClick={() => !n.read_at && handleMarkOne(n.id)}
                            className={`w-full flex gap-3 px-4 py-3 border-b border-ink-50 dark:border-[#1C1C1C] hover:bg-ink-50 dark:hover:bg-[#171717] transition-colors text-left ${isUnread ? "bg-brand-50/60 dark:bg-[#0D1B3E]/60" : ""
                              }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUnread
                                ? "bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400"
                                : "bg-ink-100 dark:bg-[#1C1C1C] text-ink-400 dark:text-ink-500"
                                }`}
                            >
                              <Notification size={14} variant={isUnread ? "Bold" : "Linear"} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs leading-snug ${isUnread
                                  ? "font-semibold text-ink-900 dark:text-white"
                                  : "font-medium text-ink-600 dark:text-ink-300"
                                  }`}
                              >
                                {notifLabel(n.type, t)}
                              </p>
                              {notifBody(n) && (
                                <p className="text-[11px] text-ink-400 dark:text-ink-500 truncate mt-0.5">
                                  {notifBody(n)}
                                </p>
                              )}
                              <p className="text-[10px] text-ink-300 dark:text-ink-600 mt-1">
                                {timeAgo(n.sent_at, t)}
                              </p>
                            </div>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-brand-600 self-center shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/favorites"
            className="relative text-ink-500 dark:text-[#CDD1D6] hover:text-ink-900 dark:hover:text-white transition-colors hidden sm:inline-flex"
          >
            <Heart size={24} variant="Linear" />
            {favorites?.size > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {favorites.size}
              </span>
            )}
          </Link>

          <Link
            to={isSeller ? "/seller?tab=messages" : "/chat"}
            className="relative hidden md:inline-flex text-ink-500 dark:text-[#CDD1D6] hover:text-ink-900 dark:hover:text-white transition-colors"
          >
            <Messages2 size={24} variant="Linear" />
            {chatUnread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {chatUnread > 9 ? "9+" : chatUnread}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            ref={(el) => { cartIconRefs.desktop = el; }}
            className="relative hidden sm:inline-flex text-ink-500 dark:text-[#CDD1D6] hover:text-ink-900 dark:hover:text-white transition-colors"
          >
            <motion.span animate={cartBumpControls} className="inline-flex">
              <ShoppingCart size={22} variant="Linear" />
            </motion.span>
            <AnimatePresence>
              {items?.length > 0 && (
                <motion.span
                  key={items.length}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center"
                >
                  {items.length}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <div className="relative sm:hidden" ref={cartMenuRef}>
            <button
              ref={(el) => { cartIconRefs.mobile = el; }}
              onClick={() => setCartMenuOpen((v) => !v)}
              className="relative text-ink-500 dark:text-[#CDD1D6] hover:text-ink-900 dark:hover:text-white transition-colors"
              aria-label={t("header.quickActions")}
            >
              <motion.span animate={cartBumpControls} className="inline-flex">
                <ShoppingCart size={22} variant="Linear" />
              </motion.span>
              <AnimatePresence>
                {items?.length > 0 && (
                  <motion.span
                    key={items.length}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center"
                  >
                    {items.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {cartMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 w-60 bg-[#FAFAFA] dark:bg-[#121212] rounded-2xl shadow-popover border border-ink-100 dark:border-[#1C1C1C] p-2 z-50"
                >
                  <DropdownItem
                    icon={Notification}
                    label={t("header.notifications")}
                    badge={notifUnread}
                    onClick={() => { setCartMenuOpen(false); setNotifOpen(true); }}
                  />
                  <DropdownItem
                    icon={Heart}
                    label={t("nav.favorites")}
                    badge={favorites?.size}
                    onClick={() => { setCartMenuOpen(false); navigate("/favorites"); }}
                  />
                  <DropdownItem
                    icon={Messages2}
                    label={t("nav.chat")}
                    badge={chatUnread}
                    onClick={() => { setCartMenuOpen(false); navigate(isSeller ? "/seller?tab=messages" : "/chat"); }}
                  />
                  <DropdownItem
                    icon={ShoppingCart}
                    label={t("nav.cart")}
                    badge={items?.length}
                    onClick={() => { setCartMenuOpen(false); navigate("/cart"); }}
                  />
                  <DropdownItem
                    icon={Messages1}
                    label={t("nav.aiAgent")}
                    onClick={() => { setCartMenuOpen(false); navigate("/ai-agent"); }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {user ? (
            <div className="relative hidden sm:block" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 dark:border-[#1C1C1C]"
              >
                <div className="w-9 h-9 rounded-full border border-ink-100 dark:bg-[#0D0D0D] flex items-center justify-center text-ink-500 dark:text-ink-300 overflow-hidden">
                  {user.photoUrl ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" /> : <Profile size={16} variant="Linear" />}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-[14px] text-nowrap font-semibold text-ink-900 dark:text-white leading-tight">{user.name}</p>
                  <p className="text-[13px] text-nowrap text-ink-400 leading-tight">{user.role}</p>
                </div>
                <ArrowDown2 size={16} className={`text-ink-400 ml-4 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-14 w-72 bg-[#FAFAFA] dark:bg-[#121212] rounded-2xl shadow-popover border border-ink-100 dark:border-[#1C1C1C] p-2 z-50"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#0D0D0D] mb-1">
                      <div className="w-10 h-10 rounded-full border border-ink-200 dark:bg-[#0D0D0D] flex items-center justify-center text-ink-600 dark:text-[#8A8A8A] overflow-hidden">
                        {user.photoUrl ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" /> : <Profile size={18} variant="Linear" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-ink-400">{user.username}</p>
                      </div>
                    </div>
                    <DropdownItem icon={UserSquare} label={t("header.myProfile")} onClick={() => { navigate("/account"); setProfileOpen(false); }} />
                    {isSeller && (
                      <DropdownItem icon={Element3} label={t("nav.seller")} onClick={() => { navigate("/seller"); setProfileOpen(false); }} />
                    )}
                    {isModerator && (
                      <DropdownItem icon={ElementPlus} label={t("nav.moderator")} onClick={() => { navigate("/moderator"); setProfileOpen(false); }} />
                    )}
                    {isSeller && (
                      <DropdownItem icon={Buildings} label={t("header.companyProfile")} onClick={() => { navigate("/profile"); setProfileOpen(false); }} />
                    )}
                    {isSeller && (
                      <DropdownItem icon={Setting} label={t("header.settings")} onClick={() => { navigate("/seller?tab=settings"); setProfileOpen(false); }} />
                    )}
                    <div className="h-px bg-ink-100 dark:bg-[#1C1C1C] my-1" />
                    <DropdownItem
                      icon={Logout}
                      label={t("header.logout")}
                      danger
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
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
              className="hidden sm:inline-block hover:bg-gray-300 dark:text-white dark:hover:bg-gray-800 border border-gray-300 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              {t("header.register")}
            </Link>
          )}
        </div>
      </header>

      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}

function DropdownItem({ icon: Icon, label, onClick, danger, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${danger
        ? "text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10"
        : "text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-[#171717]"
        }`}
    >
      <Icon size={18} variant="Linear" />
      <span className="flex-1 text-left">{label}</span>
      {badge > 0 && (
        <span className="bg-brand-600 text-white text-[10px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}
