import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Add, CloudAdd, Edit2, Trash } from "iconsax-reactjs";
import {
  getAdminCategories,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/api";

const HEADER_KEYS = ["moderator.colIcon", "moderator.colName", "moderator.colStatus", "moderator.colActions"];

function mergeWithTree(adminList, tree) {
  const treeMap = new Map((tree ?? []).map((t) => [t.id, t]));
  return (adminList ?? []).map((c) => {
    const t = treeMap.get(c.id);
    return { ...c, parentId: t?.parentId ?? null, iconUrl: c.iconUrl ?? t?.iconUrl ?? null };
  });
}
function orderForDisplay(categories) {
  const byParent = new Map();
  categories.forEach((c) => {
    const key = c.parentId ?? "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c);
  });
  const sortBySortOrder = (list) => [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const result = [];
  const seen = new Set();
  sortBySortOrder(byParent.get("root") ?? []).forEach((root) => {
    result.push({ ...root, depth: 0 });
    seen.add(root.id);
    sortBySortOrder(byParent.get(root.id) ?? []).forEach((child) => {
      result.push({ ...child, depth: 1 });
      seen.add(child.id);
    });
  });
  categories.forEach((c) => {
    if (!seen.has(c.id)) result.push({ ...c, depth: 0 });
  });
  return result;
}

function StatusBadge({ isActive }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex w-fit items-center justify-center rounded-[4px] px-2 py-1 text-xs font-normal whitespace-nowrap ${isActive
        ? "bg-[#D5F8DE] dark:bg-[#0F4119] text-[#38A34D]"
        : "bg-[#FFD0D0] dark:bg-[#4A0E0E] text-[#FF0000]"
        }`}
    >
      {isActive ? t("moderator.categoryActive") : t("moderator.categoryInactive")}
    </span>
  );
}

function CategoryThumb({ iconUrl, className }) {
  const [broken, setBroken] = useState(false);
  const showImage = iconUrl && !broken;
  return (
    <div className={`rounded-xl overflow-hidden bg-ink-50 dark:bg-[#171717] shrink-0 flex items-center justify-center ${className}`}>
      {showImage ? (
        <img src={iconUrl} alt="" onError={() => setBroken(true)} className="w-full h-full object-cover" />
      ) : (
        <span className="text-ink-300">—</span>
      )}
    </div>
  );
}

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
      <span className="sm:hidden flex">{danger ? "Удалить" : "Редоктировать"}</span>
    </button>
  );
}

