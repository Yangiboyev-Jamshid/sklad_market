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

const navItems = [
  { to: "/", labelKey: "nav.home", icon: Home2 },
  { to: "/catalog", labelKey: "nav.catalog", icon: BoxAdd },
  { to: "/requests", labelKey: "nav.requests", icon: ClipboardText },
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
    (item) => (!item.sellerOnly || isSeller) && (!item.moderatorOnly || isModerator)
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
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="26" viewBox="0 0 25 26" fill="none" className="text-[#464646] dark:text-white shrink-0">
                <path d="M3.35332 6.77102L3.47356 6.79253C3.73702 6.46058 4.08149 5.99575 4.38529 5.71875C4.74584 5.98115 5.68478 6.564 5.64608 7.02236L5.70335 7.10789C3.6648 9.54679 3.1448 12.9146 4.35281 15.855C6.15218 20.2346 11.1635 22.3222 15.5389 20.5149L15.3427 20.8237C16.2949 20.6026 17.078 19.8489 17.8674 19.4862C18.4066 19.2385 19.1484 20.6274 19.962 20.6501C20.0436 20.3877 19.7886 20.142 19.8407 19.6394L19.9578 19.611L20.1882 19.5491C20.493 20.1334 20.9644 21.1572 21.2175 21.79C20.5247 22.2685 19.2411 23.1088 18.6393 23.6327L18.3883 23.614C17.9193 23.2755 16.9481 22.5294 16.6103 22.091C16.2247 22.3366 14.8567 22.8457 14.452 22.7731C14.2602 23.5204 13.9652 24.5397 13.8208 25.2748C13.2526 25.2822 12.5976 25.3066 12.0365 25.2812L10.8085 25.2194C10.5766 24.6173 10.2939 23.4672 10.1756 22.8327C9.39908 22.6716 8.65674 22.3762 7.90964 22.1058C7.30603 22.595 6.72029 23.1257 6.1374 23.6408C5.29823 23.0628 4.2001 22.3481 3.4429 21.7019C3.69737 21.0019 4.05187 20.1981 4.34029 19.5004C3.81493 18.7405 3.30192 17.9718 2.80162 17.1951C2.29855 17.2193 1.70849 17.2578 1.20628 17.2382C0.886681 17.2258 0.863789 17.1331 0.703815 16.9267L0.781039 16.8404C0.421875 16.1267 0.318825 14.8356 0 13.9505C0.256719 13.8144 1.24458 13.2767 1.49724 13.1332C1.55482 12.6725 1.82306 10.9967 1.84275 10.3115C1.53162 10.0875 0.234778 9.25338 0.240479 8.88601L0.484672 8.95772C0.850574 8.73541 1.13122 7.6059 1.30406 7.11256C1.76921 7.13908 2.88722 7.34567 3.20708 7.09718L3.22859 6.80221L3.35332 6.77102Z" fill="currentColor" />
                <path d="M4.35368 15.8516C6.15304 20.2312 11.1643 22.3188 15.5398 20.5115L15.3436 20.8204C11.5963 21.9248 8.1668 21.2775 5.56653 18.1695C5.1241 17.6407 4.28406 16.546 4.35368 15.8516Z" fill="currentColor" />
                <path d="M1.83322 10.3438L1.9843 10.3837C2.0718 10.7666 1.84134 12.7948 1.86648 13.5166L0.491755 14.2452C0.630135 14.8132 1.10271 16.3736 0.931079 16.7851L0.781039 16.8399C0.421875 16.1262 0.318825 14.8351 0 13.95C0.256719 13.8139 0.511448 13.6742 0.764107 13.5307L1.51578 13.1435C1.49254 12.0243 1.61624 11.4194 1.83322 10.3438Z" fill="currentColor" />
                <path d="M19.957 19.6088L20.1874 19.5469C20.4922 20.1312 20.9636 21.155 21.2168 21.7878C20.5239 22.2663 19.2403 23.1066 18.6385 23.6305L18.4453 23.167C18.717 22.891 19.9404 22.0549 20.3058 21.7983C20.2653 21.1296 19.8675 19.9484 19.957 19.6088Z" fill="currentColor" />
                <path d="M13.2666 24.8949C13.5341 24.2651 13.5914 23.4356 13.9669 22.8771C14.0683 22.7263 14.2449 22.7731 14.4526 22.7706C14.2609 23.5179 13.9658 24.5372 13.8214 25.2723C13.2532 25.2797 12.5982 25.3041 12.0371 25.2787C12.3529 24.9544 12.8091 24.9579 13.2666 24.8949Z" fill="currentColor" />
                <path d="M4.34075 19.5L4.54573 19.5779C4.69292 20.0222 4.25748 20.9547 4.05078 21.3779C3.8826 21.7222 3.82559 21.7062 3.44336 21.7015C3.69783 21.0015 4.05233 20.1977 4.34075 19.5Z" fill="currentColor" />
                <path d="M16.6094 22.0842C17.0338 21.9467 18.0513 22.8673 18.4452 23.1625L18.6384 23.6259L18.3874 23.6073C17.9184 23.2688 16.9472 22.5226 16.6094 22.0842Z" fill="currentColor" />
                <path d="M19.9757 13.6328C20.0018 13.9477 20.0367 14.1355 19.9485 14.4448C19.8062 14.5777 19.7687 14.5987 19.587 14.685C17.3858 15.731 15.1885 16.7659 12.9677 17.7723C12.0984 18.1663 11.099 18.6473 10.1886 18.9599C9.97219 19.0341 9.82803 18.9387 9.59515 18.8601L9.51758 18.7703C9.92097 18.2328 18.7141 14.223 19.9757 13.6328Z" fill="currentColor" />
                <path d="M9.73413 16.6406C10.1556 16.6743 10.3262 16.8011 10.6841 17.0093C9.92866 17.3803 9.29463 17.6538 8.68013 18.2445L7.51367 17.683C8.27925 17.3545 8.986 17.0079 9.73413 16.6406Z" fill="currentColor" />
                <path d="M8.23975 15.7969C8.50372 15.9019 8.58604 15.8822 8.72554 16.0879C8.52074 16.4701 7.17348 16.977 6.61142 17.2686C6.36636 17.2769 6.15015 17.2462 6.08398 16.9967C6.33898 16.5871 7.75231 16.0195 8.23975 15.7969Z" fill="currentColor" />
                <path d="M15.7557 17.1136C16.0653 17.0767 16.3513 17.2843 16.4122 17.5902C16.4733 17.8961 16.2889 18.1975 15.9888 18.2824C15.7725 18.3436 15.5402 18.2782 15.3876 18.1133C15.2349 17.9482 15.1876 17.7116 15.2654 17.5006C15.343 17.2896 15.5325 17.1401 15.7557 17.1136Z" fill="currentColor" />
                <path d="M13.4467 18.1449C13.6397 18.0655 13.8605 18.0967 14.0238 18.2265C14.1872 18.3561 14.2677 18.5642 14.2341 18.7701C14.2005 18.9761 14.0583 19.1477 13.8621 19.2189C13.5677 19.3258 13.2418 19.1775 13.1288 18.8853C13.0158 18.593 13.157 18.264 13.4467 18.1449Z" fill="currentColor" />
                <path d="M6.96239 14.9297C7.13506 15.0324 7.19242 15.0494 7.29935 15.2235C7.10526 15.6306 5.87202 15.9323 5.42631 16.0771L5.19542 16.1245L5.12891 16.0443C5.34278 15.6396 6.52859 15.1334 6.96239 14.9297Z" fill="currentColor" />
                <path d="M11.2149 19.0949C11.5057 19.0427 11.7878 19.2227 11.8632 19.5085C11.9385 19.7942 11.7818 20.09 11.5031 20.1881C11.3018 20.2589 11.0777 20.2106 10.9233 20.0631C10.7691 19.9156 10.7106 19.694 10.7722 19.4896C10.8337 19.2852 11.0048 19.1326 11.2149 19.0949Z" fill="currentColor" />
                <path d="M17.8224 16.0775C18.0152 16.0019 18.234 16.0395 18.3905 16.1752C18.547 16.3109 18.6153 16.5221 18.5679 16.7237C18.5204 16.9254 18.365 17.084 18.1645 17.1356C17.8793 17.2089 17.5864 17.0476 17.4959 16.7675C17.4053 16.4873 17.5484 16.185 17.8224 16.0775Z" fill="currentColor" />
                <path d="M5.68831 13.7045C5.92387 13.7025 5.83662 13.6589 5.98062 13.7811C5.77149 13.9824 5.28648 14.1545 4.99952 14.2753C4.96204 14.2842 4.78729 14.2891 4.7371 14.2916L4.73633 14.1884C5.04591 13.9316 5.31498 13.8508 5.68831 13.7045Z" fill="currentColor" />
                <path d="M13.7041 0.25C13.9024 0.886337 14.0871 1.52673 14.258 2.17093L16.5051 2.90983C17.0026 2.40931 17.5972 1.78334 18.1154 1.323C18.8184 1.72485 19.9204 2.31583 20.5186 2.80131C20.2913 3.42348 19.9481 4.28972 19.7623 4.91077C20.2502 5.45811 20.8274 6.07432 21.2575 6.65337L23.3857 6.30587C23.8319 7.15466 24.1554 8.11906 24.4559 9.03136L22.798 10.2223C22.9953 11.277 23.1032 12.0307 23.1081 13.1141L24.0026 13.6063L24.6164 13.9926C24.4144 14.9678 23.9585 16.3953 23.8172 17.2239C23.1117 17.2555 22.4055 17.2695 21.6993 17.266C21.2027 18.1628 20.7632 18.7123 20.1884 19.546L19.958 19.608L19.8409 19.6363C19.7888 20.1389 20.0438 20.3846 19.9622 20.647C19.1486 20.6244 18.4068 19.2354 17.8676 19.4831C17.0782 19.8458 16.2951 20.5996 15.3429 20.8207L15.5391 20.5118C18.8262 19.154 20.9317 15.9048 20.8287 12.349C20.7256 8.79333 18.4355 5.6716 15.0752 4.5065C11.715 3.34148 7.98464 4.37569 5.70355 7.10481L5.64627 7.01927C5.68497 6.56092 4.74603 5.97807 4.38549 5.71567C4.08169 5.99267 3.73721 6.4575 3.47376 6.78945L3.35352 6.76794C3.51073 6.35961 4.32191 5.52499 4.65413 5.0592L4.72694 5.02732C4.86679 4.62815 4.46634 3.61658 4.32295 3.17611C4.92725 2.76346 5.59782 2.37786 6.22735 1.99986C6.72394 2.40853 7.35787 3.03519 7.99812 2.97765C8.25561 2.94119 9.88628 2.3763 10.2363 2.26027C10.4128 1.63793 10.5969 0.912685 10.8383 0.321276C11.0737 0.578057 13.2452 0.51179 13.6329 0.433252L13.7041 0.25Z" fill="currentColor" />
                <path d="M3.7832 2.98078C4.62764 2.4597 5.39279 1.93067 6.26781 1.4375C6.96411 1.91668 7.43375 2.34548 7.99815 2.97395C7.35791 3.03149 6.72398 2.40484 6.22738 1.99616C5.59785 2.37416 4.92729 2.75976 4.32299 3.17241C4.46637 3.61288 4.86683 4.62445 4.72698 5.02362L4.65416 5.05551L3.7832 2.98078Z" fill="currentColor" />
                <path d="M1.08295 6.61719C1.78123 6.6597 2.52746 6.73729 3.22834 6.79794L3.20684 7.09291C2.88697 7.3414 1.76897 7.13481 1.30382 7.10829C1.13097 7.60163 0.850329 8.73114 0.484428 8.95345L0.240234 8.88174L1.08295 6.61719Z" fill="currentColor" />
                <path d="M10.8379 0.320754L10.8933 0.146055C11.1906 -0.0676987 12.7224 0.0110135 13.1484 0.0289847C13.5276 0.0449687 13.509 0.0229369 13.7036 0.249478L13.6324 0.43273C13.2448 0.511268 11.0733 0.577535 10.8379 0.320754Z" fill="currentColor" />
                <path d="M6.69644 10.4746L7.71733 9L12.3375 11.3761L11.0245 12.9278C10.9435 13.0235 10.8065 13.0491 10.6965 12.9891L6.78709 10.8567C6.64936 10.7815 6.60715 10.6036 6.69644 10.4746Z" fill="#DCDBDC" stroke="#464646" strokeWidth="0.363972" strokeLinecap="round" />
                <path d="M13.5221 12.9015L12.3379 11.3621L17.09 9.25L17.967 10.4559C18.0615 10.5858 18.019 10.7693 17.877 10.8445L13.8549 12.9739C13.7411 13.0341 13.6005 13.0035 13.5221 12.9015Z" fill="#DCDBDC" stroke="#464646" strokeWidth="0.363972" strokeLinecap="round" />
                <path d="M7.58525 14.1034L7.57617 11.2734L10.7904 12.9698C10.8267 12.989 10.8714 12.9815 10.8994 12.9514L12.1906 11.5678C12.2433 11.5113 12.3379 11.5486 12.3379 11.6259V16.4284C12.3379 16.5266 12.2346 16.5904 12.1469 16.5465L7.73119 14.3387C7.64202 14.2941 7.58557 14.2031 7.58525 14.1034Z" fill="#0088FF" stroke="#464646" strokeWidth="0.363972" strokeLinecap="round" />
                <path d="M16.9441 14.3389L12.4696 16.5762C12.4091 16.6064 12.3379 16.5624 12.3379 16.4948V11.7002C12.3379 11.6158 12.4427 11.5769 12.4978 11.6407L13.6262 12.9484C13.6535 12.9801 13.6989 12.9891 13.7362 12.9702L17.09 11.2734V14.1028C17.09 14.2028 17.0335 14.2942 16.9441 14.3389Z" fill="#0088FF" stroke="#464646" strokeWidth="0.363972" strokeLinecap="round" />
                <path d="M17.0383 9.18291L12.3066 7.22656" stroke="#464646" strokeWidth="0.363972" strokeLinecap="round" />
                <path d="M7.75698 8.90994L12.3066 7.22656" stroke="#464646" strokeWidth="0.363972" strokeLinecap="round" />
                <path d="M16.4478 13.771V13.4285C16.4478 13.3608 16.3767 13.3168 16.3162 13.3471L15.6792 13.6656C15.6484 13.681 15.6289 13.7125 15.6289 13.747V14.0894C15.6289 14.1571 15.7001 14.2011 15.7606 14.1708L16.3975 13.8524C16.4284 13.8369 16.4478 13.8054 16.4478 13.771Z" stroke="#464646" strokeWidth="0.181986" strokeLinecap="round" />
                <path d="M12.3535 11.1838V7.45312L16.6302 9.22749L12.3535 11.1838Z" fill="#898989" stroke="#464646" strokeWidth="0.0909931" strokeLinecap="round" />
                <path d="M12.2617 11.1838V7.45312L8.07604 9.00001L12.2617 11.1838Z" fill="#D9D9D9" stroke="#464646" strokeWidth="0.0909931" strokeLinecap="round" />
              </svg>
              <span className="text-base font-extrabold tracking-tight text-ink-900 dark:text-white truncate">
                SKLAD-MARKET
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
              <div className="flex items-center gap-3 mx-4 mt-4 p-3 rounded-2xl bg-ink-50 dark:bg-[#171717] shrink-0">
                <div className="w-10 h-10 rounded-full border border-ink-200 dark:border-[#2A2A2A] bg-white dark:bg-[#0D0D0D] flex items-center justify-center text-ink-500 dark:text-ink-300 shrink-0">
                  <Profile size={18} variant="Linear" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-ink-400 truncate">{user.role}</p>
                </div>
              </div>
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
