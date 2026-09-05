import { useState } from "react";
import { Minus, Add, Trash, ShoppingCart, Message, ShieldTick, Truck, Shop, TickCircle } from "iconsax-reactjs";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import AppShell from "../components/layout/AppShell";
import ProductThumb from "../components/ui/ProductThumb";
import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { checkoutRfq, createChat } from "../api/api";
import { CHAT_ENABLED } from "../config/chatConfig";

export default function CartPage() {
  const { t } = useTranslation();
  const { items, cartLoading, updateQty, removeFromCart, currency } = useCart();
  const navigate = useNavigate();

  const [deselectedIds, setDeselectedIds] = useState(() => new Set());
  const selectedItems = items.filter((item) => !deselectedIds.has(item.id));
  const allSelected = items.length > 0 && deselectedIds.size === 0;
  const selectedTotal = selectedItems.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);

  const toggleItemSelected = (id) => {
    setDeselectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setDeselectedIds(allSelected ? new Set(items.map((i) => i.id)) : new Set());
  };

  const [showForm, setShowForm] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("DELIVERY");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [contactingSeller, setContactingSeller] = useState(false);

  const distinctSellerCount = new Set(selectedItems.map((i) => i.companyId).filter(Boolean)).size;
  const isMultiSeller = distinctSellerCount > 1;

  const handleContactSeller = async () => {
    if (!CHAT_ENABLED) { alert(t("chat.temporarilyUnavailable")); return; }
    const companyId = selectedItems[0]?.companyId;
    if (!companyId) return;
    setContactingSeller(true);
    try {
      const result = await createChat({ seller_company_id: companyId });
      navigate(`/chat?thread=${result.thread_id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setContactingSeller(false);
    }
  };

  const handleCheckout = async () => {
    if (!contactName.trim() || !contactPhone.trim() || selectedItems.length === 0) return;
    setSending(true);
    try {
      await checkoutRfq({
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim() || undefined,
        deliveryMethod,
        deliveryAddress: deliveryMethod === "DELIVERY" ? deliveryAddress.trim() || undefined : undefined,
        comment: comment.trim() || undefined,
        cartItemIds: selectedItems.map((i) => i.id),
      });
      setSuccess(true);
      setShowForm(false);
      setContactName(""); setContactPhone(""); setContactEmail(""); setDeliveryMethod("DELIVERY"); setDeliveryAddress(""); setComment("");
      await Promise.all(selectedItems.map((item) => removeFromCart(item.id)));
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  if (cartLoading) {
    return (
      <AppShell>
        <div className="p-6 sm:p-10">
          <div className="h-8 w-48 bg-ink-200 dark:bg-[#1C1C1C] rounded-xl animate-pulse mb-8" />
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 sm:p-10">
        <h1 className="hidden sm:block text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white mb-5 sm:mb-10">{t("cart.title")}</h1>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-2xl bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400 text-sm font-medium text-center"
            >
              {t("cart.requestSent")}
            </motion.div>
          )}
        </AnimatePresence>

        {items.length === 0 ? (
          <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-12 sm:p-16 text-center">
            <p className="text-ink-500 dark:text-ink-400 mb-4">{t("cart.empty")}</p>
            <Link to="/catalog" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              {t("cart.goToCatalog")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 sm:gap-6">
            <div>
              <div className="flex items-center gap-2.5 px-1 sm:px-0 mb-3">
                <Checkbox checked={allSelected} onChange={toggleSelectAll} />
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-sm font-medium text-ink-700 dark:text-ink-200"
                >
                  {t("cart.selectAll")}
                </button>
                <span className="text-xs text-ink-400 dark:text-ink-500">
                  {t("cart.selectedCount", { selected: selectedItems.length, total: items.length })}
                </span>
              </div>
              <div className="sm:dark:bg-[#0D0D0D] sm:bg-white border-[#F0F0F0] sm:p-4 rounded-xl sm:border dark:border-[#1C1C1C] flex flex-col gap-3 sm:gap-4 mb-3">
                {items.map((item, i) => {
                  const isSelected = !deselectedIds.has(item.id);
                  return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-white dark:bg-[#0D0D0D] rounded-2xl border transition-colors overflow-hidden ${isSelected ? "border-ink-100 dark:border-[#1C1C1C]" : "border-ink-100 dark:border-[#1C1C1C] opacity-50"}`}
                  >
                    <div className="sm:hidden p-3 flex flex-col gap-3">
                      <div className="flex gap-3">
                        <Checkbox checked={isSelected} onChange={() => toggleItemSelected(item.id)} className="mt-1 shrink-0" />
                        <div className="w-[127px] h-[122px] flex items-center justify-center bg-[#E2E2E2] dark:bg-[#2A2A2A] rounded-xl overflow-hidden shrink-0">
                          {item.primaryImage
                            ? <img src={item.primaryImage} alt={item.productName} className="w-full h-full object-cover" />
                            : <ProductThumb width="22" height="7" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900 dark:text-white text-sm mb-1 truncate">{item.productName}</p>
                          <p className="text-xs text-ink-400 dark:text-[#7F7F7F]"><span translate="no" className="notranslate">{item.companyName}</span></p>
                          <p className="text-xs text-ink-400 dark:text-white my-3">{t("common.quantity")}</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              className="p-2 rounded-lg border border-ink-200 dark:border-[#1C1C1C] flex items-center justify-center text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717]"
                            >
                              <Minus size={20} />
                            </button>
                            <QuantityInput
                              key={item.quantity}
                              item={item}
                              updateQty={updateQty}
                              className="w-16 py-2 rounded-xl border dark:border-[#2D2D2D] text-center font-medium text-sm dark:text-white bg-transparent outline-none focus:border-brand-400"
                            />
                            <button
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="p-2 rounded-lg border border-ink-200 dark:border-[#1C1C1C] flex items-center justify-center text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717]"
                            >
                              <Add size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="font-bold text-xl text-[#155DFC] dark:text-[#2E6FFC]">
                          {(item.price * item.quantity).toLocaleString()} {item.currency}
                        </p>
                        <p className="text-xs text-ink-400 dark:text-ink-500">
                          {item.price?.toLocaleString()} {item.currency}/{item.unit ?? t("product.unitFallback")}
                        </p>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-full flex items-center justify-center gap-2 bg-danger-50 dark:bg-danger-500/10 text-danger-600 dark:text-danger-400 font-medium py-3 rounded-2xl hover:bg-danger-100 dark:hover:bg-danger-500/20 transition-colors"
                      >
                        <Trash size={20} /> {t("cart.remove")}
                      </button>
                    </div>

                    <div className="hidden sm:flex items-start gap-4 p-5">
                      <Checkbox checked={isSelected} onChange={() => toggleItemSelected(item.id)} className="mt-1 shrink-0" />
                      <div className="w-[127px] h-[122px] flex items-center justify-center bg-[#E2E2E2] dark:bg-[#2A2A2A] rounded-sm overflow-hidden shrink-0">
                        {item.primaryImage
                          ? <img src={item.primaryImage} alt={item.productName} className="w-full h-full object-cover" />
                          : <ProductThumb width="22" height="7" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink-900 dark:text-white text-sm mb-1.5 truncate">{item.productName}</p>
                        <p className="text-xs text-ink-400 dark:text-[#7F7F7F] mb-3"><span translate="no" className="notranslate">{item.companyName}</span></p>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <p className="text-xs text-ink-400 dark:text-white mb-2">{t("common.quantity")}</p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQty(item.id, item.quantity - 1)}
                                className="p-2 rounded-lg border border-ink-200 dark:border-[#1C1C1C] flex items-center justify-center text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717]"
                              >
                                <Minus size={20} />
                              </button>
                              <QuantityInput
                                key={item.quantity}
                                item={item}
                                updateQty={updateQty}
                                className="w-[127px] py-2 rounded-xl border dark:border-[#2D2D2D] text-center font-medium text-sm dark:text-white bg-transparent outline-none focus:border-brand-400"
                              />
                              <button
                                onClick={() => updateQty(item.id, item.quantity + 1)}
                                className="p-2 rounded-lg border border-ink-200 dark:border-[#1C1C1C] flex items-center justify-center text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717]"
                              >
                                <Add size={20} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between gap-12">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-ink-300 dark:text-[#CDD1D6] hover:text-danger-500 dark:hover:text-danger-500 transition-colors shrink-0"
                        >
                          <Trash size={24} />
                        </button>
                        <div className="text-right">
                          <p className="font-bold text-2xl text-[#155DFC] dark:text-[#2E6FFC]">
                            {(item.price * item.quantity).toLocaleString()} {item.currency}
                          </p>
                          <p className="text-xs text-ink-400 dark:text-ink-500">
                            {item.price?.toLocaleString()} {item.currency}/{item.unit ?? t("product.unitFallback")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  );
                })}
              </div>
              <Link to="/catalog" className="text-brand-600 dark:text-brand-400 font-medium text-sm flex items-center gap-1.5">
                {t("cart.addMore")}
              </Link>
            </div>

            <div className="flex flex-col gap-4 h-fit">
              <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors">
                <p className="font-semibold text-xl text-black dark:text-white mb-4">{t("cart.summary")}</p>
                {selectedItems.length === 0 ? (
                  <p className="text-sm text-ink-400 dark:text-ink-500 py-2">{t("cart.noneSelected")}</p>
                ) : (
                  selectedItems.map((item) => (
                    <div key={item.id} className="flex justify-between mb-4 text-sm py-2 last:border-0">
                      <span className="text-ink-600 dark:text-[#7F7F7F] text-sm truncate pr-2">{item.productName}</span>
                      <span className="font-medium text-ink-900 dark:text-white shrink-0">
                        {(item.price * item.quantity).toLocaleString()} {item.currency}
                      </span>
                    </div>
                  ))
                )}
                <div className="flex justify-between border-t border-[#DFDFDF] dark:border-[#2D2D2D] items-center pt-4 mt-2">
                  <span className="font-semibold text-black dark:text-white">{t("cart.summary")}</span>
                  <span className="font-bold text-[#155DFC] dark:text-[#2E6FFC] text-lg">
                    {selectedTotal.toLocaleString()} {currency}
                  </span>
                </div>
                <p className="text-xs text-[#7F7F7F] mt-1">{t("cart.summaryNote")}</p>
              </div>

              <button
                onClick={() => setShowForm(true)}
                disabled={selectedItems.length === 0}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white dark:text-[#0D0D0D] font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors"
              >
                <ShoppingCart size={20} /> {t("cart.sendRequest")}
              </button>

              <button
                onClick={handleContactSeller}
                disabled={contactingSeller || selectedItems.length === 0}
                className="w-full border border-ink-200 dark:border-[#1C1C1C] hover:border-brand-400 disabled:opacity-50 font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 text-ink-700 dark:text-ink-200 transition-colors"
              >
                <Message size={18} /> {t("common.writeToSeller")}
              </button>
              {isMultiSeller && (
                <p className="text-xs text-ink-400 dark:text-ink-500 -mt-2 text-center">{t("cart.multiSellerContactHint")}</p>
              )}

              <div className="bg-[#FFFFFF] border border-[#F0F0F0] dark:border-[#1C1C1C] dark:bg-[#0D0D0D] rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <ShieldTick size={24} variant="Outline" className="text-success-600 dark:text-success-400 shrink-0" />
                  <p className="text-sm font-semibold text-[#7F7F7F]">{t("cart.safeDeal")}</p>
                </div>
                <p className="text-xs text-[#7F7F7F] leading-relaxed">
                  {t("cart.safeDealDesc")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0D0D0D] rounded-t-xl sm:rounded-3xl w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-7 relative transition-colors"
            >
              <div className="relative mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl text-center font-display font-bold text-ink-900 dark:text-white">
                  {t("cart.contactDetails")}
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                <Field label={t("cart.nameLabel")} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder={t("cart.namePlaceholder")} />
                <Field
                  label={t("cart.phoneLabel")}
                  inputMode="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value.replace(/[^\d+\s\-()]/g, ""))}
                  placeholder={t("cart.phonePlaceholder")}
                />
                <Field label={t("cart.emailLabel")} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@mail.com" />
                <div>
                  <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{t("cart.deliveryMethodLabel")}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("DELIVERY")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${deliveryMethod === "DELIVERY"
                        ? "bg-brand-600 text-white"
                        : "bg-ink-50 text-ink-600 dark:bg-[#171717] dark:text-ink-300"
                        }`}
                    >
                      <Truck size={16} /> {t("cart.deliveryMethodDelivery")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("PICKUP")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${deliveryMethod === "PICKUP"
                        ? "bg-brand-600 text-white"
                        : "bg-ink-50 text-ink-600 dark:bg-[#171717] dark:text-ink-300"
                        }`}
                    >
                      <Shop size={16} /> {t("cart.deliveryMethodPickup")}
                    </button>
                  </div>
                </div>
                {deliveryMethod === "DELIVERY" && (
                  <Field
                    label={t("cart.addressLabel")}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={t("cart.addressPlaceholder")}
                  />
                )}
                <div>
                  <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{t("cart.commentLabel")}</label>
                  <textarea
                    placeholder={t("cart.commentPlaceholder")}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none placeholder:text-ink-400 dark:text-white resize-none"
                  />
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={sending || !contactName.trim() || !contactPhone.trim()}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors mt-1"
                >
                  {sending ? t("cart.sending") : t("cart.submit")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function Checkbox({ checked, onChange, className = "" }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={`flex items-center justify-center w-5 h-5 rounded-md border transition-colors shrink-0 ${checked
        ? "bg-brand-600 border-brand-600"
        : "border-ink-300 dark:border-ink-600 bg-transparent"
        } ${className}`}
    >
      {checked && <TickCircle size={14} variant="Bold" className="text-white" />}
    </button>
  );
}

function QuantityInput({ item, updateQty, className }) {
  const [value, setValue] = useState(String(item.quantity));

  const commit = () => {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setValue(String(item.quantity));
      return;
    }
    if (parsed !== item.quantity) updateQty(item.id, parsed);
    else setValue(String(parsed));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.target.blur();
      }}
      className={className}
    />
  );
}

function Field({ label, placeholder, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{label}</label>
      <input
        placeholder={placeholder}
        className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none placeholder:text-ink-400 dark:text-white"
        {...props}
      />
    </div>
  );
}
