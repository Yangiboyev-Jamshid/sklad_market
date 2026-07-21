import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Call,
  Sms,
  Lock1,
  Eye,
  EyeSlash,
  User,
  Sun1,
  Moon,
  Message,
  Profile,
  Warning2,
} from "iconsax-reactjs";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { login as apiLogin, registerUser } from "../api/api";
import logo from "../assets/logo.png";
import LanguageSwitcher from "../components/layout/LanguageSwitcher";

export default function LoginPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [mode, setMode] = useState(location.state?.mode === "register" ? "register" : "login");
  const [method, setMethod] = useState("phone");
  const [role, setRole] = useState("buyer");
  const [showPassword, setShowPassword] = useState(false);

  const [loginPhone, setLoginPhone] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [regName, setRegName] = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");


  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const loginSubmittingRef = useRef(false);
  const regSubmittingRef = useRef(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (loginSubmittingRef.current) return;
    setLoginError("");
    loginSubmittingRef.current = true;
    setLoginLoading(true);

    try {
      const username = method === "phone" ? loginPhone : loginEmail;
      const data = await apiLogin({ username, password: loginPassword });

      login(data);
      navigate("/");
    } catch (err) {
      setLoginError(err.message || t("auth.defaultLoginError"));
    } finally {
      loginSubmittingRef.current = false;
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (regSubmittingRef.current) return;
    setRegError("");
    regSubmittingRef.current = true;
    setRegLoading(true);
    try {
      const data = await registerUser({
        firstName: regName,
        lastName: regCompany,
        username: regEmail,
        password: regPassword,
        roles: role.toUpperCase(),
      });
      if (data?.success) {
        navigate("/confirm-email", {
          state: {
            username: regEmail,
            password: regPassword,
            firstName: regName,
            lastName: regCompany,
            roles: role.toUpperCase(),
          },
        });
      }
    } catch (err) {
      setRegError(err.message);
    } finally {
      regSubmittingRef.current = false;
      setRegLoading(false);
    }
  };

  return (
    <div className="w-full sm:h-auto h-auto bg-white dark:bg-[#0D0D0D] sm:bg-[#F4F6F8] sm:dark:bg-[#121212] flex flex-col items-center justify-center px-0 py-6 sm:px-4 sm:py-10 transition-colors relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <LanguageSwitcher alwaysVisible />
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] flex items-center justify-center text-ink-600 dark:text-amber-300 shadow-card hover:scale-105 transition-transform"
          aria-label={t("auth.toggleTheme")}
        >
          {theme === "dark" ? <Sun1 size={18} variant="Bold" /> : <Moon size={18} variant="Bold" />}
        </button>
      </div>


      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-6 sm:mb-8"
      >
        <div className="hidden sm:flex flex-col items-center justify-center">
          <img src={logo} alt="" width={117} height={121} className="object-contain" />
          <p className="mt-1 font-display font-extrabold text-[32px] leading-none">
            <span className="text-[#0B1F33] dark:text-white">Sklad</span> <span className="text-[#039484]">Market</span>
          </p>
        </div>
        <div className="sm:hidden flex flex-col items-center justify-center">
          <img src={logo} alt="" width={68} height={70} className="object-contain" />
          <p className="mt-1 font-display font-extrabold text-[18px] leading-none">
            <span className="text-[#0B1F33] dark:text-white">Sklad</span> <span className="text-[#039484]">Market</span>
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-none sm:max-w-[520px] bg-white dark:bg-[#0D0D0D] rounded-none sm:rounded-[30px] shadow-none sm:shadow-card border-0 sm:border sm:border-white/80 dark:sm:border-[#1C1C1C] px-5 pb-5 transition-colors sm:p-12"
      >
        <div className="flex flex-col items-center text-center mb-4 sm:hidden">
          <h1 className={`text-[24px] leading-tight font-extrabold text-black dark:text-white ${mode === "login" ? "mb-6" : ""}`}>
            {mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
          </h1>
          {mode === "register" && (
            <p className="mt-2 mb-6 text-[14px] leading-tight text-ink-400">{t("auth.registerSubtitle")}</p>
          )}
        </div>

        <div className="hidden sm:flex items-center bg-ink-100 dark:bg-[#171717] rounded-full p-1 mb-10">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 text-sm font-semibold py-2.5 rounded-full transition-colors ${mode === "login"
              ? "bg-white dark:bg-[#0D0D0D] text-black dark:text-white shadow-card"
              : "text-ink-400 hover:text-ink-600"
              }`}
          >
            {t("auth.tabLogin")}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 text-sm font-semibold py-2.5 rounded-full transition-colors ${mode === "register"
              ? "bg-white dark:bg-[#0D0D0D] text-black dark:text-white shadow-card"
              : "text-ink-400 hover:text-ink-600"
              }`}
          >
            {t("auth.tabRegister")}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLoginSubmit}
              className="flex flex-col gap-4 sm:h-auto h-screen"
            >
              <div className="grid grid-cols-2 gap-2.5 mb-6 sm:mb-10">
                <MethodButton
                  icon={Call}
                  label={t("auth.methodPhone")}
                  active={method === "phone"}
                  onClick={() => { setMethod("phone"); setLoginEmail(""); setLoginError(""); }}
                />
                <MethodButton
                  icon={Message}
                  label={t("auth.methodEmail")}
                  active={method === "email"}
                  onClick={() => { setMethod("email"); setLoginPhone(""); setLoginError(""); }}
                />
              </div>

              <InputField
                icon={method === "phone" ? Call : Sms}
                placeholder={method === "phone" ? t("auth.phonePlaceholder") : t("auth.emailPlaceholder")}
                type={method === "phone" ? "tel" : "email"}
                inputMode={method === "phone" ? "numeric" : undefined}
                value={method === "phone" ? loginPhone : loginEmail}
                onChange={(e) => {
                  if (method === "phone") {
                    setLoginPhone(e.target.value.replace(/\D/g, ""));
                  } else {
                    setLoginEmail(e.target.value);
                  }
                }}
                required
              />
              <InputField
                icon={Lock1}
                placeholder={t("auth.passwordPlaceholder")}
                type={showPassword ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                trailing={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-ink-400">
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {loginError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5"
                >
                  <Warning2 size={18} variant="Bold" className="shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </motion.p>
              )}

              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>

              <button
                type="submit"
                disabled={loginLoading || !(method === "phone" ? loginPhone : loginEmail) || !loginPassword}
                className="w-full bg-brand-600 dark:bg-[#C4C4C4] dark:text-[#0D0D0D] hover:bg-brand-700 disabled:bg-[#C4C4C4] disabled:text-white disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors mt-3 flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    {t("auth.loggingIn")}
                  </>
                ) : (
                  t("auth.loginButton")
                )}
              </button>

              <div className="relative flex items-center justify-center my-1">
                <div className="absolute inset-x-0 h-px bg-ink-200 dark:bg-ink-700" />
                <span className="relative bg-white dark:bg-[#0D0D0D] px-3 text-xs text-ink-400">{t("auth.or")}</span>
              </div>

              <button
                type="button"
                className="w-full border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 font-semibold py-3.5 rounded-xl text-ink-700 dark:text-ink-200 transition-colors"
              >
                {t("auth.loginViaErp")}
              </button>
              <p className="text-center text-[11px] text-ink-400 mt-1 sm:hidden">
                {t("auth.noAccount")}{" "}
                <button type="button" onClick={() => setMode("register")} className="font-medium text-black dark:text-white">
                  {t("auth.goToRegister")}
                </button>
              </p>
            </motion.form>
          ) : mode === "register" ? (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleRegisterSubmit}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-3 sm:gap-2.5 mb-6 sm:mb-10">
                <RoleButton label={t("auth.roleBuyer")} sub={t("auth.roleBuyerSub")} active={role === "buyer"} onClick={() => setRole("buyer")} />
                <RoleButton label={t("auth.roleSeller")} sub={t("auth.roleSellerSub")} active={role === "seller"} onClick={() => setRole("seller")} />
              </div>
              <InputField
                icon={Profile}
                placeholder={t("auth.firstNamePlaceholder")}
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
              <InputField
                icon={User}
                placeholder={t("auth.lastNamePlaceholder")}
                value={regCompany}
                onChange={(e) => setRegCompany(e.target.value)}
                required
              />
              <InputField
                icon={Sms}
                placeholder={t("auth.phoneOrEmailPlaceholder")}
                type="text"
                inputMode="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
              <InputField
                icon={Lock1}
                placeholder={t("auth.passwordPlaceholder")}
                type={showPassword ? "text" : "password"}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                trailing={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-ink-400">
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {regError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5"
                >
                  <Warning2 size={18} variant="Bold" className="shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </motion.p>
              )}

              <p className="text-[12px] text-center sm:text-start sm:text-[16px] my-6 text-ink-400 leading-snug">
                {t("auth.agreementText")}{" "}
                <span className="text-brand-600 dark:text-brand-400 font-medium">{t("auth.termsOfUse")}</span> {t("auth.and")}{" "}
                <span className="text-brand-600 dark:text-brand-400 font-medium">{t("auth.privacyPolicy")}</span>
              </p>

              <button
                type="submit"
                disabled={regLoading || !regName || !regCompany || !regEmail || !regPassword}
                className="w-full bg-brand-600 dark:bg-[#C4C4C4] dark:text-[#0D0D0D] hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors mt-6 sm:mt-3 flex items-center justify-center gap-2"
              >
                {regLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    {t("auth.registering")}
                  </>
                ) : (
                  t("auth.registerButton")
                )}
              </button>
              <p className="text-center text-[11px] text-ink-400 mt-1 sm:hidden">
                {t("auth.haveAccount")}{" "}
                <button type="button" onClick={() => setMode("login")} className="font-medium text-black dark:text-white">
                  {t("auth.goToLogin")}
                </button>
              </p>
            </motion.form>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function MethodButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border transition-colors ${active
        ? "bg-brand-50 dark:bg-brand-500/15 border-brand-200 dark:border-brand-500/40 text-brand-600 dark:text-brand-400"
        : "border-ink-200 dark:border-[#1C1C1C] text-ink-500 dark:text-ink-400 hover:border-ink-300 dark:hover:border-ink-600"
        }`}
    >
      <Icon size={16} variant="Linear" />
      {label}
    </button>
  );
}

function RoleButton({ label, sub, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 py-3 rounded-xl border transition-colors ${active
        ? "bg-brand-50 dark:bg-brand-500/15 border-brand-200 dark:border-brand-500/40"
        : "border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600"
        }`}
    >
      <span className={`text-sm font-semibold ${active ? "text-brand-600 dark:text-brand-400" : "text-ink-700 dark:text-ink-200"}`}>{label}</span>
      <span className="text-[11px] text-ink-400">{sub}</span>
    </button>
  );
}

function InputField({ icon: Icon, trailing, ...props }) {
  return (
    <div className="flex items-center gap-3 bg-ink-50 dark:bg-[#171717] border border-transparent focus-within:border-brand-300 dark:focus-within:border-brand-500 focus-within:bg-white rounded-xl px-4 py-3.5 transition-colors">
      <Icon size={18} variant="Linear" className="text-ink-400 shrink-0" />
      <input
        {...props}
        className="flex-1 bg-transparent outline-none text-sm text-ink-900 dark:text-white placeholder:text-ink-400 min-w-0"
      />
      {trailing}
    </div>
  );
}
