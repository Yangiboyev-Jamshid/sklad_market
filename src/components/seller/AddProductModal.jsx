import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloseCircle, ArrowDown2, CloudAdd } from "iconsax-reactjs";
import PillToggle from "../ui/PillToggle";

export default function AddProductModal({ open, onClose }) {
  const [saleType, setSaleType] = useState("wholesale");

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
            className="bg-white dark:bg-[#0D0D0D] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-7 relative transition-colors"
          >
            <button onClick={onClose} className="absolute top-4 right-4 sm:top-5 sm:right-5 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200">
              <CloseCircle size={24} />
            </button>
            <h2 className="text-lg sm:text-xl font-display font-bold text-ink-900 dark:text-white mb-4 sm:mb-5">Добавить товар</h2>

            <PillToggle
              options={[
                { value: "wholesale", label: "Оптом" },
                { value: "retail", label: "За штуку" },
              ]}
              value={saleType}
              onChange={setSaleType}
              className="w-full mb-5"
            />

            <Field label="Название товара" placeholder="Стальной лист" />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">Категория</label>
                <button className="w-full flex items-center justify-between bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm text-ink-400">
                  Меттал <ArrowDown2 size={16} />
                </button>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">Единица</label>
                <button className="w-full flex items-center justify-between bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm text-ink-400">
                  Тонна <ArrowDown2 size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Field label="Цена" placeholder="0" />
              <Field label="Мин.заказ" placeholder="1" />
            </div>

            <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">Описание товара</label>
            <textarea
              placeholder="Описание товара, характеристики ..."
              rows={4}
              className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none placeholder:text-ink-400 dark:text-white mb-4 resize-none"
            />

            <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">Фото товара</label>
            <div className="border-2 border-dashed border-ink-200 dark:border-[#1C1C1C] rounded-xl py-8 sm:py-10 flex flex-col items-center justify-center text-center mb-6 hover:border-brand-300 dark:hover:border-brand-500 transition-colors cursor-pointer">
              <CloudAdd size={28} className="text-ink-300 dark:text-ink-600 mb-2" />
              <p className="text-sm text-ink-400">Нажмите или перетащите файл</p>
              <p className="text-xs text-ink-300 dark:text-ink-600 mt-1">PNG, JPG до 5MB</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={onClose} className="bg-ink-100 dark:bg-[#171717] text-ink-600 dark:text-ink-300 font-medium py-3.5 rounded-xl hover:bg-ink-200 dark:hover:bg-[#1E1E1E] transition-colors">
                Черновик
              </button>
              <button onClick={onClose} className="bg-brand-600 text-white font-semibold py-3.5 rounded-xl hover:bg-brand-700 transition-colors">
                Отправить на модерацию
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, placeholder }) {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{label}</label>
      <input
        placeholder={placeholder}
        className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none placeholder:text-ink-400 dark:text-white"
      />
    </div>
  );
}
