import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sun1, Moon, TickCircle } from "iconsax-reactjs";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { verifyAccount, registerUser, login as apiLogin } from "../api/api";
import logo from "../assets/logo.png";
import LanguageSwitcher from "../components/layout/LanguageSwitcher";

const CODE_LENGTH = 4;
const RESEND_SECONDS = 60;

export default function EmailVerificationPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const email = location.state?.username || "";
  const password = location.state?.password || "";
  const firstName = location.state?.firstName || "";
  const lastName = location.state?.lastName || "";
  const roles = location.state?.roles || "";

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();
  const submittingRef = useRef(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [done, timerKey]);

  const handleResend = async () => {
    if (resending || secondsLeft > 0) return;
    if (!email || !password || !firstName || !lastName) {
      setError(t("auth.missingRegistrationData"));
      return;
    }
    setError("");
    setResending(true);
    try {
      await registerUser({ firstName, lastName, username: email, password, roles });
      setDigits(Array(CODE_LENGTH).fill(""));
      setSecondsLeft(RESEND_SECONDS);
      setTimerKey((k) => k + 1);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleVerify = async (fullCode) => {
    if (submittingRef.current || fullCode.length !== CODE_LENGTH) return;
    if (!email) {
      setError(t("auth.missingEmail"));
      return;
    }
    setError("");
    submittingRef.current = true;
    setLoading(true);
    try {
      const res = await verifyAccount({ username: email, code: fullCode });

      if (password) {
        try {
          const loginData = await apiLogin({ username: email, password });
          login(loginData);
          navigate("/");
          return;
        } catch {
          // Account is verified, but auto-login failed — fall back to manual login.
        }
      }

      setMessage(res?.message || t("auth.defaultVerifySuccess"));
      setDone(true);
    } catch (err) {
      setError(err.message);
      triggerShake();
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify(digits.join(""));
  };

  const handleDigitChange = (index, rawValue) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d)) {
      handleVerify(next.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setDigits((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
    if (!pasted.length) return;
    const next = Array(CODE_LENGTH).fill("");
    pasted.forEach((d, i) => { next[i] = d; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH) - 1]?.focus();
    if (next.every((d) => d)) {
      handleVerify(next.join(""));
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface dark:bg-[#121212] flex flex-col items-center justify-center px-4 py-8 sm:py-10 transition-colors relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <LanguageSwitcher alwaysVisible />
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#0D0D0D] flex items-center justify-center text-ink-600 dark:text-amber-300 shadow-card hover:scale-105 transition-transform"
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
        className="w-full max-w-md bg-white dark:bg-[#0D0D0D] rounded-3xl shadow-card border border-ink-100 dark:border-[#0D0D0D] p-5 sm:p-7 transition-colors"
      >
        {!done ? (
          <>
            <h2 className="text-lg text-center font-semibold text-ink-900 dark:text-white mb-1 text-center">
              {t("auth.emailVerificationTitle")}
            </h2>
            <p className="text-sm text-center text-ink-400 mb-8 text-center leading-relaxed">
              {email
                ? <>{t("auth.emailVerificationSentTo")} <span className="font-medium text-ink-600 dark:text-ink-300">{email}</span></>
                : t("auth.emailVerificationSentGeneric")}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <motion.div
                animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.45 }}
                className="flex justify-center gap-3 sm:gap-4"
                onPaste={handlePaste}
              >
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    disabled={loading}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-14 h-16 sm:w-16 sm:h-[4.5rem] text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all bg-ink-50 dark:bg-[#171717] text-ink-900 dark:text-white disabled:opacity-50 ${error
                        ? "border-red-400 dark:border-red-500/60"
                        : digit
                          ? "border-brand-400 dark:border-brand-500/60 bg-white dark:bg-[#0D0D0D]"
                          : "border-ink-200 dark:border-[#232323] focus:border-brand-400 dark:focus:border-brand-500 focus:bg-white dark:focus:bg-[#0D0D0D]"
                      }`}
                  />
                ))}
              </motion.div>

              {error && <ErrorMsg>{error}</ErrorMsg>}

              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-ink-400">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  {t("auth.checkingCode")}
                </div>
              )}
            </form>

            <div className="mt-6 flex flex-col items-center gap-3">
              {secondsLeft > 0 ? (
                <p className="text-xs text-ink-400">
                  {t("auth.resendCodeIn")}{" "}
                  <span className="font-semibold text-ink-600 dark:text-ink-300">
                    {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors disabled:opacity-50"
                >
                  {resending ? t("auth.resending") : t("auth.resendCode")}
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full text-center text-xs text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition-colors"
              >
                {t("auth.backToLogin")}
              </button>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-success-50 dark:bg-success-500/10 flex items-center justify-center">
              <TickCircle size={30} variant="Bold" className="text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="font-semibold text-lg text-ink-900 dark:text-white mb-1">{t("auth.done")}</p>
              <p className="text-sm text-ink-400 dark:text-ink-500">{message}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-brand-600 dark:bg-[#C4C4C4] dark:text-[#0D0D0D] hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {t("auth.loginButton")}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function ErrorMsg({ children }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5"
    >
      {children}
    </motion.p>
  );
}
