import { Link } from "react-router-dom";
import { t } from "../i18n";

const MESSAGE_KEYS = {
  rate_limited: "error.rate_limited",
  budget_exceeded: "error.budget_exceeded",
  provider_error: "error.provider_error",
  timeout: "error.timeout",
  invalid_input: "error.invalid_input",
  unauthenticated: "error.unauthenticated",
  network: "error.network",
  history_unavailable: "error.history_unavailable",
};

export default function ErrorCard({ error, onRetry, onStartFresh }) {
  const key = MESSAGE_KEYS[error?.code] ?? "error.provider_error";
  const historyUnavailable = error?.code === "history_unavailable";

  return (
    <div className="flex items-center justify-between gap-3 bg-danger-50 dark:bg-danger-500/10 border border-danger-100 dark:border-danger-500/30 text-danger-600 rounded-xl px-4 py-3 mt-3 text-sm">
      <span>{t(key)}</span>
      {error?.code === "unauthenticated" ? (
        <Link to="/login" className="font-semibold underline underline-offset-2 shrink-0">
          {t("login.cta")}
        </Link>
      ) : historyUnavailable ? (
        <div className="flex shrink-0 items-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="font-semibold underline underline-offset-2"
            >
              {t("error.retryHistory")}
            </button>
          )}
          {onStartFresh && (
            <button
              type="button"
              onClick={onStartFresh}
              className="font-semibold underline underline-offset-2"
            >
              {t("error.startFresh")}
            </button>
          )}
        </div>
      ) : (
        onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="font-semibold underline underline-offset-2 shrink-0"
          >
            {t("error.retry")}
          </button>
        )
      )}
    </div>
  );
}