export default function CategoriesTab() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [adminList, tree] = await Promise.all([getAdminCategories(), getCategoryTree()]);
      setCategories(mergeWithTree(adminList, tree));
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = orderForDisplay(categories);
  const topLevelOptions = categories.filter((c) => !c.parentId);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setModalOpen(true); };

  const handleDelete = async (c) => {
    if (!window.confirm(t("moderator.deleteCategoryConfirm"))) return;
    setActionId(c.id);
    try {
      await deleteCategory(c.id);
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
        <p className="font-semibold text-[24px] leading-tight text-ink-900 dark:text-white">{t("moderator.categoriesManagement")}</p>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-colors shrink-0"
        >
          <Add size={18} /> {t("moderator.addCategory")}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 px-3 sm:px-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center py-12 text-ink-400">{t("moderator.noCategoriesFound")}</p>
      ) : (
        <>
          <div className="sm:hidden flex flex-col gap-3">
            {rows.map((c) => (
              <div
                key={c.id}
                style={{ marginLeft: c.depth * 16 }}
                className={`border border-[#F0F0F0] dark:border-[#1C1C1C] rounded-2xl p-4 ${actionId === c.id ? "opacity-50" : ""}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <CategoryThumb key={c.iconUrl} iconUrl={c.iconUrl} className="w-12 h-12" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900 dark:text-white truncate">
                      {c.depth > 0 && "↳ "}{c.nameUz}
                    </p>
                    <p className="text-xs text-ink-400 mt-0.5 truncate">{c.nameRu} · {c.nameEn}</p>
                  </div>
                  <StatusBadge isActive={c.isActive} />
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-[#F0F0F0] dark:border-[#1C1C1C] pt-2">
                  <IconButton onClick={() => openEdit(c)} label={t("moderator.editCategory")}>
                    <Edit2 size={20} />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(c)} label={t("moderator.delete")} danger>
                    <Trash size={20} />
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
              {rows.map((c) => (
                <div key={c.id} className={`group grid grid-cols-4 items-center text-black dark:text-white py-3 mt-4 rounded-2xl border border-[#F0F0F0] dark:border-[#1C1C1C] ${actionId === c.id ? "opacity-50" : ""}`}>
                  <div className="px-4 border-r border-[#333333]">
                    <CategoryThumb key={c.iconUrl} iconUrl={c.iconUrl} className="w-12 h-12" />
                  </div>
                  <div className="px-5 border-r border-[#333333] min-w-0" style={{ paddingLeft: `${20 + c.depth * 20}px` }}>
                    <p className="font-normal truncate">{c.depth > 0 && "↳ "}{c.nameUz}</p>
                    <p className="text-xs text-ink-400 truncate">{c.nameRu} · {c.nameEn}</p>
                  </div>
                  <div className="px-5 border-r border-[#333333] font-normal">
                    <StatusBadge isActive={c.isActive} />
                  </div>
                  <div className="px-5 flex items-center gap-1">
                    <IconButton onClick={() => openEdit(c)} label={t("moderator.editCategory")}>
                      <Edit2 size={20} />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(c)} label={t("moderator.delete")} danger>
                      <Trash size={20} />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        category={editing}
        parentOptions={topLevelOptions}
        onSaved={handleSaved}
      />
    </div>
  );
}

function CategoryFormModal({ open, onClose, category, parentOptions, onSaved }) {
  const { t } = useTranslation();
  const isEdit = !!category;
  const [nameUz, setNameUz] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setNameUz(category?.nameUz || "");
    setNameRu(category?.nameRu || "");
    setNameEn(category?.nameEn || "");
    setSlug(category?.slug || "");
    setParentId(category?.parentId ? String(category.parentId) : "");
    setSortOrder(category ? String(category.sortOrder ?? 0) : "0");
    setIsActive(category?.isActive ?? true);
    setFile(null);
    setPreview(category?.iconUrl || null);
    setError("");
  }, [open, category]);

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
    if (!nameUz.trim() || !nameRu.trim() || !nameEn.trim() || !slug.trim()) {
      setError(t("moderator.enterCategoryRequiredFields"));
      return;
    }
    if (!isEdit && !file) {
      setError(t("moderator.enterCategoryIcon"));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        nameUz: nameUz.trim(),
        nameRu: nameRu.trim(),
        nameEn: nameEn.trim(),
        slug: slug.trim(),
        parentId: parentId ? Number(parentId) : null,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      };
      if (isEdit) {
        await updateCategory(category.id, payload, file);
      } else {
        await createCategory(payload, file);
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
              {isEdit ? t("moderator.editCategory") : t("moderator.addCategory")}
            </h2>

            <Field label={t("moderator.categoryNameUz")} value={nameUz} onChange={(e) => setNameUz(e.target.value)} />
            <Field label={t("moderator.categoryNameRu")} value={nameRu} onChange={(e) => setNameRu(e.target.value)} />
            <Field label={t("moderator.categoryNameEn")} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            <Field label={t("moderator.categorySlug")} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="metalloprokat" />

            <div className="mb-4">
              <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{t("moderator.categoryParent")}</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none dark:text-white"
              >
                <option value="">{t("moderator.noParentOption")}</option>
                {parentOptions
                  .filter((p) => p.id !== category?.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.nameUz}</option>
                  ))}
              </select>
            </div>

            <Field
              label={t("moderator.categorySortOrder")}
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />

            <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-brand-600"
              />
              <span className="text-sm text-ink-700 dark:text-ink-200">{t("moderator.categoryActive")}</span>
            </label>

            <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">
              {t("moderator.categoryIcon")}
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
            {isEdit && <p className="text-xs text-ink-400 mb-3">{t("moderator.changeImage")}</p>}
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
