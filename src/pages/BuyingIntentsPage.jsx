import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Add, CloseCircle, Building, Call } from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import PillToggle from "../components/ui/PillToggle";
import {
  searchBuyingIntents,
  getMyBuyingIntents,
  createBuyingIntent,
  closeBuyingIntent,
  publishBuyingIntent,
  recommendSuppliers,
  getCategoryTree,
} from "../api/api";
import { flattenCategoryTree } from "../utils/categories";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function StatusBadge({ status }) {
  const styles = {
    OPEN: "bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-400",
    PUBLISHED: "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400",
    CLOSED: "bg-ink-100 dark:bg-[#1C1C1C] text-ink-500 dark:text-ink-400",
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-md ${styles[status] || styles.CLOSED}`}>
      {status}
    </span>
  );
}

export default function BuyingIntentsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("board");
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 md:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink-900 dark:text-white">{t("ai.buyingIntentsTitle")}</h1>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0"
          >
            <Add size={18} /> {t("ai.buyingIntentsCreate")}
          </button>
        </div>

        <PillToggle
          className="mb-6 w-full"
          options={[
            { value: "board", label: t("ai.buyingIntentsTabBoard") },
            { value: "mine", label: t("ai.buyingIntentsTabMine") },
            { value: "recommend", label: t("ai.buyingIntentsTabRecommend") },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === "board" && <BoardTab />}
        {tab === "mine" && <MineTab refreshKey={refreshKey} />}
        {tab === "recommend" && <RecommendTab />}
      </div>

      <CreateIntentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          setTab("mine");
          setRefreshKey((k) => k + 1);
        }}
      />
    </AppShell>
  );
}

function BoardTab() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    searchBuyingIntents({ q: q.trim() || undefined, category: category.trim() || undefined, region: region.trim() || undefined, limit: 30 })
      .then((data) => setItems(data?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [q, category, region]);

  useEffect(() => {
    const id = setTimeout(load, 300);
    return () => clearTimeout(id);
  }, [load]);

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("ai.buyingIntentsSearchPlaceholder")}
          className="bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-ink-400 dark:text-white"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder={t("ai.buyingIntentsCategory")}
          className="bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-ink-400 dark:text-white"
        />
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder={t("ai.buyingIntentsRegion")}
          className="bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-ink-400 dark:text-white"
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center py-16 text-ink-400">{t("ai.buyingIntentsEmpty")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((intent) => (
            <IntentCard key={intent.id} intent={intent} />
          ))}
        </div>
      )}
    </div>
  );
}

function IntentCard({ intent, onClose, onPublish }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 truncate">{intent.category}</span>
        <StatusBadge status={intent.status} />
      </div>
      <p className="text-sm text-ink-900 dark:text-white line-clamp-3">{intent.needText}</p>
      <div className="flex flex-wrap gap-2 text-xs text-ink-400 dark:text-ink-500">
        {intent.region && <span>{intent.region}</span>}
        {intent.quantity != null && <span>{intent.quantity} {intent.quantityUnit}</span>}
        {(intent.budgetMin != null || intent.budgetMax != null) && (
          <span>{intent.budgetMin ?? "0"}–{intent.budgetMax ?? "?"} {intent.currency}</span>
        )}
        {intent.expiresAt && <span>{formatDate(intent.expiresAt)}</span>}
      </div>
      {(onClose || onPublish) && (
        <div className="flex items-center gap-2 mt-1">
          {onPublish && intent.status !== "PUBLISHED" && intent.status !== "CLOSED" && (
            <button
              onClick={() => onPublish(intent)}
              className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {t("ai.buyingIntentsPublish")}
            </button>
          )}
          {onClose && intent.status !== "CLOSED" && (
            <button
              onClick={() => onClose(intent)}
              className="text-xs font-medium border border-ink-200 dark:border-[#1C1C1C] text-ink-600 dark:text-ink-300 px-3 py-1.5 rounded-lg hover:border-danger-300 hover:text-danger-500 transition-colors"
            >
              {t("ai.buyingIntentsClose")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MineTab({ refreshKey }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getMyBuyingIntents({ per_page: 50 })
      .then((data) => setItems(data?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handlePublish = async (intent) => {
    if (!window.confirm(t("ai.buyingIntentsPublishConfirm"))) return;
    try {
      await publishBuyingIntent(intent.id, true);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClose = async (intent) => {
    if (!window.confirm(t("ai.buyingIntentsCloseConfirm"))) return;
    try {
      await closeBuyingIntent(intent.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-center py-16 text-ink-400">{t("ai.buyingIntentsEmpty")}</p>;
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((intent) => (
        <IntentCard key={intent.id} intent={intent} onPublish={handlePublish} onClose={handleClose} />
      ))}
    </div>
  );
}

function RecommendTab() {
  const { t } = useTranslation();
  const [need, setNeed] = useState("");
  const [category, setCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategoryTree()
      .then((data) => setCategoriesList(flattenCategoryTree(data)))
      .catch(() => setCategoriesList([]));
  }, []);

  const handleSubmit = async () => {
    if (!need.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await recommendSuppliers({ need: need.trim(), categorySlug: category.trim() || undefined, limit: 10 });
      setResult(data);
    } catch (err) {
      setError(err.message || t("ai.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">{t("ai.supplierRecommendDesc")}</p>
      <div className="grid sm:grid-cols-[1fr_auto] gap-3 mb-3">
        <textarea
          value={need}
          onChange={(e) => setNeed(e.target.value)}
          placeholder={t("ai.supplierRecommendNeed")}
          rows={2}
          className="bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-ink-400 dark:text-white resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !need.trim()}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold px-5 rounded-xl transition-colors"
        >
          {loading ? "..." : t("ai.supplierRecommendButton")}
        </button>
      </div>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full sm:w-64 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 py-2.5 text-sm outline-none text-ink-900 dark:text-white mb-4"
      >
        <option value="">{t("ai.buyingIntentsCategory")}</option>
        {categoriesList.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.depth > 0 ? `${"—".repeat(c.depth)} ${c.name || c.slug}` : (c.name || c.slug)}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5 mb-4">
          {error}
        </p>
      )}

      {result && (
        result.items?.length === 0 ? (
          <p className="text-center py-16 text-ink-400">{t("ai.supplierRecommendEmpty")}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {result.items?.map((s) => (
              <div key={s.companyId} className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ink-100 dark:bg-[#1C1C1C] overflow-hidden flex items-center justify-center shrink-0">
                    {s.logoUrl ? <img src={s.logoUrl} alt="" className="w-full h-full object-cover" /> : <Building size={18} className="text-ink-400" />}
                  </div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{s.name}</p>
                </div>
                {s.reasons?.length > 0 && (
                  <ul className="text-xs text-ink-500 dark:text-ink-400 list-disc list-inside">
                    {s.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                )}
                {s.contact?.phonePrimary && (
                  <a href={`tel:${s.contact.phonePrimary}`} className="flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 mt-1">
                    <Call size={14} /> {s.contact.phonePrimary}
                  </a>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function CreateIntentModal({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [needText, setNeedText] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [currency, setCurrency] = useState("UZS");
  const [expiresAt, setExpiresAt] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleClose = () => {
    if (sending) return;
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!category.trim() || !needText.trim() || !expiresAt) {
      setError(t("seller.enterProductName"));
      return;
    }
    setSending(true);
    setError("");
    try {
      await createBuyingIntent({
        category: category.trim(),
        region: region.trim() || undefined,
        needText: needText.trim(),
        quantity: quantity ? Number(quantity) : undefined,
        quantityUnit: quantityUnit.trim() || undefined,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        currency: currency.trim() || undefined,
        expiresAt: new Date(expiresAt).toISOString(),
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0D0D0D] rounded-t-xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-7"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-display font-bold text-ink-900 dark:text-white">{t("ai.buyingIntentsCreate")}</h2>
          <button onClick={handleClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-white transition-colors">
            <CloseCircle size={22} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Field label={`${t("ai.buyingIntentsCategory")} *`} value={category} onChange={(e) => setCategory(e.target.value)} />
          <Field label={t("ai.buyingIntentsRegion")} value={region} onChange={(e) => setRegion(e.target.value)} />
          <div>
            <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{`${t("ai.buyingIntentsNeedText")} *`}</label>
            <textarea
              value={needText}
              onChange={(e) => setNeedText(e.target.value)}
              rows={3}
              className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none placeholder:text-ink-400 dark:text-white resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("ai.buyingIntentsQuantity")} type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <Field label={t("ai.buyingIntentsQuantityUnit")} value={quantityUnit} onChange={(e) => setQuantityUnit(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("ai.buyingIntentsBudgetMin")} type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
            <Field label={t("ai.buyingIntentsBudgetMax")} type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("ai.buyingIntentsCurrency")} value={currency} onChange={(e) => setCurrency(e.target.value)} />
            <Field label={`${t("ai.buyingIntentsExpiresAt")} *`} type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={sending}
              onClick={handleClose}
              className="bg-ink-100 dark:bg-[#171717] text-ink-600 dark:text-ink-300 font-medium py-3.5 rounded-xl hover:bg-ink-200 dark:hover:bg-[#1E1E1E] disabled:opacity-50 transition-colors"
            >
              {t("ai.buyingIntentsCancel")}
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={handleSubmit}
              className="bg-brand-600 text-white font-semibold py-3.5 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {sending ? "..." : t("ai.buyingIntentsSubmit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{label}</label>
      <input
        className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none placeholder:text-ink-400 dark:text-white"
        {...props}
      />
    </div>
  );
}
