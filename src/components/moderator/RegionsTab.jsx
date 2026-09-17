import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Add, Edit2, Trash } from "iconsax-reactjs";
import { getRegions, createRegion, updateRegion, deleteRegion } from "../../api/api";

const HEADER_KEYS = ["moderator.colName", "moderator.regionCode", "moderator.regionType", "moderator.colActions"];

const REGION_TYPES = [
  { value: "REGION", labelKey: "moderator.regionTypeRegion" },
  { value: "REPUBLIC", labelKey: "moderator.regionTypeRepublic" },
  { value: "CITY", labelKey: "moderator.regionTypeCity" },
];

function IconButton({ onClick, label, danger, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`p-2 rounded-xl border sm:border-none w-full sm:w-auto flex items-center gap-2 justify-center transition-colors ${danger
        ? "text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10"
        : "text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717]"
        }`}
    >
      {children}
      <span className="sm:hidden flex">{label}</span>
    </button>
  );
}

export default function RegionsTab() {
  const { t } = useTranslation();
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRegions();
      setRegions(data?.content ?? []);
    } catch {
      setRegions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = [...regions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r) => { setEditing(r); setModalOpen(true); };

  const handleDelete = async (r) => {
    if (!window.confirm(t("moderator.deleteRegionConfirm"))) return;
    setActionId(r.id);
    try {
      await deleteRegion(r.id);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleSaved = async () => {
    setModalOpen(false);
    await load();
  };

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] px-4 py-6 sm:p-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ml-3 sm:mb-7">
        <p className="font-semibold text-[24px] leading-tight text-ink-900 dark:text-white">{t("moderator.regionsManagement")}</p>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-colors shrink-0"
        >
          <Add size={18} /> {t("moderator.addRegion")}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 px-3 sm:px-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center py-12 text-ink-400">{t("moderator.noRegionsFound")}</p>
      ) : (
        <>
          <div className="sm:hidden flex flex-col gap-3">
            {rows.map((r) => (
              <div key={r.id} className={`border border-[#F0F0F0] dark:border-[#1C1C1C] rounded-2xl p-4 ${actionId === r.id ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{r.name}</p>
                    <p className="text-xs text-ink-400 mt-0.5">{r.code}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-1 rounded-[4px] bg-ink-100 dark:bg-[#171717] text-ink-500 dark:text-ink-400 whitespace-nowrap">
                    {t(REGION_TYPES.find((x) => x.value === r.type)?.labelKey ?? "")}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-[#F0F0F0] dark:border-[#1C1C1C] pt-2">
                  <IconButton onClick={() => openEdit(r)} label={t("moderator.editRegion")}>
                    <Edit2 size={18} />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(r)} label={t("moderator.delete")} danger>
                    <Trash size={18} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <div className="w-full">
              <div className="text-left text-[16px] grid grid-cols-4 text-black dark:text-white">
                {HEADER_KEYS.map((headerKey, index) => (
                  <div key={headerKey} className={`pb-1 font-normal ${index === 0 ? "pl-4" : "border-l border-[#6F6F6F] px-5"}`}>
                    <span className="flex items-center text-sm gap-3 whitespace-nowrap">{t(headerKey)}</span>
                  </div>
                ))}
              </div>
              {rows.map((r) => (
                <div key={r.id} className={`group grid grid-cols-4 items-center text-black dark:text-white py-3 mt-4 rounded-2xl border border-[#F0F0F0] dark:border-[#1C1C1C] ${actionId === r.id ? "opacity-50" : ""}`}>
                  <div className="px-4 border-r border-[#333333] font-normal truncate">{r.name}</div>
                  <div className="px-5 border-r border-[#333333] font-normal">{r.code}</div>
                  <div className="px-5 border-r border-[#333333] font-normal">
                    {t(REGION_TYPES.find((x) => x.value === r.type)?.labelKey ?? "")}
                  </div>
                  <div className="px-5 flex items-center gap-1">
                    <IconButton onClick={() => openEdit(r)} label={t("moderator.editRegion")}>
                      <Edit2 size={18} />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(r)} label={t("moderator.delete")} danger>
                      <Trash size={18} />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <RegionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        region={editing}
        regions={regions}
        onSaved={handleSaved}
      />
    </div>
  );
}

function nextSortOrder(regions, excludeId) {
  const siblings = regions.filter((r) => r.id !== excludeId);
  if (!siblings.length) return 0;
  return Math.max(...siblings.map((r) => r.sortOrder ?? 0)) + 1;
}

function RegionFormModal({ open, onClose, region, regions, onSaved }) {
  const { t } = useTranslation();
  const isEdit = !!region;
  const [code, setCode] = useState("");
  const [nameUz, setNameUz] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [type, setType] = useState(REGION_TYPES[0].value);
  const [sortOrder, setSortOrder] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCode(region?.code || "");
    setNameUz(region?.name || "");
    setNameRu(region?.name || "");
    setNameEn(region?.name || "");
    setType(region?.type || REGION_TYPES[0].value);
    setSortOrder(region ? String(region.sortOrder ?? 0) : String(nextSortOrder(regions ?? [], region?.id)));
    setError("");
  }, [open, region, regions]);

  const submit = async () => {
    setError("");
    if (!code.trim() || !nameUz.trim() || !nameRu.trim() || !nameEn.trim()) {
      setError(t("moderator.enterRegionRequiredFields"));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        code: code.trim(),
        nameUz: nameUz.trim(),
        nameRu: nameRu.trim(),
        nameEn: nameEn.trim(),
        type,
        sortOrder: Number(sortOrder) || 0,
      };
      if (isEdit) {
        await updateRegion(region.id, payload);
      } else {
        await createRegion(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{ scrollbarWidth: "none" }}
            className="bg-white dark:bg-[#0D0D0D] rounded-t-xl sm:rounded-3xl w-full max-w-[35rem] max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-7 relative transition-colors"
          >
            <h2 className="text-lg sm:text-xl text-center font-display font-bold text-ink-900 dark:text-white mb-4 sm:mb-6">
              {isEdit ? t("moderator.editRegion") : t("moderator.addRegion")}
            </h2>

            <Field
              label={t("moderator.regionCode")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="TASHKENT"
            />
            <Field label={t("moderator.regionNameUz")} value={nameUz} onChange={(e) => setNameUz(e.target.value)} />
            <Field label={t("moderator.regionNameRu")} value={nameRu} onChange={(e) => setNameRu(e.target.value)} />
            <Field label={t("moderator.regionNameEn")} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />

            <div className="mb-4">
              <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{t("moderator.regionType")}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none dark:text-white"
              >
                {REGION_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value}>{t(rt.labelKey)}</option>
                ))}
              </select>
            </div>

            <Field
              label={t("moderator.categorySortOrder")}
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5 mb-4">
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="bg-ink-100 dark:bg-[#171717] text-ink-600 dark:text-ink-300 font-medium py-3.5 rounded-xl hover:bg-ink-200 dark:hover:bg-[#1E1E1E] disabled:opacity-50 transition-colors"
              >
                {t("moderator.cancel")}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={submit}
                className="bg-brand-600 text-white font-semibold py-3.5 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "..." : isEdit ? t("moderator.save") : t("moderator.create")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, placeholder, ...props }) {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{label}</label>
      <input
        placeholder={placeholder}
        className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none placeholder:text-ink-400 dark:text-white"
        {...props}
      />
    </div>
  );
}
