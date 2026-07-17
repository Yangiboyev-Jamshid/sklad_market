import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Edit2, Trash, Archive } from "iconsax-reactjs";
import { getMyCompany, getMyProducts, deleteProduct, archiveProduct } from "../../api/api";
import EditProductModal from "./EditProductModal";
import ProductThumb from "../ui/ProductThumb";

export default function ProductsTab() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null); 
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    getMyCompany()
      .then((company) => getMyProducts({ page: 1, per_page: 50, company_id: company.id }))
      .then((data) => setProducts(data?.items ?? data?.content ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(t("seller.confirmDeleteProduct"))) return;
    setActionId(id);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleArchive = async (id) => {
    setActionId(id);
    try {
      await archiveProduct(id);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "ARCHIVED", isActive: false } : p))
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const primaryImage = (p) =>
    p.images?.find((img) => img.is_primary)?.url ?? p.images?.[0]?.url ?? null;

  const statusBadge = (status) => {
    const map = {
      PENDING: { labelKey: "seller.statusPending", cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" },
      ACTIVE: { labelKey: "seller.statusActive", cls: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400" },
      REJECTED: { labelKey: "seller.statusRejected", cls: "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400" },
      ARCHIVED: { labelKey: "seller.statusArchived", cls: "bg-ink-100 dark:bg-[#1C1C1C] text-ink-500 dark:text-ink-400" },
    };
    const s = map[status];
    const label = s ? t(s.labelKey) : status;
    const cls = s?.cls ?? "bg-ink-100 text-ink-500";
    return <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
  };

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
      <p className="font-semibold text-[24px] text-ink-900 dark:text-white mb-4 sm:mb-5">
        {t("seller.productsList")}
      </p>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-center py-12 text-ink-400">{t("seller.noProducts")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((p) => {
            const img = primaryImage(p);
            const busy = actionId === p.id;
            return (
              <div
                key={p.id}
                className={`flex sm:flex-row flex-col items-center gap-3 sm:gap-4 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-3 transition-opacity ${busy ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="w-[126px] h-[66px] sm:w-[100px] flex items-center justify-center sm:h-[66px] rounded-sm overflow-hidden bg-[#E2E2E2] dark:bg-[#2A2A2A] shrink-0">
                    {img ? <img src={img} alt={p.name} className="w-full h-full object-cover" /> : <ProductThumb width="21" height="8" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-ink-900 dark:text-white">{p.name}</p>
                      {statusBadge(p.status)}
                    </div>
                    <p className="text-[8.25px] mt-3 text-ink-400">
                      {p.price} {p.currency} · {p.priceType === "NEGOTIABLE" ? t("seller.priceNegotiable") : t("seller.priceFixed")}
                    </p>
                    {p.rejectReason && (
                      <p className="text-[9px] text-red-500 mt-1">{t("seller.rejectReason", { reason: p.rejectReason })}</p>
                    )}
                  </div>
                </div>
                <div className="sm:w-auto w-full sm:flex flex-1 flex-col sm:flex-row items-start justify-end gap-2 text-ink-400 shrink-0">
                  <button
                    disabled={busy}
                    onClick={() => setEditingProduct(p)}
                    title={t("seller.edit")}
                    className="w-full flex items-center mt-3 gap-2 text-black dark:text-white rounded-xl justify-center p-3 sm:w-auto hover:text-brand-500 transition-colors p-1 sm:border-none border"
                  >
                    <Edit2 size={20} />
                    <p className="sm:hidden flex">{t("seller.edit")}</p>
                  </button>
                  {p.status !== "ARCHIVED" && (
                    <button
                      disabled={busy}
                      onClick={() => handleArchive(p.id)}
                      title={t("seller.archive")}
                      className="w-full flex items-center mt-3 gap-2 text-black dark:text-white rounded-xl justify-center p-3 sm:w-auto hover:text-amber-500 transition-colors p-1 sm:border-none border"
                    >
                      <Archive size={20} />
                      <p className="sm:hidden flex">{t("seller.archive")}</p>
                    </button>
                  )}
                  <button
                    disabled={busy}
                    onClick={() => handleDelete(p.id)}
                    title={t("seller.delete")}
                    className="w-full flex items-center mt-3 gap-2 text-black dark:text-white rounded-xl justify-center p-3 sm:w-auto hover:text-red-500 transition-colors p-1 sm:border-none border"
                  >
                    <Trash size={20} />
                    <p className="sm:hidden flex">{t("seller.delete")}</p>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={(updated) => {
            setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}
