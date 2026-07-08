import { useState, useEffect, useCallback } from "react";
import PillToggle from "../ui/PillToggle";
import ProductThumb from "../ui/ProductThumb";
import { getProductModerationQueue, getMyProducts, approveProduct, rejectProduct } from "../../api/api";
import { IoIosClose } from "react-icons/io";
import { GrFormCheckmark } from "react-icons/gr";

function primaryImage(p) {
  return p.images?.find((img) => img.is_primary)?.url ?? p.images?.[0]?.url ?? null;
}

export default function ModProductsTab() {
  const [subTab, setSubTab] = useState("pending");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (subTab === "pending") {
        const data = await getProductModerationQueue();
        setProducts(data ?? []);
      } else {
        const data = await getMyProducts({ page: 1, per_page: 50, status: subTab === "draft" ? "DRAFT" : undefined });
        setProducts(data?.items ?? []);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [subTab]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await approveProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    const comment = window.prompt("Причина отклонения:") ?? "";
    setActionId(id);
    try {
      await rejectProduct(id, { reasonCode: "OTHER", comment });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="overflow-x-auto">
        <PillToggle
          options={[
            { value: "pending", label: "Товары на проверке" },
            { value: "mine", label: "Мои товары" },
            { value: "draft", label: "Черновик" },
          ]}
          value={subTab}
          onChange={setSubTab}
          className="w-full"
        />
      </div>

      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
        <p className="font-semibold text-ink-900 text-[24px] dark:text-white mb-4">
          {subTab === "pending" ? "Товары на проверке" : subTab === "mine" ? "Мои товары" : "Черновики"}
        </p>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center py-12 text-ink-400">Товаров нет</p>
        ) : (
          <div className="flex flex-col gap-3">
            {products.map((p) => {
              const busy = actionId === p.id;
              const img = primaryImage(p);
              return (
                <div key={p.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-4 transition-opacity ${busy ? "opacity-50" : ""}`}>
                  <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="w-[126px] h-[86px] flex items-center justify-center bg-[#E2E2E2] dark:bg-[#2A2A2A] rounded-sm overflow-hidden shrink-0">
                      {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <ProductThumb height="8" width="21" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-[#7F7F7F] mb-1">Компания #{p.companyId}</p>
                      {p.shortDescription && (
                        <p className="text-xs text-black dark:text-white mt-1">{p.shortDescription}</p>
                      )}
                      {p.rejectReason && (
                        <p className="text-[11px] text-danger-500 mt-1">Причина отклонения: {p.rejectReason}</p>
                      )}
                      <p className="text-[11px] text-ink-300 dark:text-[#7F7F7F] mt-1">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString("ru-RU") : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                    <p className="font-bold text-brand-600 dark:text-brand-400">{p.price} {p.currency}</p>
                    {subTab === "pending" && (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={busy}
                          onClick={() => handleApprove(p.id)}
                          className="flex items-center gap-1.5 bg-success-500 hover:bg-success-600 text-white dark:text-black text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                        >
                          <GrFormCheckmark className="text-[20px]" /> Одобрить
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => handleReject(p.id)}
                          className="flex items-center gap-1.5 bg-danger-500 hover:bg-danger-600 text-white dark:text-black text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                        >
                          <IoIosClose className="text-[20px]" /> Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
