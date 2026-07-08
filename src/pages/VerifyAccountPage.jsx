import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TickCircle, CloseCircle } from "iconsax-reactjs";
import { verifyAccount } from "../api/api";

export default function VerifyAccountPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); 
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      Promise.resolve().then(() => {
        setStatus("error");
        setMessage("Токен верификации отсутствует");
      });
      return;
    }
    verifyAccount(token)
      .then((res) => {
        setStatus("success");
        setMessage(res?.message || "Аккаунт успешно подтверждён!");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [token]);

  return (
    <div className="min-h-screen w-full bg-surface dark:bg-[#121212] flex items-center justify-center px-4 py-10 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-[#0D0D0D] rounded-3xl shadow-card border border-ink-100 dark:border-[#1C1C1C] p-8 text-center transition-colors"
      >
        {status === "loading" && (
          <>
            <div className="w-14 h-14 rounded-full border-4 border-ink-100 dark:border-[#1C1C1C] border-t-brand-500 animate-spin mx-auto mb-5" />
            <p className="text-ink-500 dark:text-ink-400">Подтверждаем аккаунт...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-14 h-14 rounded-full bg-success-50 dark:bg-success-500/10 flex items-center justify-center mx-auto mb-4">
              <TickCircle size={30} variant="Bold" className="text-success-600 dark:text-success-400" />
            </div>
            <p className="font-semibold text-lg text-ink-900 dark:text-white mb-1">Готово!</p>
            <p className="text-sm text-ink-400 dark:text-ink-500 mb-6">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              Войти
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-danger-50 dark:bg-danger-500/10 flex items-center justify-center mx-auto mb-4">
              <CloseCircle size={30} variant="Bold" className="text-danger-600 dark:text-danger-400" />
            </div>
            <p className="font-semibold text-lg text-ink-900 dark:text-white mb-1">Не удалось подтвердить</p>
            <p className="text-sm text-ink-400 dark:text-ink-500 mb-6">{message}</p>
            <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              Вернуться на страницу входа
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
