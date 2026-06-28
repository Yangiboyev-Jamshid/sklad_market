import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight2 } from 'iconsax-reactjs';

const categories = [
    {
        id: 1, name: 'Материалы', subcategories: [
            {
                title: 'Материалы',
                items: ['Материалы', 'Материалы'],
            },
            {
                title: 'Материалы',
                items: ['Материалы', 'Материалы'],
            },
        ]
    },
    {
        id: 2,
        name: 'Текстиль',
        subcategories: [
            {
                title: 'Текстиль',
                items: ['Текстиль', 'Текстиль'],
            },
            {
                title: 'Текстиль',
                items: ['Текстиль', 'Текстиль'],
            },
        ],
    },
    {
        id: 3, name: 'Строй материалы', subcategories: [
            {
                title: 'Строй материалы',
                items: ['Строй материалы', 'Строй материалы'],
            },
            {
                title: 'Строй материалы',
                items: ['Строй материалы', 'Строй материалы'],
            },
        ]
    },
    {
        id: 4, name: 'Строй материалы', subcategories: [
            {
                title: 'Строй материалы',
                items: ['Строй материалы', 'Строй материалы'],
            },
            {
                title: 'Строй материалы',
                items: ['Строй материалы', 'Строй материалы'],
            },
        ]
    },
    {
        id: 5, name: 'Строй материалы', subcategories: [
            {
                title: 'Строй материалы',
                items: ['Строй материалы', 'Строй материалы'],
            },
            {
                title: 'Строй материалы',
                items: ['Строй материалы', 'Строй материалы'],
            },
        ]
    },
    {
        id: 6, name: 'Материалы', subcategories: [
            {
                title: 'Материалы',
                items: ['Материалы', 'Материалы'],
            },
            {
                title: 'Материалы',
                items: ['Материалы', 'Материалы'],
            },
        ]
    },
    {
        id: 7, name: 'Химическое сырьё', subcategories: [
            {
                title: 'Химическое сырьё',
                items: ['Химическое сырьё', 'Химическое сырьё'],
            },
            {
                title: 'Химическое сырьё',
                items: ['Химическое сырьё', 'Химическое сырьё'],
            },
        ]
    },
    {
        id: 8, name: 'Химическое сырьё', subcategories: [
            {
                title: 'Химическое сырьё',
                items: ['Химическое сырьё', 'Химическое сырьё'],
            },
            {
                title: 'Химическое сырьё',
                items: ['Химическое сырьё', 'Химическое сырьё'],
            },
        ]
    },
    {
        id: 9, name: 'Материалы', subcategories: [
            {
                title: 'Материалы',
                items: ['Материалы', 'Материалы'],
            },
            {
                title: 'Материалы',
                items: ['Материалы', 'Материалы'],
            },
        ]
    },
    {
        id: 10, name: 'Химическое сырьё', subcategories: [
            {
                title: 'Химическое сырьё',
                items: ['Химическое сырьё', 'Химическое сырьё'],
            },
            {
                title: 'Химическое сырьё',
                items: ['Химическое сырьё', 'Химическое сырьё'],
            },
        ]
    },
];

export default function Catalog({ isOpen, onClose }) {
    const [activeCategory, setActiveCategory] = useState(1);

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
                        onClick={onClose}
                    />
                    <motion.div
                        key="panel"
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute top-full p-[18.25px] left-0 right-0 z-50 mt-6 flex gap-4 bg-white dark:bg-[#0D0D0D] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#1C1C1C] overflow-hidden"
                    >
                        <div className="w-64 shrink-0 border-r border-gray-100 pr-4 dark:border-[#1C1C1C] py-4 overflow-y-auto">
                            <ul className="flex flex-col">
                                {categories.map((category) => (
                                    <li key={category.id}>
                                        <button
                                            onClick={() => setActiveCategory(category.id)}
                                            className={`w-full flex items-center rounded-xl justify-between px-6 py-3 text-sm transition-colors ${activeCategory === category.id
                                                ? 'bg-[#F5F5F5] dark:bg-[#171717] dark:text-[#FFFFFF]'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-ink-200'
                                                }`}
                                        >
                                            <span className="font-medium">{category.name}</span>
                                            <ArrowRight2
                                                size={20}
                                                className={`
                                                    ${activeCategory === category.id ? "dark:text-[#FFFFFF]" : ""}
                                                    `}
                                            />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex-1 h-full min-w-[320px] p-8 overflow-y-auto">
                            {categories.map((category) => {
                                if (category.id !== activeCategory) return null;

                                if (category.subcategories.length === 0) {
                                    return (
                                        <motion.div
                                            key={category.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex items-center justify-center h-32 text-gray-400 dark:text-ink-500 text-sm"
                                        >
                                            Подкатегории пока не добавлены
                                        </motion.div>
                                    );
                                }

                                return (
                                    <motion.div
                                        key={category.id}
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <h2 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">
                                            {category.name}
                                        </h2>
                                        <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                            {category.subcategories.map((subGroup, idx) => (
                                                <div key={idx}>
                                                    <h3 className="font-bold text-sm mb-3 text-gray-900 dark:text-white">
                                                        {subGroup.title}
                                                    </h3>
                                                    <ul className="space-y-2.5">
                                                        {subGroup.items.map((item, itemIdx) => (
                                                            <li key={itemIdx}>
                                                                <a
                                                                    href="#"
                                                                    className="text-gray-500 dark:text-ink-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                                                                >
                                                                    {item}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}