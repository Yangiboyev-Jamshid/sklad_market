import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowDown2, CloudAdd, Trash } from "iconsax-reactjs";
import PillToggle from "../ui/PillToggle";
import { createProduct, publishProduct, uploadProductImages, getCategoryTree, getMyCompany } from "../../api/api";
import { flattenCategoryTree } from "../../utils/categories";

const UNIT_KEYS = [
  { value: "Тонна", labelKey: "seller.unitTon" },
  { value: "Килограмм", labelKey: "seller.unitKg" },
  { value: "Штука", labelKey: "seller.unitPiece" },
  { value: "Упаковка", labelKey: "seller.unitPack" },
  { value: "Литр", labelKey: "seller.unitLiter" },
  { value: "Метр", labelKey: "seller.unitMeter" },
];

export default function AddProductModal({ open, onClose, companyId }) {
  const { t } = useTranslation();
  const [saleType, setSaleType] = useState("WHOLESALE");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState(UNIT_KEYS[0].value);
  const [minProduct, setMinProduct] = useState("");
  const [phone, setPhone] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [categoriesList, setCategoriesList] = useState([]);
  const [resolvedCompanyId, setResolvedCompanyId] = useState(companyId);
  const [companyLocation, setCompanyLocation] = useState({ regionId: null, districtId: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    getCategoryTree()
      .then((data) => setCategoriesList(flattenCategoryTree(data)))
      .catch(() => {});

    getMyCompany()
      .then((c) => {
        if (!companyId) setResolvedCompanyId(c.id);
        setCompanyLocation({ regionId: c.regionId ?? null, districtId: c.districtId ?? null });
      })
      .catch(() => {
        if (!companyId) setError(t("seller.companyNotResolved"));
      });
  }, [open, companyId, t]);

  const fileInputRef = useRef(null);

  const reset = () => {
    setName(""); setDescription("");
    setPrice(""); setMinProduct(""); setCategoryId(""); setPhone("");
    setImages([]); setPreviews([]);
    setError(""); setSuccess(""); setSaleType("WHOLESALE");
    setUnit(UNIT_KEYS[0].value);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFiles = (files) => {
    const newFiles = Array.from(files).slice(0, 10 - images.length);
    setImages((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const submit = async (publish) => {
    setError(""); setSuccess("");
    if (submittingRef.current) return;
    if (!name.trim()) { setError(t("seller.enterProductName")); return; }
    if (!price || isNaN(Number(price))) { setError(t("seller.enterValidPrice")); return; }
    if (!resolvedCompanyId) { setError(t("seller.companyNotResolved")); return; }

    submittingRef.current = true;
    setLoading(true);
    try {
      const payload = {
        companyId: resolvedCompanyId ? Number(resolvedCompanyId) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        regionId: companyLocation.regionId ?? 0,
        districtId: companyLocation.districtId ?? 0,
        name: name.trim(),
        description: description.trim(),
        priceType: "FIXED",
        saleType,
        price: Number(price),
        currency: "UZS",
        minProduct: minProduct ? Number(minProduct) : undefined,
        unit,
        phone: phone.trim() || undefined,
      };

      const product = await createProduct(payload);

      if (images.length > 0) {
        await uploadProductImages(product.id, images);
      }

      if (publish) {
        await publishProduct(product.id);
        setSuccess(t("seller.productSentToModeration"));
      } else {
        setSuccess(t("seller.productSavedAsDraft"));
      }

      setTimeout(() => { handleClose(); }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      submittingRef.current = false;
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
          onClick={handleClose}
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
              {t("seller.addProductTitle")}
            </h2>

            <PillToggle
              options={[
                { value: "WHOLESALE", label: t("home.wholesale") },
                { value: "RETAIL", label: t("home.retail") },
              ]}
              value={saleType}
              onChange={setSaleType}
              className="w-full mb-5"
            />

            <Field
              label={t("seller.productName")}
              placeholder={t("seller.productNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">
                  {t("product.category")}
                </label>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full appearance-none bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 pr-9 text-sm outline-none text-ink-900 dark:text-white cursor-pointer"
                  >
                    <option value="">{t("seller.selectCategory")}</option>
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.depth > 0 ? `— ${c.name || c.slug}` : (c.name || c.slug)}
                      </option>
                    ))}
                  </select>
                  <ArrowDown2
                    size={16}
                    variant="Linear"
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">
                  {t("seller.unit")}
                </label>
                <div className="relative">
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full appearance-none bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 pr-9 text-sm outline-none text-ink-900 dark:text-white cursor-pointer"
                  >
                    {UNIT_KEYS.map((u) => (
                      <option key={u.value} value={u.value}>{t(u.labelKey)}</option>
                    ))}
                  </select>
                  <ArrowDown2
                    size={16}
                    variant="Linear"
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Field
                label={t("seller.price")}
                placeholder="0"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <Field
                label={t("seller.minOrder")}
                placeholder="1"
                type="number"
                value={minProduct}
                onChange={(e) => setMinProduct(e.target.value)}
              />
            </div>

            <Field
              label={t("seller.phoneForContact")}
              placeholder="+998 90 000 00 00"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">
              {t("seller.productDescription")}
            </label>
            <textarea
              placeholder={t("seller.productDescriptionPlaceholder")}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none placeholder:text-ink-400 dark:text-white mb-4 resize-none"
            />

            {/* Image upload */}
            <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">
              {t("seller.productPhoto")}
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-ink-200 dark:border-[#1C1C1C] rounded-xl py-8 flex flex-col items-center justify-center text-center mb-3 hover:border-brand-300 dark:hover:border-brand-500 transition-colors cursor-pointer"
            >
              <CloudAdd size={28} className="text-ink-300 dark:text-ink-600 mb-2" />
              <p className="text-sm text-ink-400">{t("seller.dropFilesHint")}</p>
              <p className="text-xs text-ink-300 dark:text-ink-600 mt-1">{t("seller.fileSizeHint")}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-ink-200 dark:border-[#1C1C1C]">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-0.5 right-0.5 bg-white dark:bg-[#0D0D0D] rounded-full p-0.5 text-red-500"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5 mb-4"
              >
                {error}
              </motion.p>
            )}

            {success && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-green-600 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl px-4 py-2.5 mb-4"
              >
                {success}
              </motion.p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => submit(false)}
                className="bg-ink-100 dark:bg-[#171717] text-ink-600 dark:text-ink-300 font-medium py-3.5 rounded-xl hover:bg-ink-200 dark:hover:bg-[#1E1E1E] disabled:opacity-50 transition-colors"
              >
                {loading ? "..." : t("seller.draft")}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => submit(true)}
                className="bg-brand-600 text-white font-semibold py-3.5 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    {t("cart.sending")}
                  </>
                ) : (
                  t("seller.toModeration")
                )}
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
