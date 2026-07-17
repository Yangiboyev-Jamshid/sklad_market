import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowDown2, CloudAdd, Trash, Star1 } from "iconsax-reactjs";
import {
  updateProduct,
  uploadProductImages,
  deleteProductImage,
  setProductPrimaryImage,
  getCategories,
} from "../../api/api";

const UNIT_KEYS = [
  { value: "Тонна", labelKey: "seller.unitTon" },
  { value: "Килограмм", labelKey: "seller.unitKg" },
  { value: "Штука", labelKey: "seller.unitPiece" },
  { value: "Упаковка", labelKey: "seller.unitPack" },
  { value: "Литр", labelKey: "seller.unitLiter" },
  { value: "Метр", labelKey: "seller.unitMeter" },
];

export default function EditProductModal({ product, onClose, onSaved }) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [unit, setUnit] = useState(product?.unit ?? UNIT_KEYS[0].value);
  const [minProduct, setMinProduct] = useState(product?.minProduct ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");

  const [images, setImages] = useState(product?.images ?? []);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [imageBusyId, setImageBusyId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    getCategories({ page: 0, size: 200 })
      .then((data) => {
        const all = (data?.content ?? []).filter((c) => c.isActive);
        all.sort((a, b) => a.sortOrder - b.sortOrder);
        setCategoriesList(all);
      })
      .catch(() => {});
  }, []);

  const handleFiles = (files) => {
    const arr = Array.from(files);
    setNewFiles((prev) => [...prev, ...arr]);
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setNewPreviews((prev) => [...prev, e.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removeNewImage = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async () => {
    if (newFiles.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadProductImages(product.id, newFiles);
      setImages((prev) => [...prev, ...(uploaded ?? [])]);
      setNewFiles([]);
      setNewPreviews([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId) => {
    setImageBusyId(imageId);
    try {
      await setProductPrimaryImage(product.id, imageId);
      setImages((prev) => prev.map((img) => ({ ...img, is_primary: img.id === imageId })));
    } catch (err) {
      setError(err.message);
    } finally {
      setImageBusyId(null);
    }
  };

  const handleDeleteImage = async (imageId) => {
    setImageBusyId(imageId);
    try {
      await deleteProductImage(product.id, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err.message);
    } finally {
      setImageBusyId(null);
    }
  };

  const submit = async () => {
    setError("");
    setSuccess("");
    if (submittingRef.current) return;
    if (!name.trim()) { setError(t("seller.enterProductName")); return; }
    if (!price || isNaN(Number(price))) { setError(t("seller.enterValidPrice")); return; }

    submittingRef.current = true;
    setLoading(true);
    try {
      const updated = await updateProduct(product.id, {
        name: name.trim(),
        description: description.trim(),
        priceType: "FIXED",
        price: Number(price),
        currency: "UZS",
        minProduct: minProduct ? Number(minProduct) : undefined,
        unit,
        categoryId: categoryId ? Number(categoryId) : undefined,
        companyId: product.companyId,
        regionId: product.regionId,
        districtId: product.districtId,
      });
      setSuccess(t("seller.productUpdated"));
      setTimeout(() => {
        onSaved?.(updated ?? { ...product, name, description, price: Number(price), currency: "UZS", images });
      }, 900);
    } catch (err) {
      setError(err.message);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <AnimatePresence>
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
          className="bg-white dark:bg-[#0D0D0D] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-7 relative transition-colors"
        >
          <h2 className="text-lg sm:text-xl text-center font-display font-bold text-ink-900 dark:text-white mb-4 sm:mb-6">
            {t("seller.editProductTitle")}
          </h2>

          <Field label={t("seller.productName")} value={name} onChange={(e) => setName(e.target.value)} />

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{t("product.category")}</label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full appearance-none bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 pr-9 text-sm outline-none text-ink-900 dark:text-white cursor-pointer"
                >
                  <option value="">{t("seller.selectCategory")}</option>
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.id}>{i18n.language === "uz" ? (c.nameUz || c.nameRu || c.slug) : i18n.language === "en" ? (c.nameEn || c.nameRu || c.slug) : (c.nameRu || c.nameUz || c.slug)}</option>
                  ))}
                </select>
                <ArrowDown2 size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{t("seller.unit")}</label>
              <div className="relative">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full appearance-none bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 pr-9 text-sm outline-none text-ink-900 dark:text-white cursor-pointer"
                >
                  {UNIT_KEYS.map((u) => <option key={u.value} value={u.value}>{t(u.labelKey)}</option>)}
                </select>
                <ArrowDown2 size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label={t("seller.price")} type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            <Field label={t("seller.minOrder")} type="number" value={minProduct} onChange={(e) => setMinProduct(e.target.value)} />
          </div>

          <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{t("seller.productDescription")}</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none dark:text-white mb-4 resize-none"
          />

          {/* Existing images */}
          {images.length > 0 && (
            <>
              <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{t("seller.currentPhotos")}</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {images.map((img) => {
                  const busy = imageBusyId === img.id;
                  return (
                    <div key={img.id} className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 ${img.is_primary ? "border-brand-500" : "border-ink-200 dark:border-[#1C1C1C]"} ${busy ? "opacity-50" : ""}`}>
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleSetPrimary(img.id)}
                        title={t("seller.makePrimary")}
                        className={`absolute bottom-0.5 left-0.5 rounded-full p-0.5 ${img.is_primary ? "bg-brand-500 text-white" : "bg-white/90 dark:bg-[#0D0D0D]/90 text-ink-400"}`}
                      >
                        <Star1 size={12} variant={img.is_primary ? "Bold" : "Linear"} />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDeleteImage(img.id)}
                        className="absolute top-0.5 right-0.5 bg-white dark:bg-[#0D0D0D] rounded-full p-0.5 text-red-500"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Add new images */}
          <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{t("seller.addPhoto")}</label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-ink-200 dark:border-[#1C1C1C] rounded-xl py-6 flex flex-col items-center justify-center text-center mb-3 hover:border-brand-300 dark:hover:border-brand-500 transition-colors cursor-pointer"
          >
            <CloudAdd size={24} className="text-ink-300 dark:text-ink-600 mb-2" />
            <p className="text-sm text-ink-400">{t("seller.dropFilesHint")}</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />

          {newPreviews.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {newPreviews.map((src, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-ink-200 dark:border-[#1C1C1C]">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeNewImage(i)} className="absolute top-0.5 right-0.5 bg-white dark:bg-[#0D0D0D] rounded-full p-0.5 text-red-500">
                    <Trash size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={uploadNewImages}
                disabled={uploading}
                className="text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors"
              >
                {uploading ? t("seller.uploading") : t("seller.upload")}
              </button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5 mb-4">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl px-4 py-2.5 mb-4">
              {success}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-ink-100 dark:bg-[#171717] text-ink-600 dark:text-ink-300 font-medium py-3.5 rounded-xl hover:bg-ink-200 dark:hover:bg-[#1E1E1E] transition-colors"
            >
              {t("seller.cancel")}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={submit}
              className="bg-brand-600 text-white font-semibold py-3.5 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? t("seller.saving") : t("seller.save")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, ...props }) {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{label}</label>
      <input
        className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none placeholder:text-ink-400 dark:text-white"
        {...props}
      />
    </div>
  );
}
