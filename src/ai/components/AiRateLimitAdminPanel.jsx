import { useEffect, useRef, useState } from "react";
import { Setting2 } from "iconsax-reactjs";
import {
  listAiRateLimits,
  listAiRoleQuotas,
  resetAiRateLimit,
  updateAiRateLimit,
  updateAiRoleQuota,
} from "../api/aiClient";
import { t } from "../i18n";

function isAdmin(role) {
  const normalized = String(role ?? "").toUpperCase();
  return normalized.includes("SUPER_ADMIN") || normalized.includes("ADMIN");
}

function withDraft(item) {
  return {
    ...item,
    rpmDraft: String(item.effectiveRequestsPerMinute ?? 0),
    budgetDraft: String(item.effectiveDailyTokenBudget ?? 0),
    pending: false,
  };
}

function userLabel(item) {
  return item.username || item.userSub;
}

function withRoleDraft(item) {
  return {
    ...item,
    hourlyDraft: String(item.hourlyRequestLimit ?? 0),
    dailyDraft: String(item.dailyRequestLimit ?? 0),
    pending: false,
  };
}

function validRoleName(value) {
  return /^[A-Z][A-Z0-9_]{0,63}$/.test(String(value ?? "").trim().toUpperCase());
}

function validRequestLimits(hourly, daily) {
  return Number.isInteger(hourly)
    && Number.isInteger(daily)
    && hourly >= 0
    && daily >= 0
    && hourly <= 1_000_000
    && daily <= 1_000_000
    && daily >= hourly;
}

