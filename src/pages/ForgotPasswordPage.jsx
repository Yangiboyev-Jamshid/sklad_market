import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock1, Eye, EyeSlash, User, Message, Sun1, Moon } from "iconsax-reactjs";
import { useTheme } from "../context/ThemeContext";
import { resetPassword, confirmResetPassword } from "../api/api";
import logo from "../assets/logo.png";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState("request"); 
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const submittingRef = useRef(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError("");
    submittingRef.current = true;
    setLoading(true);
    try {
      await resetPassword({ username });
      setStep("confirm");
    } catch (err) {
      setError(err.message);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError("");
    submittingRef.current = true;
    setLoading(true);
    try {
      const res = await confirmResetPassword({ username, confirmCode: code, newPassword });
      setSuccessMsg(res?.message || "Пароль успешно изменен!");
      setStep("done");
    } catch (err) {
      setError(err.message);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface dark:bg-[#121212] flex flex-col items-center justify-center px-4 py-8 sm:py-10 transition-colors relative">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#0D0D0D] flex items-center justify-center text-ink-600 dark:text-amber-300 shadow-card hover:scale-105 transition-transform"
        aria-label="Переключить тему"
      >
        {theme === "dark" ? <Sun1 size={18} variant="Bold" /> : <Moon size={18} variant="Bold" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-6 sm:mb-8"
      >
        <img src={logo} alt="" width={117} height={121} className="object-contain" />
        <p className="mt-2 text-[#464646] dark:text-white font-bold text-[24px] sm:text-[32px]">Sklad Market</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md bg-white dark:bg-[#0D0D0D] rounded-3xl shadow-card border border-ink-100 dark:border-[#0D0D0D] p-5 sm:p-7 transition-colors"
      >
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 mb-5 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
          </svg>
          Вернуться на страницу входа
        </button>

        <h2 className="text-lg font-semibold text-ink-900 dark:text-white mb-1">
          Восстановление пароля
        </h2>
        <p className="text-sm text-ink-400 mb-6">
          {step === "request"
            ? "Введите имя пользователя — вам будет отправлен код подтверждения."
            : step === "confirm"
            ? "Введите код и новый пароль."
            : ""}
        </p>

        {step === "done" ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl px-4 py-3">
              {successMsg}
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-brand-600 dark:bg-[#C4C4C4] dark:text-[#0D0D0D] hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              Войти
            </button>
          </motion.div>
        ) : step === "request" ? (
          <form onSubmit={handleRequest} className="flex flex-col gap-4">
            <InputField
              icon={User}
              placeholder="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <SubmitButton loading={loading} label="Отправить код" loadingLabel="Отправка..." />
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="flex flex-col gap-4">
            <InputField
              icon={Message}
              placeholder="Код подтверждения"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <InputField
              icon={Lock1}
              placeholder="Новый пароль"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              trailing={
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-ink-400">
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <SubmitButton loading={loading} label="Сохранить пароль" loadingLabel="Сохранение..." />
            <button
              type="button"
              onClick={() => { setStep("request"); setError(""); }}
              className="text-xs text-center text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition-colors"
            >
              Отправить код повторно
            </button>
          </form>
        )}
      </motion.div>
    </div>
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

function SubmitButton({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-brand-600 dark:bg-[#C4C4C4] dark:text-[#0D0D0D] hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
