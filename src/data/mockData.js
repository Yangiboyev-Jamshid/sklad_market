// Static UI content with no backend counterpart in any of the skladmarket.uz services
// (seller trend chart sample data, tariff plans, AI agent prompt suggestions).
export const trendData = [
  { month: "Март", value: 320 },
  { month: "Апр", value: 540 },
  { month: "Май", value: 480 },
  { month: "Июнь", value: 600 },
  { month: "Июль", value: 700, highlight: true },
  { month: "Авг", value: 350 },
  { month: "Сен", value: 950 },
];

export const tariffPlans = [
  {
    id: "basic",
    name: "Basic",
    price: "Бесплатно",
    features: ["10 товаров", "Базовый поиск"],
  },
  {
    id: "business",
    name: "Business",
    price: "99 000 UZS/мес",
    features: ["100 товаров", "Приоритет в поиске", "Аналитика продаж"],
  },
  {
    id: "premium",
    name: "Premium",
    price: "299 000 UZS/мес",
    features: ["∞ товаров", "Топ в поиске", "Реклама", "AI инструменты"],
    highlight: true,
  },
];

export const aiSuggestions = [
  "Найди поставщиков металла в Ташкенте",
  "Найди поставщиков металла в Ташкенте",
  "Найди поставщиков металла в Ташкенте",
  "Найди поставщиков металла в Ташкенте",
  "Найди поставщиков металла в Ташкенте",
];
