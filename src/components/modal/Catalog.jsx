import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight2, ArrowLeft2, CloseCircle } from 'iconsax-reactjs';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '../../api/api';

export default function Catalog({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [parents, setParents] = useState([]);
  const [childMap, setChildMap] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileParent, setMobileParent] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getCategories({ page: 0, size: 200 })
      .then((data) => {
        const all = (data?.content ?? []).filter((c) => c.isActive);
        const topLevel = all.filter((c) => !c.parentId || c.parentId === 0);
        const children = {};
        all.forEach((c) => {
          if (c.parentId && c.parentId !== 0) {
            if (!children[c.parentId]) children[c.parentId] = [];
            children[c.parentId].push(c);
          }
        });
        topLevel.sort((a, b) => a.sortOrder - b.sortOrder);
        setParents(topLevel);
        setChildMap(children);
        if (topLevel.length) setActiveId(topLevel[0].id);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const catName = (c) => c.nameRu || c.nameUz || c.nameEn || c.slug;

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
                Категории не найдены
              </div>
            ) : (
              <>
                <div className="w-64 shrink-0 border-r border-gray-100 pr-4 dark:border-[#1C1C1C] py-4 overflow-y-auto max-h-[60vh]">
                  <ul className="flex flex-col">
                    {parents.map((cat) => (
                      <li key={cat.id}>
                        <button
                          onClick={() => setActiveId(cat.id)}
                          className={`w-full flex items-center rounded-xl justify-between px-6 py-3 text-sm transition-colors ${activeId === cat.id
                              ? 'bg-[#F5F5F5] dark:bg-[#171717] dark:text-white'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-ink-200'
                            }`}
                        >
                          <span className="flex items-center gap-2 font-medium">
                            {cat.icon && <span>{cat.icon}</span>}
                            {catName(cat)}
                          </span>
                          <ArrowRight2 size={20} className={activeId === cat.id ? 'dark:text-white' : ''} />
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
                          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{catName(cat)}</h2>
                          <button
                            onClick={() => goToCategory(cat)}
                            className="text-xs text-brand-600 dark:text-blue-400 hover:underline"
                          >
                            Все товары →
                          </button>
                        </div>
                        {subs.length === 0 ? (
                          <p className="text-sm text-ink-400">Подкатегории не добавлены</p>
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

          {/* Mobile full-screen catalog */}
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
                <svg xmlns="http://www.w3.org/2000/svg" width="138" height="26" viewBox="0 0 138 26" fill="none" className="text-black dark:text-white">
                  <path d="M3.35332 6.77102L3.47356 6.79253C3.73702 6.46058 4.08149 5.99575 4.38529 5.71875C4.74584 5.98115 5.68478 6.564 5.64608 7.02236L5.70335 7.10789C3.6648 9.54679 3.1448 12.9146 4.35281 15.855C6.15218 20.2346 11.1635 22.3222 15.5389 20.5149L15.3427 20.8237C16.2949 20.6026 17.078 19.8489 17.8674 19.4862C18.4066 19.2385 19.1484 20.6274 19.962 20.6501C20.0436 20.3877 19.7886 20.142 19.8407 19.6394L19.9578 19.611L20.1882 19.5491C20.493 20.1334 20.9644 21.1572 21.2175 21.79C20.5247 22.2685 19.2411 23.1088 18.6393 23.6327L18.3883 23.614C17.9193 23.2755 16.9481 22.5294 16.6103 22.091C16.2247 22.3366 14.8567 22.8457 14.452 22.7731C14.2602 23.5204 13.9652 24.5397 13.8208 25.2748C13.2526 25.2822 12.5976 25.3066 12.0365 25.2812L10.8085 25.2194C10.5766 24.6173 10.2939 23.4672 10.1756 22.8327C9.39908 22.6716 8.65674 22.3762 7.90964 22.1058C7.30603 22.595 6.72029 23.1257 6.1374 23.6408C5.29823 23.0628 4.2001 22.3481 3.4429 21.7019C3.69737 21.0019 4.05187 20.1981 4.34029 19.5004C3.81493 18.7405 3.30192 17.9718 2.80162 17.1951C2.29855 17.2193 1.70849 17.2578 1.20628 17.2382C0.886681 17.2258 0.863789 17.1331 0.703815 16.9267L0.781039 16.8404C0.421875 16.1267 0.318825 14.8356 0 13.9505C0.256719 13.8144 1.24458 13.2767 1.49724 13.1332C1.55482 12.6725 1.82306 10.9967 1.84275 10.3115C1.53162 10.0875 0.234778 9.25338 0.240479 8.88601L0.484672 8.95772C0.850574 8.73541 1.13122 7.6059 1.30406 7.11256C1.76921 7.13908 2.88722 7.34567 3.20708 7.09718L3.22859 6.80221L3.35332 6.77102Z" fill="currentColor" />
                  <path d="M4.35173 15.8516C6.15109 20.2312 11.1624 22.3188 15.5378 20.5115L15.3416 20.8204C11.5944 21.9248 8.16484 21.2775 5.56458 18.1695C5.12214 17.6407 4.28211 16.546 4.35173 15.8516Z" fill="currentColor" />
                  <path d="M1.83322 10.3438L1.9843 10.3837C2.0718 10.7666 1.84134 12.7948 1.86648 13.5166L0.491755 14.2452C0.630135 14.8132 1.10271 16.3736 0.931079 16.7851L0.781039 16.8399C0.421875 16.1262 0.318825 14.8351 0 13.95C0.256719 13.8139 0.511448 13.6742 0.764107 13.5307L1.51578 13.1435C1.49254 12.0243 1.61624 11.4194 1.83322 10.3438Z" fill="currentColor" />
                  <path d="M19.957 19.6088L20.1874 19.5469C20.4922 20.1312 20.9636 21.155 21.2168 21.7878C20.5239 22.2663 19.2403 23.1066 18.6385 23.6305L18.4453 23.167C18.717 22.891 19.9404 22.0549 20.3058 21.7983C20.2653 21.1296 19.8675 19.9484 19.957 19.6088Z" fill="currentColor" />
                  <path d="M13.2647 24.8949C13.5322 24.2651 13.5895 23.4356 13.965 22.8771C14.0664 22.7263 14.2429 22.7731 14.4507 22.7706C14.2589 23.5179 13.9638 24.5372 13.8195 25.2723C13.2513 25.2797 12.5963 25.3041 12.0352 25.2787C12.351 24.9544 12.8071 24.9579 13.2647 24.8949Z" fill="currentColor" />
                  <path d="M4.3388 19.5L4.54378 19.5779C4.69096 20.0222 4.25553 20.9547 4.04882 21.3779C3.88064 21.7222 3.82363 21.7062 3.44141 21.7015C3.69588 21.0015 4.05038 20.1977 4.3388 19.5Z" fill="currentColor" />
                  <path d="M16.6094 22.0842C17.0338 21.9467 18.0513 22.8673 18.4452 23.1625L18.6384 23.6259L18.3874 23.6073C17.9184 23.2688 16.9472 22.5226 16.6094 22.0842Z" fill="currentColor" />
                  <path d="M19.9776 13.6328C20.0038 13.9477 20.0387 14.1355 19.9505 14.4448C19.8081 14.5777 19.7707 14.5987 19.5889 14.685C17.3878 15.731 15.1905 16.7659 12.9697 17.7723C12.1004 18.1663 11.101 18.6473 10.1905 18.9599C9.97414 19.0341 9.82998 18.9387 9.5971 18.8601L9.51953 18.7703C9.92292 18.2328 18.7161 14.223 19.9776 13.6328Z" fill="currentColor" />
                  <path d="M9.73218 16.6406C10.1536 16.6743 10.3242 16.8011 10.6822 17.0093C9.9267 17.3803 9.29268 17.6538 8.67818 18.2445L7.51172 17.683C8.2773 17.3545 8.98405 17.0079 9.73218 16.6406Z" fill="currentColor" />
                  <path d="M8.2378 15.7969C8.50177 15.9019 8.58409 15.8822 8.72359 16.0879C8.51878 16.4701 7.17153 16.977 6.60946 17.2686C6.36441 17.2769 6.1482 17.2462 6.08203 16.9967C6.33702 16.5871 7.75036 16.0195 8.2378 15.7969Z" fill="currentColor" />
                  <path d="M15.7576 17.1136C16.0673 17.0767 16.3532 17.2843 16.4142 17.5902C16.4753 17.8961 16.2908 18.1975 15.9908 18.2824C15.7745 18.3436 15.5422 18.2782 15.3896 18.1133C15.2369 17.9482 15.1896 17.7116 15.2673 17.5006C15.345 17.2896 15.5344 17.1401 15.7576 17.1136Z" fill="currentColor" />
                  <path d="M13.4467 18.1449C13.6397 18.0655 13.8605 18.0967 14.0238 18.2265C14.1872 18.3561 14.2677 18.5642 14.2341 18.7701C14.2005 18.9761 14.0583 19.1477 13.8621 19.2189C13.5677 19.3258 13.2418 19.1775 13.1288 18.8853C13.0158 18.593 13.157 18.264 13.4467 18.1449Z" fill="currentColor" />
                  <path d="M6.96239 14.9297C7.13506 15.0324 7.19242 15.0494 7.29935 15.2235C7.10526 15.6306 5.87202 15.9323 5.42631 16.0771L5.19542 16.1245L5.12891 16.0443C5.34278 15.6396 6.52859 15.1334 6.96239 14.9297Z" fill="currentColor" />
                  <path d="M11.2129 19.0949C11.5037 19.0427 11.7859 19.2227 11.8613 19.5085C11.9366 19.7942 11.7799 20.09 11.5012 20.1881C11.2998 20.2589 11.0757 20.2106 10.9214 20.0631C10.7671 19.9156 10.7086 19.694 10.7702 19.4896C10.8317 19.2852 11.0028 19.1326 11.2129 19.0949Z" fill="currentColor" />
                  <path d="M17.8224 16.0775C18.0152 16.0019 18.234 16.0395 18.3905 16.1752C18.547 16.3109 18.6153 16.5221 18.5679 16.7237C18.5204 16.9254 18.365 17.084 18.1645 17.1356C17.8793 17.2089 17.5864 17.0476 17.4959 16.7675C17.4053 16.4873 17.5484 16.185 17.8224 16.0775Z" fill="currentColor" />
                  <path d="M5.69026 13.7045C5.92582 13.7025 5.83857 13.6589 5.98257 13.7811C5.77345 13.9824 5.28843 14.1545 5.00148 14.2753C4.96399 14.2842 4.78924 14.2891 4.73906 14.2916L4.73828 14.1884C5.04786 13.9316 5.31693 13.8508 5.69026 13.7045Z" fill="currentColor" />
                  <path d="M13.7021 0.25C13.9004 0.886337 14.0851 1.52673 14.2561 2.17093L16.5031 2.90983C17.0007 2.40931 17.5952 1.78334 18.1135 1.323C18.8164 1.72485 19.9185 2.31583 20.5166 2.80131C20.2894 3.42348 19.9461 4.28972 19.7603 4.91077C20.2483 5.45811 20.8254 6.07432 21.2555 6.65337L23.3837 6.30587C23.83 7.15466 24.1535 8.11906 24.454 9.03136L22.796 10.2223C22.9934 11.277 23.1013 12.0307 23.1061 13.1141L24.0007 13.6063L24.6145 13.9926C24.4124 14.9678 23.9566 16.3953 23.8153 17.2239C23.1097 17.2555 22.4035 17.2695 21.6973 17.266C21.2008 18.1628 20.7613 18.7123 20.1864 19.546L19.956 19.608L19.839 19.6363C19.7868 20.1389 20.0418 20.3846 19.9603 20.647C19.1467 20.6244 18.4048 19.2354 17.8657 19.4831C17.0762 19.8458 16.2931 20.5996 15.341 20.8207L15.5371 20.5118C18.8242 19.154 20.9298 15.9048 20.8267 12.349C20.7237 8.79333 18.4335 5.6716 15.0733 4.5065C11.7131 3.34148 7.98269 4.37569 5.70159 7.10481L5.64432 7.01927C5.68302 6.56092 4.74408 5.97807 4.38353 5.71567C4.07974 5.99267 3.73526 6.4575 3.4718 6.78945L3.35156 6.76794C3.50877 6.35961 4.31996 5.52499 4.65217 5.0592L4.72499 5.02732C4.86484 4.62815 4.46438 3.61658 4.32099 3.17611C4.9253 2.76346 5.59586 2.37786 6.22539 1.99986C6.72199 2.40853 7.35592 3.03519 7.99616 2.97765C8.25366 2.94119 9.88432 2.3763 10.2343 2.26027C10.4108 1.63793 10.595 0.912685 10.8364 0.321276C11.0718 0.578057 13.2433 0.51179 13.6309 0.433252L13.7021 0.25Z" fill="currentColor" />
                  <path d="M3.78125 2.98078C4.62569 2.4597 5.39084 1.93067 6.26586 1.4375C6.96216 1.91668 7.4318 2.34548 7.9962 2.97395C7.35596 3.03149 6.72202 2.40484 6.22543 1.99616C5.5959 2.37416 4.92534 2.75976 4.32103 3.17241C4.46442 3.61288 4.86487 4.62445 4.72503 5.02362L4.65221 5.05551L3.78125 2.98078Z" fill="currentColor" />
                  <path d="M1.0849 6.61719C1.78319 6.6597 2.52942 6.73729 3.2303 6.79794L3.20879 7.09291C2.88893 7.3414 1.77092 7.13481 1.30577 7.10829C1.13293 7.60163 0.852282 8.73114 0.486381 8.95345L0.242188 8.88174L1.0849 6.61719Z" fill="currentColor" />
                  <path d="M10.8398 0.320754L10.8953 0.146055C11.1925 -0.0676987 12.7244 0.0110135 13.1504 0.0289847C13.5296 0.0449687 13.5109 0.0229369 13.7056 0.249478L13.6344 0.43273C13.2467 0.511268 11.0752 0.577535 10.8398 0.320754Z" fill="currentColor" />
                  <path d="M6.69449 10.4746L7.71538 9L12.3355 11.3761L11.0225 12.9278C10.9416 13.0235 10.8045 13.0491 10.6945 12.9891L6.78514 10.8567C6.64741 10.7815 6.60519 10.6036 6.69449 10.4746Z" fill="#DCDBDC" stroke="#464646" strokeWidth="0.363972" strokeLinecap="round" />
                  <path d="M13.5201 12.9015L12.3359 11.3621L17.0881 9.25L17.9651 10.4559C18.0596 10.5858 18.0171 10.7693 17.8751 10.8445L13.8529 12.9739C13.7392 13.0341 13.5986 13.0035 13.5201 12.9015Z" fill="#DCDBDC" stroke="#464646" strokeWidth="0.363972" strokeLinecap="round" />
                  <path d="M7.58329 14.1034L7.57422 11.2734L10.7884 12.9698C10.8248 12.989 10.8694 12.9815 10.8974 12.9514L12.1886 11.5678C12.2413 11.5113 12.336 11.5486 12.336 11.6259V16.4284C12.336 16.5266 12.2327 16.5904 12.1449 16.5465L7.72923 14.3387C7.64006 14.2941 7.58361 14.2031 7.58329 14.1034Z" fill="#0088FF" stroke="#464646" strokeWidth="0.363972" strokeLinecap="round" />
                  <path d="M16.9421 14.3389L12.4676 16.5762C12.4071 16.6064 12.3359 16.5624 12.3359 16.4948V11.7002C12.3359 11.6158 12.4407 11.5769 12.4958 11.6407L13.6242 12.9484C13.6515 12.9801 13.6969 12.9891 13.7342 12.9702L17.0881 11.2734V14.1028C17.0881 14.2028 17.0316 14.2942 16.9421 14.3389Z" fill="#0088FF" stroke="#464646" strokeWidth="0.363972" strokeLinecap="round" />
                  <path d="M17.0363 9.18291L12.3047 7.22656" stroke="#464646" strokeWidth="0.363972" strokeLinecap="round" />
                  <path d="M7.75503 8.90994L12.3047 7.22656" stroke="#464646" strokeWidth="0.363972" strokeLinecap="round" />
                  <path d="M16.4439 13.771V13.4285C16.4439 13.3608 16.3728 13.3168 16.3123 13.3471L15.6753 13.6656C15.6445 13.681 15.625 13.7125 15.625 13.747V14.0894C15.625 14.1571 15.6962 14.2011 15.7567 14.1708L16.3936 13.8524C16.4245 13.8369 16.4439 13.8054 16.4439 13.771Z" stroke="#464646" strokeWidth="0.181986" strokeLinecap="round" />
                  <path d="M12.3516 11.1838V7.45312L16.6282 9.22749L12.3516 11.1838Z" fill="#898989" stroke="#464646" strokeWidth="0.0909931" strokeLinecap="round" />
                  <path d="M12.2617 11.1838V7.45312L8.07604 9.00001L12.2617 11.1838Z" fill="#D9D9D9" stroke="#464646" strokeWidth="0.0909931" strokeLinecap="round" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M102.016 4.1505C108.555 4.13355 118.306 2.59782 118.554 11.9503C118.638 15.1274 118.461 16.9259 116.206 19.3204C112.889 22.2006 106.458 21.4421 102 21.4161L102.016 4.1505ZM105.821 7.19347L105.813 18.3566C108.624 18.4016 111.191 18.8444 113.394 17.0597C115.098 14.738 115.364 10.1025 112.92 8.18663C111.296 6.91394 107.848 7.18167 105.821 7.19347Z" fill="currentColor" />
                  <path d="M93.2979 4.14648C95.2248 9.55606 97.9882 16.0047 100.161 21.4316C98.8457 21.4008 97.4625 21.4232 96.1426 21.4248C95.6977 20.2208 95.2868 18.631 94.6533 17.5049C94.4913 17.218 94.2788 17.2835 93.9385 17.2617C91.5918 17.2373 89.2461 17.2509 86.8994 17.3027C86.3941 18.6662 85.8833 20.0269 85.3633 21.3848C84.0875 21.4184 82.7465 21.4027 81.4648 21.4072L87.9736 4.11719L93.2979 4.14648ZM90.5322 6.98828C89.7794 8.6351 88.3906 12.5943 87.8633 14.3779L91.0244 14.3418L93.5957 14.3857C93.1109 13.0822 91.2997 7.71365 90.5322 6.98828Z" fill="currentColor" />
                  <path d="M51.3415 4.11896L55.1132 4.11719C55.1462 5.59116 54.8942 10.2566 55.3416 11.2527C57.1499 11.6188 60.4739 5.73851 61.7232 4.14696L65.8672 4.18939C63.821 6.86075 61.8234 9.56792 59.8729 12.3097L63.765 17.8285C64.6047 19.0107 65.4326 20.2016 66.2473 21.4011L61.8911 21.4301C60.3752 19.112 58.6634 16.7328 57.0688 14.4559L55.1539 14.4223C55.1215 16.7394 55.1377 19.1018 55.1307 21.4229L51.3398 21.4275L51.3415 4.11896Z" fill="currentColor" />
                  <path d="M40.5278 3.70386C43.4718 3.49933 45.2744 3.77209 47.9891 4.79928C47.8993 6.00286 47.82 6.78796 47.6122 7.98108C45.5888 7.19598 38.76 5.113 38.3031 8.63754C39.0666 11.415 48.4925 10.1824 48.8284 15.2397C49.1345 19.8459 46.7047 21.0393 42.6716 21.6195C39.6133 21.6702 37.531 21.7334 34.6172 20.5375C34.7742 19.4479 34.8927 18.3089 35.0223 17.2118C36.7514 18.0092 44.7993 20.6176 45.1287 16.1677C45.2368 14.7067 41.9889 14.187 40.7182 13.9206C38.429 13.4408 34.9694 12.7095 34.6562 9.73339C34.3062 5.74396 36.8563 4.0967 40.5278 3.70386Z" fill="currentColor" />
                  <path d="M68.3817 4.13767L72.0956 4.125L72.1 18.3429L79.7914 18.3566C79.8017 19.0726 79.924 20.9854 79.5631 21.4118C75.8124 21.4434 72.0617 21.4337 68.3125 21.3827C68.3449 15.6537 68.2919 9.85054 68.3817 4.13767Z" fill="currentColor" />
                  <path d="M132.383 4.10938L136.857 4.16861C136.015 5.37366 132.388 10.8362 131.594 11.4951C130.58 11.2832 125.44 11.1714 124.571 11.4968C122.974 9.53932 120.856 6.26559 119.273 4.11674C120.854 4.13148 122.436 4.13826 124.019 4.13693L128.161 10.1002C129.597 8.124 131.006 6.12693 132.383 4.10938Z" fill="currentColor" />
                  <path d="M124.571 11.4934C125.44 11.1681 130.58 11.2799 131.594 11.4918C129.391 14.7514 126.787 18.2112 124.471 21.4502C122.967 21.3997 121.461 21.3839 119.957 21.403C121.863 18.6536 123.859 15.9859 125.754 13.2068L124.571 11.4934Z" fill="#0088FF" />
                  <path d="M131.706 13.9062C132.302 14.329 136.626 20.4162 137.391 21.4453L135.333 21.4382C134.385 21.4498 133.39 21.4207 132.438 21.4084C131.408 19.9854 130.375 18.5175 129.262 17.1629C129.788 16.2842 131.034 14.7605 131.706 13.9062Z" fill="#0088FF" />
                </svg>
              )}
              <button onClick={handleClose} className="text-ink-400" aria-label="Закрыть">
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
                  Категории не найдены
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
                          <span className="flex items-center gap-2">
                            {cat.icon && <span>{cat.icon}</span>}
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
                    Все товары в «{catName(mobileParent)}» →
                  </button>
                  {(childMap[mobileParent.id] ?? []).length === 0 ? (
                    <p className="text-sm text-ink-400 py-4">Подкатегории не добавлены</p>
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