function RoleQuotaControls() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [newHourly, setNewHourly] = useState("100");
  const [newDaily, setNewDaily] = useState("500");

  useEffect(() => {
    const controller = new AbortController();
    listAiRoleQuotas({ signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        setRows((Array.isArray(items) ? items : []).map(withRoleDraft));
        setStatus("ready");
      })
      .catch((requestError) => {
        if (controller.signal.aborted || requestError?.code === "ERR_CANCELED") return;
        setError(requestError?.message || t("admin.rateLimits.roles.error"));
        setStatus("error");
      });
    return () => controller.abort();
  }, []);

  const updateRow = (roleName, changes) => {
    setRows((current) => current.map((row) => (
      row.roleName === roleName ? { ...row, ...changes } : row
    )));
  };

  const persist = async (roleName, hourlyValue, dailyValue) => {
    const normalizedRole = String(roleName ?? "").trim().toUpperCase();
    const hourlyRequestLimit = Number(hourlyValue);
    const dailyRequestLimit = Number(dailyValue);
    if (!validRoleName(normalizedRole)) {
      setError(t("admin.rateLimits.roles.invalidRole"));
      return false;
    }
    if (!validRequestLimits(hourlyRequestLimit, dailyRequestLimit)) {
      setError(t("admin.rateLimits.roles.invalidLimits"));
      return false;
    }
    setError(null);
    try {
      const saved = await updateAiRoleQuota(normalizedRole, {
        hourlyRequestLimit,
        dailyRequestLimit,
      });
      const savedRow = withRoleDraft(saved);
      setRows((current) => {
        const exists = current.some((row) => row.roleName === normalizedRole);
        const next = exists
          ? current.map((row) => row.roleName === normalizedRole ? savedRow : row)
          : [...current, savedRow];
        return next.sort((left, right) => left.roleName.localeCompare(right.roleName));
      });
      return true;
    } catch (requestError) {
      setError(requestError?.message || t("admin.rateLimits.roles.error"));
      return false;
    }
  };

  const save = async (row) => {
    updateRow(row.roleName, { pending: true });
    const saved = await persist(row.roleName, row.hourlyDraft, row.dailyDraft);
    if (!saved) updateRow(row.roleName, { pending: false });
  };

  const addRole = async () => {
    const saved = await persist(newRole, newHourly, newDaily);
    if (saved) {
      setNewRole("");
      setNewHourly("100");
      setNewDaily("500");
    }
  };

  return (
    <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50/35 p-3 dark:border-brand-500/15 dark:bg-brand-500/5">
      <h3 className="text-sm font-semibold text-ink-800 dark:text-white">
        {t("admin.rateLimits.roles.title")}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
        {t("admin.rateLimits.roles.help")}
      </p>

      {status === "loading" && (
        <p role="status" className="py-3 text-sm text-ink-400">
          {t("admin.rateLimits.roles.loading")}
        </p>
      )}

      {status === "ready" && (
        <div className="mt-3 space-y-2">
          {rows.map((row) => (
            <div
              key={row.roleName}
              className="grid gap-2 rounded-xl border border-ink-100 bg-white p-3 dark:border-[#242424] dark:bg-[#111] sm:grid-cols-[minmax(110px,1fr)_140px_140px_auto] sm:items-end"
            >
              <p className="self-center text-sm font-bold text-ink-800 dark:text-white">
                {row.roleName}
              </p>
              <label className="grid gap-1 text-[10px] font-medium text-ink-500">
                <span>{t("admin.rateLimits.roles.hourly")}</span>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={row.hourlyDraft}
                  disabled={row.pending}
                  aria-label={t("admin.rateLimits.roles.hourlyInput", { role: row.roleName })}
                  onChange={(event) => updateRow(row.roleName, { hourlyDraft: event.target.value })}
                  className="rounded-lg border border-ink-200 bg-transparent px-2 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
                />
              </label>
              <label className="grid gap-1 text-[10px] font-medium text-ink-500">
                <span>{t("admin.rateLimits.roles.daily")}</span>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={row.dailyDraft}
                  disabled={row.pending}
                  aria-label={t("admin.rateLimits.roles.dailyInput", { role: row.roleName })}
                  onChange={(event) => updateRow(row.roleName, { dailyDraft: event.target.value })}
                  className="rounded-lg border border-ink-200 bg-transparent px-2 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
                />
              </label>
              <button
                type="button"
                disabled={row.pending}
                onClick={() => save(row)}
                className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {t("admin.rateLimits.save")}
              </button>
            </div>
          ))}

          <div className="grid gap-2 rounded-xl border border-dashed border-ink-200 p-3 dark:border-[#333] sm:grid-cols-[minmax(110px,1fr)_140px_140px_auto] sm:items-end">
            <label className="grid gap-1 text-[10px] font-medium text-ink-500">
              <span>{t("admin.rateLimits.roles.role")}</span>
              <input
                value={newRole}
                maxLength={64}
                onChange={(event) => setNewRole(event.target.value.toUpperCase())}
                placeholder="PREMIUM"
                aria-label={t("admin.rateLimits.roles.roleInput")}
                className="rounded-lg border border-ink-200 bg-transparent px-2 py-1.5 text-sm uppercase text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
              />
            </label>
            <label className="grid gap-1 text-[10px] font-medium text-ink-500">
              <span>{t("admin.rateLimits.roles.hourly")}</span>
              <input
                type="number"
                min="0"
                max="1000000"
                value={newHourly}
                onChange={(event) => setNewHourly(event.target.value)}
                aria-label={t("admin.rateLimits.roles.newHourlyInput")}
                className="rounded-lg border border-ink-200 bg-transparent px-2 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
              />
            </label>
            <label className="grid gap-1 text-[10px] font-medium text-ink-500">
              <span>{t("admin.rateLimits.roles.daily")}</span>
              <input
                type="number"
                min="0"
                max="1000000"
                value={newDaily}
                onChange={(event) => setNewDaily(event.target.value)}
                aria-label={t("admin.rateLimits.roles.newDailyInput")}
                className="rounded-lg border border-ink-200 bg-transparent px-2 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
              />
            </label>
            <button
              type="button"
              onClick={addRole}
              className="rounded-lg border border-brand-300 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 dark:border-brand-500/40 dark:text-brand-300 dark:hover:bg-brand-500/10"
            >
              {t("admin.rateLimits.roles.add")}
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-3 text-xs text-danger-600">{error}</p>}
    </div>
  );
}

export default function AiRateLimitAdminPanel({ role }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const loadControllerRef = useRef(null);

  useEffect(() => () => loadControllerRef.current?.abort(), []);

  const togglePanel = () => {
    if (open) {
      loadControllerRef.current?.abort();
      loadControllerRef.current = null;
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    loadControllerRef.current = controller;
    setOpen(true);
    setStatus("loading");
    setError(null);
    listAiRateLimits({ signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        setRows((Array.isArray(items) ? items : []).map(withDraft));
        setStatus("ready");
      })
      .catch((requestError) => {
        if (controller.signal.aborted || requestError?.code === "ERR_CANCELED") return;
        setError(requestError?.message || t("admin.rateLimits.error"));
        setStatus("error");
      })
      .finally(() => {
        if (loadControllerRef.current === controller) loadControllerRef.current = null;
      });
  };

  if (!isAdmin(role)) return null;

  const updateRow = (userSub, changes) => {
    setRows((current) => current.map((row) => (
      row.userSub === userSub ? { ...row, ...changes } : row
    )));
  };

  const save = async (row) => {
    const requestsPerMinute = Number(row.rpmDraft);
    const dailyTokenBudget = Number(row.budgetDraft);
    if (!Number.isInteger(requestsPerMinute) || requestsPerMinute < 0 || requestsPerMinute > 10000) {
      setError(t("admin.rateLimits.invalidRpm"));
      return;
    }
    if (!Number.isInteger(dailyTokenBudget) || dailyTokenBudget < 0 || dailyTokenBudget > 100000000) {
      setError(t("admin.rateLimits.invalidBudget"));
      return;
    }
    setError(null);
    updateRow(row.userSub, { pending: true });
    try {
      const saved = await updateAiRateLimit(row.userSub, { requestsPerMinute, dailyTokenBudget });
      updateRow(row.userSub, withDraft(saved));
    } catch (requestError) {
      updateRow(row.userSub, { pending: false });
      setError(requestError?.message || t("admin.rateLimits.error"));
    }
  };

  const reset = async (row) => {
    setError(null);
    updateRow(row.userSub, { pending: true });
    try {
      const saved = await resetAiRateLimit(row.userSub);
      updateRow(row.userSub, withDraft(saved));
    } catch (requestError) {
      updateRow(row.userSub, { pending: false });
      setError(requestError?.message || t("admin.rateLimits.error"));
    }
  };

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-ink-100 bg-white dark:border-[#1C1C1C] dark:bg-[#0D0D0D]">
      <button
        type="button"
        onClick={togglePanel}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-50 dark:text-white dark:hover:bg-[#151515]"
      >
        <span className="flex items-center gap-2">
          <Setting2 size={18} />
          {t("admin.rateLimits.title")}
        </span>
        <span className="text-xs font-normal text-ink-400">
          {open ? t("admin.rateLimits.close") : t("admin.rateLimits.open")}
        </span>
      </button>

      {open && (
        <div className="border-t border-ink-100 px-4 py-4 dark:border-[#1C1C1C]">
          <RoleQuotaControls />
          <p className="mb-3 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
            {t("admin.rateLimits.help")}
          </p>

          {status === "loading" && (
            <p role="status" className="py-3 text-sm text-ink-400">{t("admin.rateLimits.loading")}</p>
          )}

          {status === "ready" && rows.length === 0 && (
            <p className="py-3 text-sm text-ink-400">{t("admin.rateLimits.empty")}</p>
          )}

          {status === "ready" && rows.length > 0 && (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {rows.map((row) => (
                <div
                  key={row.userSub}
                  className="grid gap-3 rounded-xl border border-ink-100 p-3 dark:border-[#242424] lg:grid-cols-[minmax(0,1fr)_120px_170px_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-800 dark:text-white">
                      {userLabel(row)}
                    </p>
                    {row.username && (
                      <p className="truncate text-[10px] text-ink-400" title={row.userSub}>{row.userSub}</p>
                    )}
                  </div>
                  <label className="grid gap-1 text-[10px] font-medium text-ink-500">
                    <span>{t("admin.rateLimits.rpmLabel")}</span>
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      value={row.rpmDraft}
                      disabled={row.pending}
                      aria-label={t("admin.rateLimits.inputLabel", { user: userLabel(row) })}
                      onChange={(event) => updateRow(row.userSub, { rpmDraft: event.target.value })}
                      className="w-full rounded-lg border border-ink-200 bg-transparent px-2 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
                    />
                  </label>
                  <label className="grid gap-1 text-[10px] font-medium text-ink-500">
                    <span>{t("admin.rateLimits.budgetLabel")}</span>
                    <input
                      type="number"
                      min="0"
                      max="100000000"
                      step="10000"
                      value={row.budgetDraft}
                      disabled={row.pending}
                      aria-label={t("admin.rateLimits.budgetInputLabel", { user: userLabel(row) })}
                      onChange={(event) => updateRow(row.userSub, { budgetDraft: event.target.value })}
                      className="w-full rounded-lg border border-ink-200 bg-transparent px-2 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
                    />
                    <span className="font-normal text-ink-400">
                      {t("admin.rateLimits.usage", {
                        used: Number(row.usedTokensToday ?? 0).toLocaleString(),
                        remaining: Number(row.remainingTokensToday ?? 0).toLocaleString(),
                      })}
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={row.pending}
                      onClick={() => save(row)}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {t("admin.rateLimits.save")}
                    </button>
                    {(row.requestsPerMinute !== null && row.requestsPerMinute !== undefined
                      || row.dailyTokenBudget !== null && row.dailyTokenBudget !== undefined) && (
                      <button
                        type="button"
                        disabled={row.pending}
                        onClick={() => reset(row)}
                        className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-50 dark:border-[#333] dark:text-ink-300 dark:hover:bg-[#171717]"
                      >
                        {t("admin.rateLimits.reset")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <p role="alert" className="mt-3 text-xs text-danger-600">{error}</p>}
        </div>
      )}
    </section>
  );
}
