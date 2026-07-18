import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Add, CloudAdd, Edit2, Trash } from "iconsax-reactjs";
import PillToggle from "../ui/PillToggle";
import { getAdminBanners, createBanner, updateBanner, deleteBanner, uploadBannerImage } from "../../api/api";

const PLACEMENTS = [
  { value: "HOME_TOP", labelKey: "moderator.placementHomeTop" },
  { value: "HOME_MIDDLE", labelKey: "moderator.placementHomeMiddle" },
  { value: "SIDEBAR", labelKey: "moderator.placementSidebar" },
];

const HEADER_KEYS = ["moderator.colImage", "moderator.colTargetUrl", "moderator.colStatus", "moderator.colActions"];

function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatusBadge({ isActive }) {
  const { t } = useTranslation();
  if (isActive == null) {
    return (
      <span className="inline-flex w-fit items-center justify-center rounded-[4px] px-2 py-1 text-xs bg-ink-100 dark:bg-[#171717] text-ink-400">
        —
      </span>
    );
  }
  return (
    <span
      className={`inline-flex w-fit items-center justify-center rounded-[4px] px-2 py-1 text-xs font-normal whitespace-nowrap ${isActive
        ? "bg-[#D5F8DE] dark:bg-[#0F4119] text-[#38A34D]"
        : "bg-[#FFD0D0] dark:bg-[#4A0E0E] text-[#FF0000]"
        }`}
    >
      {isActive ? t("moderator.bannerActive") : t("moderator.bannerInactive")}
    </span>
  );
}

function BannerThumb({ imageUrl, className }) {
  const { t } = useTranslation();
  return (
    <div className={`rounded-xl overflow-hidden bg-ink-50 dark:bg-[#171717] shrink-0 flex items-center justify-center ${className}`}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] text-ink-400 px-2 text-center">{t("moderator.noImage")}</span>
      )}
    </div>
  );
}

function IconButton({ onClick, label, danger, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`p-2 rounded-xl transition-colors ${danger
        ? "text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10"
        : "text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717]"
        }`}
    >
      {children}
    </button>
  );
}

