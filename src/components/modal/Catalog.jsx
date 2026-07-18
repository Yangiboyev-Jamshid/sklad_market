import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight2, ArrowLeft2, CloseCircle, Box } from 'iconsax-reactjs';
import { useNavigate } from 'react-router-dom';
import { getCategoryTree } from '../../api/api';
import logo from '../../assets/logo.png';

function CategoryIcon({ src }) {
  const [errored, setErrored] = useState(false);
  return (
    <span
      className="w-6 h-6 shrink-0 rounded-lg bg-ink-50 dark:bg-[#171717] border border-gray-100 dark:border-[#232323] flex items-center justify-center overflow-hidden"
    >
      {src && !errored ? (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover scale-[1.3]"
          onError={() => setErrored(true)}
        />
      ) : (
        <Box size={14} className="text-ink-300 dark:text-ink-600" variant="Bulk" />
      )}
    </span>
  );
}

export default function Catalog({ isOpen, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [parents, setParents] = useState([]);
  const [childMap, setChildMap] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileParent, setMobileParent] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getCategoryTree()
      .then((data) => {
        const topLevel = [...(data ?? [])];
        topLevel.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        const children = {};
        topLevel.forEach((c) => {
          children[c.id] = [...(c.children ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        });
        setParents(topLevel);
        setChildMap(children);
        if (topLevel.length) setActiveId(topLevel[0].id);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const catName = (c) => c?.name ?? c?.slug ?? "";

  const goToCategory = (cat) => {
    navigate(`/catalog?category=${cat.id}`);
    handleClose();
  };

  const handleClose = () => {
    setMobileParent(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            onClick={handleClose}
          />
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="hidden md:flex absolute top-full p-[18.25px] left-0 right-0 z-50 mt-6 gap-4 bg-white dark:bg-[#0D0D0D] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#1C1C1C] overflow-hidden"
          >
            {loading ? (
              <div className="flex gap-4 w-full">
                <div className="w-64 shrink-0 flex flex-col gap-2 py-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
                  ))}
                </div>
                <div className="flex-1 flex flex-col gap-3 p-8">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-5 rounded-lg bg-ink-100 dark:bg-[#171717] animate-pulse" />
                  ))}
                </div>
              </div>
            ) : parents.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-16 text-sm text-ink-400">
                {t("catalogModal.categoriesNotFound")}
              </div>
            ) : (
              <>
                <div className="w-64 shrink-0 border-r border-gray-100 pr-4 dark:border-[#1C1C1C] py-4 overflow-y-auto max-h-[60vh]">
                  <ul className="flex flex-col">
                    {parents.map((cat) => (
                      <li key={cat.id}>
                        <button
                          onClick={() => setActiveId(cat.id)}
                          className={`w-full flex items-center rounded-xl justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${activeId === cat.id
                              ? 'bg-[#F5F5F5] dark:bg-[#171717] dark:text-white'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-ink-200'
                            }`}
                        >
                          <span className="flex items-center gap-2.5 font-medium min-w-0">
                            <CategoryIcon src={cat.iconUrl} />
                            <span className="truncate">{catName(cat)}</span>
                          </span>
                          <ArrowRight2 size={18} className={`shrink-0 ${activeId === cat.id ? 'dark:text-white' : ''}`} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex-1 min-w-[320px] p-8 overflow-y-auto max-h-[60vh]">
                  {parents.map((cat) => {
                    if (cat.id !== activeId) return null;
                    const subs = childMap[cat.id] ?? [];
                    return (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <CategoryIcon src={cat.iconUrl} />
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{catName(cat)}</h2>
                          </div>
                          <button
                            onClick={() => goToCategory(cat)}
                            className="text-xs text-brand-600 dark:text-blue-400 hover:underline"
                          >
                            {t("catalogModal.allProducts")}
                          </button>
                        </div>
                        {subs.length === 0 ? (
                          <p className="text-sm text-ink-400">{t("catalogModal.subcategoriesEmpty")}</p>
                        ) : (
                          <ul className="grid grid-cols-2 gap-x-12 gap-y-3">
                            {subs.map((sub) => (
                              <li key={sub.id}>
                                <button
                                  onClick={() => goToCategory(sub)}
                                  className="text-gray-500 dark:text-ink-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors text-left"
                                >
                                  {catName(sub)}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>

          <motion.div
            key="panel-mobile"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2 }}
            className="flex md:hidden fixed inset-0 z-[100] bg-white dark:bg-[#0D0D0D] flex-col"
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-ink-100 dark:border-[#1C1C1C] shrink-0">
              {mobileParent ? (
                <button
                  onClick={() => setMobileParent(null)}
                  className="flex items-center gap-2 text-ink-900 dark:text-white"
                >
                  <ArrowLeft2 size={22} />
                  <span className="font-semibold text-base">{catName(mobileParent)}</span>
                </button>
              ) : (
                <span className="flex items-center gap-2 text-black dark:text-white">
                  <img src={logo} alt="" width={25} height={26} className="object-contain shrink-0" />
                  <span className="font-extrabold tracking-tight">SKLAD-MARKET</span>
                </span>
              )}
              <button onClick={handleClose} className="text-ink-400" aria-label={t("common.close")}>
                <CloseCircle size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5">
              {loading ? (
                <div className="flex flex-col gap-2 py-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
                  ))}
                </div>
              ) : parents.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-sm text-ink-400">
                  {t("catalogModal.categoriesNotFound")}
                </div>
              ) : !mobileParent ? (
                <ul className="flex flex-col divide-y divide-ink-100 dark:divide-[#1C1C1C]">
                  {parents.map((cat) => {
                    const hasChildren = (childMap[cat.id] ?? []).length > 0;
                    return (
                      <li key={cat.id}>
                        <button
                          onClick={() => (hasChildren ? setMobileParent(cat) : goToCategory(cat))}
                          className="w-full flex items-center justify-between py-4 text-left text-[15px] font-medium text-ink-700 dark:text-ink-200"
                        >
                          <span className="flex items-center gap-3">
                            <CategoryIcon src={cat.iconUrl} />
                            {catName(cat)}
                          </span>
                          <ArrowRight2 size={18} className="text-ink-300 dark:text-ink-600 shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <>
                  <button
                    onClick={() => goToCategory(mobileParent)}
                    className="w-full text-left py-4 text-sm text-brand-600 dark:text-blue-400 font-semibold"
                  >
                    {t("catalogModal.allProductsIn", { name: catName(mobileParent) })}
                  </button>
                  {(childMap[mobileParent.id] ?? []).length === 0 ? (
                    <p className="text-sm text-ink-400 py-4">{t("catalogModal.subcategoriesEmpty")}</p>
                  ) : (
                    <ul className="flex flex-col divide-y divide-ink-100 dark:divide-[#1C1C1C]">
                      {(childMap[mobileParent.id] ?? []).map((sub) => (
                        <li key={sub.id}>
                          <button
                            onClick={() => goToCategory(sub)}
                            className="w-full flex items-center justify-between py-4 text-left text-[15px] text-ink-600 dark:text-ink-300"
                          >
                            {catName(sub)}
                            <ArrowRight2 size={18} className="text-ink-300 dark:text-ink-600 shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
