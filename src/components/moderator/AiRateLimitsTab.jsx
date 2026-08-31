import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchNormal1 } from "iconsax-reactjs";
import { getAiRateLimits, getAiRoleQuotas, resetAiRateLimit, updateAiRateLimit, updateAiRoleQuota } from "../../api/api";

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

function RoleQuotaSection() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [newHourly, setNewHourly] = useState("100");
  const [newDaily, setNewDaily] = useState("500");

  useEffect(() => {
    const controller = new AbortController();
    getAiRoleQuotas({ signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        setRows((Array.isArray(items) ? items : []).map(withRoleDraft));
        setStatus("ready");
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        setError(requestError?.message || t("ai.rateLimits.roles.error"));
        setStatus("error");
      });
    return () => controller.abort();
  }, [t]);

  const updateRow = (roleName, changes) => {
    setRows((current) => current.map((row) => (row.roleName === roleName ? { ...row, ...changes } : row)));
  };

  const persist = async (roleName, hourlyValue, dailyValue) => {
    const normalizedRole = String(roleName ?? "").trim().toUpperCase();
    const hourlyRequestLimit = Number(hourlyValue);
    const dailyRequestLimit = Number(dailyValue);
    if (!validRoleName(normalizedRole)) {
      setError(t("ai.rateLimits.roles.invalidRole"));
      return false;
    }
    if (!validRequestLimits(hourlyRequestLimit, dailyRequestLimit)) {
      setError(t("ai.rateLimits.roles.invalidLimits"));
      return false;
    }
    setError(null);
    try {
      const saved = await updateAiRoleQuota(normalizedRole, { hourlyRequestLimit, dailyRequestLimit });
      const savedRow = withRoleDraft(saved);
      setRows((current) => {
        const exists = current.some((row) => row.roleName === normalizedRole);
        const next = exists
          ? current.map((row) => (row.roleName === normalizedRole ? savedRow : row))
          : [...current, savedRow];
        return next.sort((left, right) => left.roleName.localeCompare(right.roleName));
      });
      return true;
    } catch (requestError) {
      setError(requestError?.message || t("ai.rateLimits.roles.error"));
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
    <section>
      <h2 className="text-sm font-bold text-ink-900 dark:text-white">{t("ai.rateLimits.roles.title")}</h2>
      <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{t("ai.rateLimits.roles.help")}</p>

      {status === "loading" && (
        <p role="status" className="py-3 text-sm text-ink-400">{t("ai.rateLimits.roles.loading")}</p>
      )}

      {status === "ready" && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[11px] font-medium uppercase tracking-wide text-ink-400 dark:border-[#1C1C1C]">
                <th className="py-2 pr-3 font-medium">{t("ai.rateLimits.roles.role")}</th>
                <th className="py-2 pr-3 font-medium">{t("ai.rateLimits.roles.hourly")}</th>
                <th className="py-2 pr-3 font-medium">{t("ai.rateLimits.roles.daily")}</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.roleName} className="border-b border-ink-50 dark:border-[#171717]">
                  <td className="py-2.5 pr-3 font-semibold text-ink-800 dark:text-white">{row.roleName}</td>
                  <td className="py-2.5 pr-3">
                    <input
                      type="number"
                      min="0"
                      max="1000000"
                      value={row.hourlyDraft}
                      disabled={row.pending}
                      onChange={(e) => updateRow(row.roleName, { hourlyDraft: e.target.value })}
                      className="w-24 rounded-lg border border-ink-200 bg-transparent px-2 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <input
                      type="number"
                      min="0"
                      max="1000000"
                      value={row.dailyDraft}
                      disabled={row.pending}
                      onChange={(e) => updateRow(row.roleName, { dailyDraft: e.target.value })}
                      className="w-24 rounded-lg border border-ink-200 bg-transparent px-2 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
                    />
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      disabled={row.pending}
                      onClick={() => save(row)}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {t("ai.rateLimits.save")}
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2.5 pr-3">
                  <input
                    value={newRole}
                    maxLength={64}
                    onChange={(e) => setNewRole(e.target.value.toUpperCase())}
                    placeholder="PREMIUM"
                    className="w-full rounded-lg border border-dashed border-ink-200 bg-transparent px-2 py-1.5 text-sm uppercase text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
                  />
                </td>
                <td className="py-2.5 pr-3">
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    value={newHourly}
                    onChange={(e) => setNewHourly(e.target.value)}
                    className="w-24 rounded-lg border border-dashed border-ink-200 bg-transparent px-2 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
                  />
                </td>
                <td className="py-2.5 pr-3">
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    value={newDaily}
                    onChange={(e) => setNewDaily(e.target.value)}
                    className="w-24 rounded-lg border border-dashed border-ink-200 bg-transparent px-2 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
                  />
                </td>
                <td className="py-2.5 text-right">
                  <button
                    type="button"
                    onClick={addRole}
                    className="rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 dark:border-brand-500/40 dark:text-brand-300 dark:hover:bg-brand-500/10"
                  >
                    {t("ai.rateLimits.roles.add")}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {error && <p role="alert" className="mt-3 text-xs text-danger-600">{error}</p>}
    </section>
  );
}

export default function AiRateLimitsTab() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getAiRateLimits({ signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        setRows((Array.isArray(items) ? items : []).map(withDraft));
        setStatus("ready");
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        setError(requestError?.message || t("ai.rateLimits.error"));
        setStatus("error");
      });
    return () => controller.abort();
  }, [t]);

  const updateRow = (userSub, changes) => {
    setRows((current) => current.map((row) => (row.userSub === userSub ? { ...row, ...changes } : row)));
  };

  const save = async (row) => {
    const requestsPerMinute = Number(row.rpmDraft);
    const dailyTokenBudget = Number(row.budgetDraft);
    if (!Number.isInteger(requestsPerMinute) || requestsPerMinute < 0 || requestsPerMinute > 10000) {
      setError(t("ai.rateLimits.invalidRpm"));
      return;
    }
    if (!Number.isInteger(dailyTokenBudget) || dailyTokenBudget < 0 || dailyTokenBudget > 100000000) {
      setError(t("ai.rateLimits.invalidBudget"));
      return;
    }
    setError(null);
    updateRow(row.userSub, { pending: true });
    try {
      const saved = await updateAiRateLimit(row.userSub, { requestsPerMinute, dailyTokenBudget });
      updateRow(row.userSub, withDraft(saved));
    } catch (requestError) {
      updateRow(row.userSub, { pending: false });
      setError(requestError?.message || t("ai.rateLimits.error"));
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
      setError(requestError?.message || t("ai.rateLimits.error"));
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = normalizedSearch
    ? rows.filter((row) => `${row.username ?? ""} ${row.userSub ?? ""}`.toLowerCase().includes(normalizedSearch))
    : rows;

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] px-4 py-6 sm:p-5 transition-colors space-y-6">
      <RoleQuotaSection />

      <div className="border-t border-ink-100 pt-5 dark:border-[#1C1C1C]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink-900 dark:text-white">{t("ai.rateLimits.title")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{t("ai.rateLimits.help")}</p>
          </div>
          {status === "ready" && rows.length > 0 && (
            <div className="relative w-full max-w-xs">
              <SearchNormal1 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("ai.rateLimits.searchPlaceholder")}
                aria-label={t("ai.rateLimits.searchPlaceholder")}
                className="w-full rounded-lg border border-ink-200 bg-transparent py-1.5 pl-9 pr-3 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
              />
            </div>
          )}
        </div>

        {status === "loading" && (
          <p role="status" className="py-3 text-sm text-ink-400">{t("ai.rateLimits.loading")}</p>
        )}

        {status === "ready" && rows.length === 0 && (
          <p className="py-3 text-sm text-ink-400">{t("ai.rateLimits.empty")}</p>
        )}

        {status === "ready" && rows.length > 0 && filteredRows.length === 0 && (
          <p className="py-3 text-sm text-ink-400">{t("ai.rateLimits.searchEmpty")}</p>
        )}

        {status === "ready" && filteredRows.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-[11px] font-medium uppercase tracking-wide text-ink-400 dark:border-[#1C1C1C]">
                  <th className="py-2 pr-3 font-medium">{t("ai.rateLimits.userColumn")}</th>
                  <th className="py-2 pr-3 font-medium">{t("ai.rateLimits.rpmLabel")}</th>
                  <th className="py-2 pr-3 font-medium">{t("ai.rateLimits.budgetLabel")}</th>
                  <th className="py-2 pr-3 font-medium" />
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.userSub} className="border-b border-ink-50 align-top dark:border-[#171717]">
                    <td className="py-2.5 pr-3">
                      <p className="truncate font-semibold text-ink-800 dark:text-white">{userLabel(row)}</p>
                      {row.username && (
                        <p className="truncate text-[10px] text-ink-400" title={row.userSub}>{row.userSub}</p>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        value={row.rpmDraft}
                        disabled={row.pending}
                        onChange={(e) => updateRow(row.userSub, { rpmDraft: e.target.value })}
                        className="w-24 rounded-lg border border-ink-200 bg-transparent px-2 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
                      />
                    </td>
                    <td className="py-2.5 pr-3">
                      <input
                        type="number"
                        min="0"
                        max="100000000"
                        step="10000"
                        value={row.budgetDraft}
                        disabled={row.pending}
                        onChange={(e) => updateRow(row.userSub, { budgetDraft: e.target.value })}
                        className="w-32 rounded-lg border border-ink-200 bg-transparent px-2 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-[#333] dark:text-white"
                      />
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-ink-400">
                      {t("ai.rateLimits.usage", {
                        used: Number(row.usedTokensToday ?? 0).toLocaleString(),
                        remaining: Number(row.remainingTokensToday ?? 0).toLocaleString(),
                      })}
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        disabled={row.pending}
                        onClick={() => save(row)}
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                      >
                        {t("ai.rateLimits.save")}
                      </button>
                      {(row.requestsPerMinute != null || row.dailyTokenBudget != null) && (
                        <button
                          type="button"
                          disabled={row.pending}
                          onClick={() => reset(row)}
                          className="ml-2 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-50 dark:border-[#333] dark:text-ink-300 dark:hover:bg-[#171717]"
                        >
                          {t("ai.rateLimits.reset")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && <p role="alert" className="mt-3 text-xs text-danger-600">{error}</p>}
      </div>
    </div>
  );
}
