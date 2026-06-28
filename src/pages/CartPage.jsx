import { Minus, Add, Trash, ShoppingCart, ShieldTick, Message } from "iconsax-reactjs";
import { motion } from "framer-motion";
import AppShell from "../components/layout/AppShell";
import ProductThumb from "../components/ui/ProductThumb";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

export default function CartPage() {
  const { items, updateQty, removeFromCart, total } = useCart();

  return (
    <AppShell>
      <div className="p-6 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white mb-5 sm:mb-10">Корзина</h1>

        {items.length === 0 ? (
          <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-12 sm:p-16 text-center">
            <p className="text-ink-500 dark:text-ink-400 mb-4">Ваша корзина пуста</p>
            <Link to="/catalog" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              Перейти в каталог →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 sm:gap-6">
            <div>
              <div className="dark:bg-[#0D0D0D] bg-white border-[#F0F0F0] p-4 rounded-xl border dark:border-[#1C1C1C] flex flex-col gap-3 sm:gap-4 mb-3">
                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-3 sm:p-5 flex gap-3 sm:gap-4 transition-colors"
                  >
                    <div className="w-20 h-20 sm:w-[127px] sm:h-[122px] flex items-center justify-center bg-[#E2E2E2] dark:bg-[#2A2A2A] rounded-sm overflow-hidden shrink-0">
                      <ProductThumb width="22" height="7" />
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900 dark:text-white text-sm sm:text-sm mb-1.5 truncate">{item.name}</p>
                          <p class="text-xs text-ink-400 dark:text-[#7F7F7F] mb-3">{item.company}</p>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-ink-300 dark:text-[#CDD1D6] hover:text-danger-500 dark:hover:text-danger-500 transition-colors shrink-0">
                          <Trash size={24} />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-end justify-between gap-2 mt-auto">
                        <div>
                          <p className="text-xs text-ink-400 dark:text-white mb-3">Количество</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(item.id, item.qty - 1)}
                              className="p-2 rounded-lg border border-ink-200 dark:border-[#1C1C1C] flex items-center justify-center text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717]"
                            >
                              <Minus size={24} />
                            </button>
                            <span className="w-[127px] py-[10px] rounded-xl border dark:border-[#2D2D2D] text-center font-medium text-sm dark:text-white">{item.qty}</span>
                            <button
                              onClick={() => updateQty(item.id, item.qty + 1)}
                              className="p-2 rounded-lg border border-ink-200 dark:border-[#1C1C1C] flex items-center justify-center text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-[#171717]"
                            >
                              <Add size={24} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-2xl text-[#155DFC] dark:text-[#2E6FFC]">${item.pricePerTon * item.qty}</p>
                          <p className="text-xs text-black dark:text-white">${item.pricePerTon}/т</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <button className="text-brand-600 dark:text-brand-400 font-medium text-sm flex items-center gap-1.5 self-start mt-1">
                + Добавить ещё товаров
              </button>
            </div>

            <div className="flex flex-col gap-4 h-fit">
              <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-5 transition-colors">
                <p className="font-semibold text-xl text-black dark:text-white mb-4">Итог</p>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between mb-4 text-sm py-2 last:border-0">
                    <span className="text-ink-600 dark:text-[#7F7F7F] text-sm truncate pr-2">{item.name}</span>
                    <span className="font-medium text-ink-900 dark:text-white shrink-0">${item.pricePerTon * item.qty}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-[#DFDFDF] dark:border-[#2D2D2D] items-center pt-4 mt-2">
                  <span className="font-semibold text-black dark:text-white">Итог</span>
                  <span className="font-bold text-[#155DFC] dark:text-[#2E6FFC] text-lg">${total}</span>
                </div>
                <p className="text-xs text-[#7F7F7F] mt-1">Итоговая цена согласовывается с поставщиком</p>
              </div>

              <button className="w-full bg-brand-600 hover:bg-brand-700 text-white dark:text-[#0D0D0D] font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                <ShoppingCart size={20} /> Отправить запрос
              </button>
              <button className="w-full border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 text-ink-700 dark:text-ink-200 transition-colors">
                <Message size={18} /> Написать продавцу
              </button>

              <div className="bg-[#FFFFFF] border border-[#F0F0F0] dark:border-[#1C1C1C] dark:bg-[#0D0D0D] rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <ShieldTick size={24} variant="Outline" className="text-success-600 dark:text-success-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-[#7F7F7F]">Безопасная сделка</p>
                </div>
                <p className="text-xs text-[#7F7F7F] leading-relaxed">
                  Ваш запрос направляется напрямую поставщику. Цены и условия согласовываются в переписке.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