export default function BannersTab() {
  const { t } = useTranslation();
  const [placementCode, setPlacementCode] = useState(PLACEMENTS[0].value);
  const [banners, setBanners] = useState([]);
  const [enriched, setEnriched] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminBanners(placementCode);
      setBanners(data ?? []);
    } catch {
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, [placementCode]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = banners.map((b) => ({ ...b, ...enriched[b.id] }));

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (b) => { setEditing(b); setModalOpen(true); };

  const handleDelete = async (b) => {
    if (!window.confirm(t("moderator.deleteBannerConfirm"))) return;
    setActionId(b.id);
    try {
      const ok = await deleteBanner(b.id);
      if (!ok) { alert(t("moderator.deleteBannerFailed")); return; }
      setBanners((prev) => prev.filter((x) => x.id !== b.id));
      setEnriched((prev) => {
        if (!(b.id in prev)) return prev;
        const next = { ...prev };
        delete next[b.id];
        return next;
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleSaved = ({ saved, imageUrl }) => {
    setModalOpen(false);
    setEnriched((prev) => ({ ...prev, [saved.id]: saved }));
    if (saved.placementCode && saved.placementCode !== placementCode) {
      setPlacementCode(saved.placementCode);
      return;
    }
    setBanners((prev) => {
      const exists = prev.some((x) => x.id === saved.id);
      if (exists) {
        return prev.map((x) => (x.id === saved.id ? { ...x, targetUrl: saved.targetUrl, imageUrl: imageUrl ?? x.imageUrl } : x));
      }
      return [{ id: saved.id, targetUrl: saved.targetUrl, imageUrl: imageUrl ?? null }, ...prev];
    });
  };

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] px-4 py-6 sm:p-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ml-3 sm:mb-7">
        <p className="font-semibold text-[24px] leading-tight text-ink-900 dark:text-white">{t("moderator.bannersManagement")}</p>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-colors shrink-0"
        >
          <Add size={18} /> {t("moderator.addBanner")}
        </button>
      </div>

      <PillToggle
        options={PLACEMENTS.map((p) => ({ value: p.value, label: t(p.labelKey) }))}
        value={placementCode}
        onChange={setPlacementCode}
        className="mb-6 max-w-full w-full"
      />

      {loading ? (
        <div className="flex flex-col gap-3 px-3 sm:px-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center py-12 text-ink-400">{t("moderator.noBannersFound")}</p>
      ) : (
        <>
          <div className="sm:hidden flex flex-col gap-3">
            {rows.map((b) => (
              <div key={b.id} className={`border border-[#F0F0F0] dark:border-[#1C1C1C] rounded-2xl p-4 ${actionId === b.id ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-3 mb-3">
                  <BannerThumb imageUrl={b.imageUrl} className="w-16 h-12" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{b.targetUrl}</p>
                    <p className="text-xs text-ink-400 mt-0.5">ID: {b.id}</p>
                  </div>
                  <StatusBadge isActive={b.isActive ?? null} />
                </div>
                <div className="flex items-center justify-end gap-1 border-t border-[#F0F0F0] dark:border-[#1C1C1C] pt-2">
                  <IconButton onClick={() => openEdit(b)} label={t("moderator.editBanner")}>
                    <Edit2 size={18} />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(b)} label={t("moderator.delete")} danger>
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
              {rows.map((b) => (
                <div key={b.id} className={`group grid grid-cols-4 items-center text-black dark:text-white py-3 mt-4 rounded-2xl border border-[#F0F0F0] dark:border-[#1C1C1C] ${actionId === b.id ? "opacity-50" : ""}`}>
                  <div className="px-4 border-r border-[#333333]">
                    <BannerThumb imageUrl={b.imageUrl} className="w-20 h-12" />
                  </div>
                  <div className="px-5 border-r border-[#333333] font-normal truncate">{b.targetUrl}</div>
                  <div className="px-5 border-r border-[#333333] font-normal">
                    <StatusBadge isActive={b.isActive ?? null} />
                  </div>
                  <div className="px-5 flex items-center gap-1">
                    <IconButton onClick={() => openEdit(b)} label={t("moderator.editBanner")}>
                      <Edit2 size={18} />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(b)} label={t("moderator.delete")} danger>
                      <Trash size={18} />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <BannerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        banner={editing ? { ...editing, ...enriched[editing.id] } : null}
        defaultPlacement={placementCode}
        onSaved={handleSaved}
      />
    </div>
  );
}

function BannerFormModal({ open, onClose, banner, defaultPlacement, onSaved }) {
  const { t } = useTranslation();
  const isEdit = !!banner;
  const detailsKnown = banner?.isActive !== undefined && banner?.isActive !== null;
  const [placementCode, setPlacementCode] = useState(defaultPlacement);
  const [targetUrl, setTargetUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setPlacementCode(banner?.placementCode || defaultPlacement);
    setTargetUrl(banner?.targetUrl || "");
    setStartsAt(toDatetimeLocal(banner?.startsAt) || toDatetimeLocal(new Date().toISOString()));
    setEndsAt(toDatetimeLocal(banner?.endsAt));
    setIsActive(banner?.isActive ?? true);
    setFile(null);
    setPreview(banner?.imageUrl || null);
    setError("");
  }, [open, banner, defaultPlacement]);

  const handleFile = (files) => {
    const f = files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    setError("");
    if (!targetUrl.trim()) { setError(t("moderator.enterBannerTargetUrl")); return; }
    if (!endsAt) { setError(t("moderator.enterBannerEndsAt")); return; }
    if (!isEdit) {
      if (!startsAt) { setError(t("moderator.enterBannerStartsAt")); return; }
      if (!file) { setError(t("moderator.enterBannerImage")); return; }
    }

    setLoading(true);
    try {
      const saved = isEdit
        ? await updateBanner(banner.id, {
          targetUrl: targetUrl.trim(),
          endsAt: new Date(endsAt).toISOString(),
          isActive,
        })
        : await createBanner({
          placementCode,
          targetUrl: targetUrl.trim(),
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
        });

      let imageUrl = banner?.imageUrl ?? null;
      if (file) {
        const uploaded = await uploadBannerImage(saved.id, file);
        imageUrl = uploaded?.imageUrl ?? imageUrl;
      }
      onSaved({ saved, imageUrl });
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
          className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-center justify-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{ scrollbarWidth: "none" }}
            className="bg-white dark:bg-[#0D0D0D] rounded-t-3xl sm:rounded-3xl w-full max-w-[35rem] max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-7 relative transition-colors"
          >
            <h2 className="text-lg sm:text-xl text-center font-display font-bold text-ink-900 dark:text-white mb-4 sm:mb-6">
              {isEdit ? t("moderator.editBanner") : t("moderator.addBanner")}
            </h2>

            {!isEdit && (
              <div className="mb-4">
                <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">
                  {t("moderator.selectPlacement")}
                </label>
                <PillToggle
                  options={PLACEMENTS.map((p) => ({ value: p.value, label: t(p.labelKey) }))}
                  value={placementCode}
                  onChange={setPlacementCode}
                  className="w-full"
                />
              </div>
            )}

            {isEdit && !detailsKnown && (
              <p className="text-xs text-ink-400 bg-ink-50 dark:bg-[#171717] rounded-xl px-3 py-2 mb-4">
                {t("moderator.bannerDetailsUnknownHint")}
              </p>
            )}

            <Field
              label={t("moderator.bannerTargetUrl")}
              placeholder="https://"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
            />

            {!isEdit && (
              <Field
                label={t("moderator.bannerStartsAt")}
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            )}

            <Field
              label={t("moderator.bannerEndsAt")}
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />

            {isEdit && (
              <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-brand-600"
                />
                <span className="text-sm text-ink-700 dark:text-ink-200">{t("moderator.bannerActive")}</span>
              </label>
            )}

            <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">
              {t("moderator.bannerImage")}
            </label>
            <div
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-ink-200 dark:border-[#1C1C1C] rounded-xl py-6 flex flex-col items-center justify-center text-center mb-3 hover:border-brand-300 dark:hover:border-brand-500 transition-colors cursor-pointer overflow-hidden"
            >
              {preview ? (
                <img src={preview} alt="" className="max-h-24 rounded-lg object-contain" />
              ) : (
                <>
                  <CloudAdd size={26} className="text-ink-300 dark:text-ink-600 mb-2" />
                  <p className="text-sm text-ink-400">{t("moderator.uploadImage")}</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files)} />

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
