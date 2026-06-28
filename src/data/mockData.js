export const categories = [
  { id: "metals", name: "Металлы", count: 800, icon: "Box" },
  { id: "textile", name: "Текстиль", count: 800, icon: "Shapes" },
  { id: "construction", name: "Строй материалы", count: 800, icon: "Buildings2" },
  { id: "chemicals", name: "Химическое сырьё", count: 800, icon: "Flask" },
];

export const catalogTree = [
  { id: "materials-1", name: "Материалы", children: ["Текстиль", "Текстиль"] },
  { id: "textile-1", name: "Текстиль", children: ["Текстиль", "Текстиль"] },
  { id: "constr-1", name: "Строй материалы", children: [] },
  { id: "constr-2", name: "Строй материалы", children: [] },
  { id: "constr-3", name: "Строй материалы", children: [] },
  { id: "materials-2", name: "Материалы", children: [] },
  { id: "chem-1", name: "Химическое сырьё", children: [] },
  { id: "chem-2", name: "Химическое сырьё", children: [] },
  { id: "materials-3", name: "Материалы", children: [] },
  { id: "chem-3", name: "Химическое сырьё", children: [] },
];

export const companies = [
  {
    id: "uzmetal-pro",
    name: "UzMetal Pro",
    industry: "Металлургия",
    city: "Ташкент",
    since: 2003,
    verified: true,
    rating: 4.8,
    reviews: 127,
    productsCount: 1500,
    description: "Ведущий производитель металлопроката в Центральной Азии. Более 20 лет на рынке.",
    phone: "+998 90 123 45 67",
    email: "info@uzmetall.uz",
    website: "www.uzmetall.uz",
    lat: 41.31,
    lng: 69.28,
  },
  {
    id: "asia-steel-group",
    name: "Asia Steel Group",
    industry: "Металлургия",
    city: "Ташкент",
    since: 2008,
    verified: true,
    rating: 4.7,
    reviews: 98,
    productsCount: 940,
    description: "Поставщик стального и оцинкованного прокат для промышленных и строительных нужд.",
    phone: "+998 90 222 11 33",
    email: "sales@asiasteel.uz",
    website: "www.asiasteel.uz",
    lat: 41.32,
    lng: 69.24,
  },
  {
    id: "tashbuild-supply",
    name: "TashBuild Supply",
    industry: "Строй материалы",
    city: "Ташкент",
    since: 2015,
    verified: true,
    rating: 4.6,
    reviews: 64,
    productsCount: 620,
    description: "Профильные трубы и металлоконструкции под заказ для строительных компаний.",
    phone: "+998 90 555 44 22",
    email: "info@tashbuild.uz",
    website: "www.tashbuild.uz",
    lat: 41.30,
    lng: 69.27,
  }
];

const shapeKinds = ["sheet", "coil", "pipe-square", "pipe-round"];

export const products = [
  {
    id: "p1",
    name: "Листовая сталь 3мм",
    company: "Metal Trade LLC",
    companyId: "metal-trade-llc",
    verified: true,
    price: 520,
    unit: "тонна",
    shape: "sheet",
    category: "Металлы",
    rating: 4.8,
    reviews: 23,
    views: 1240,
    minOrder: 5,
    description:
      "Горячекатаный стальной лист толщиной 3мм. Соответствует ГОСТ 19903-2015. Применяется в машиностроении, строительных конструкциях и изготовлении металлоконструкций.",
    tags: ["Металлы", "Листовой прокат", "Сталь Ст3"],
    specs: {
      "Категория": "Металлы",
      "Материал": "Сталь Ст3",
      "Размеры": "1500 x 6000 мм",
      "Вес": "1000 кг (тонна)",
      "Цвет": "Серый",
      "Минимальный заказ": "5 тонна",
      "Срок производства": "3-5 дней",
      "Наличие": "В наличии",
    },
  },
  {
    id: "p2",
    name: "Оцинкованный рулон",
    company: "Asia Steel Group",
    companyId: "asia-steel-group",
    verified: true,
    price: 610,
    unit: "тонна",
    shape: "coil",
    category: "Металлы",
    rating: 4.7,
    reviews: 31,
    views: 980,
    minOrder: 10,
    description:
      "Оцинкованный рулон горячекатаная диаметром 16 мм, класс А500С, длина прутков 11,7 м. Производство Казахстан.",
    tags: ["Металлы", "Оцинкованный прокат"],
    specs: {
      "Категория": "Металлы",
      "Материал": "Оцинкованная сталь",
      "Размеры": "Рулон 1250 мм",
      "Вес": "тонна",
      "Цвет": "Серебристый",
      "Минимальный заказ": "10 тонна",
      "Срок производства": "5-7 дней",
      "Наличие": "В наличии",
    },
  },
  {
    id: "p3",
    name: "Профильная труба",
    company: "TashBuild Supply",
    companyId: "tashbuild-supply",
    verified: false,
    price: 410,
    unit: "тонна",
    shape: "pipe-square",
    category: "Строй материалы",
    rating: 4.5,
    reviews: 18,
    views: 560,
    minOrder: 3,
    description:
      "Стальная профильная труба квадратного сечения, применяется в каркасном строительстве и производстве мебели.",
    tags: ["Строй материалы", "Профильная труба"],
    specs: {
      "Категория": "Строй материалы",
      "Материал": "Сталь",
      "Размеры": "40x40x2 мм",
      "Вес": "тонна",
      "Цвет": "Чёрный",
      "Минимальный заказ": "3 тонна",
      "Срок производства": "2-4 дня",
      "Наличие": "В наличии",
    },
  },
  {
    id: "p4",
    name: "Профильная труба",
    company: "TashBuild Supply",
    companyId: "tashbuild-supply",
    verified: false,
    price: 410,
    unit: "тонна",
    shape: "pipe-round",
    category: "Строй материалы",
    rating: 4.4,
    reviews: 12,
    views: 410,
    minOrder: 3,
    description:
      "Стальная круглая труба, применяется для несущих конструкций и инженерных сетей.",
    tags: ["Строй материалы", "Круглая труба"],
    specs: {
      "Категория": "Строй материалы",
      "Материал": "Сталь",
      "Размеры": "Ø108 мм",
      "Вес": "тонна",
      "Цвет": "Чёрный",
      "Минимальный заказ": "3 тонна",
      "Срок производства": "2-4 дня",
      "Наличие": "В наличии",
    },
  },
];

export const productGrid = Array.from({ length: 12 }).map((_, i) => {
  const base = products[i % products.length];
  return { ...base, id: `${base.id}-${i}`, shape: shapeKinds[i % shapeKinds.length] };
});

export const banners = [
  {
    id: "b1",
    title: "PRO AQUA",
    subtitle: "Полипропиленовые трубы и фитинги",
    bg: "from-teal-500 to-teal-600",
  },
  {
    id: "b2",
    title: "САМЫЙ ШИРОКИЙ АССОРТИМЕНТ",
    subtitle: "Полипропиленовых труб и фитингов",
    bg: "from-slate-400 to-slate-500",
  },
  {
    id: "b3",
    title: "Фитинги и трубы",
    subtitle: "Для любых инженерных систем",
    bg: "from-orange-400 to-orange-500",
  },
  {
    id: "b4",
    title: "MIDAS",
    subtitle: "Профессиональные инструменты",
    bg: "from-stone-600 to-stone-700",
  },
];

export const reviews = [
  {
    id: "r1",
    author: "Алтын Цемент",
    verified: true,
    industry: "Металлургия Ташкент",
    rating: 5,
    text: "Работаем с компанией уже 3 года. Качество продукции стабильное, документы всегда в порядке, поставки в срок. Рекомендую.",
  },
  {
    id: "r2",
    author: "BuildKaz LLP",
    verified: false,
    industry: "Металлургия Ташкент",
    rating: 5,
    text: "В целом довольны сотрудничеством. Небольшая задержка по последней партии, но предупредили заранее.",
  },
];

export const purchaseRequests = [
  {
    id: "req1",
    company: "Алтын Цемент",
    verified: true,
    item: "Стальной лист 3мм · 50 тонна",
    date: "12 мар 2025",
    status: "new",
  },
  {
    id: "req2",
    company: "Алтын Цемент",
    verified: true,
    item: "Стальной лист 3мм · 50 тонна",
    date: "12 мар 2025",
    status: "processing",
  },
  {
    id: "req3",
    company: "Алтын Цемент",
    verified: true,
    item: "Стальной лист 3мм · 50 тонна",
    date: "12 мар 2025",
    status: "done",
  },
];

export const messages = [
  {
    id: "m1",
    company: "Алтын Цемент",
    time: "10:45",
    preview: "Минимальная партия для экспо...",
    pro: "Стальной лист 3мм",
    unread: true,
  },
  {
    id: "m2",
    company: "Алтын Цемент",
    time: "10:10",
    preview: "Минимальная партия для экспо... Стальной лист 3мм",
    pro: "Стальной лист 3мм",
    unread: false,
  },
  {
    id: "m3",
    company: "Алтын Цемент",
    time: "10:15",
    preview: "Минимальная партия для экспо... Стальной лист 3мм",
    pro: "Стальной лист 3мм",
    unread: false,
  },
];

export const chatThread = [
  {
    id: "c1",
    from: "them",
    text: "Здравствуйте! Интересует стальной лист 3мм. Какова цена за партию от 20 тонн?",
    time: "11:45",
  },
  {
    id: "c2",
    from: "me",
    text: "Добрый день! При заказе от 20 тонн цена составит 820,000 UZS/тонна. Доставка по Ташкенту — бесплатно.",
    time: "11:45",
  },
  {
    id: "c3",
    from: "them",
    text: "Отлично. Можете предоставить сертификат качества и технические характеристики?",
    time: "11:45",
  },
  {
    id: "c4",
    from: "me",
    text: "Конечно! Вся продукция сертифицирована по ГОСТ. Прикрепляю документы.",
    time: "11:45",
  },
  {
    id: "c5",
    from: "me",
    file: "Сертификат_качества_сталь.pdf",
    time: "11:45",
  },
];

export const trendData = [
  { month: "Март", value: 320 },
  { month: "Апр", value: 540 },
  { month: "Май", value: 480 },
  { month: "Июнь", value: 600 },
  { month: "Июль", value: 700, highlight: true },
  { month: "Авг", value: 350 },
  { month: "Сен", value: 950 },
];

export const moderationProducts = [
  {
    id: "mp1",
    name: "Оцинкованный рулон",
    company: "Asia Steel Group",
    price: 850,
    description: "Оцинкованный рулон горячекатаная диаметром 16 мм, класс А500С, длина прутков 11,7 м. Производство Казахстан.",
    date: "12 мар 2025",
    issues: [],
  },
  {
    id: "mp2",
    name: "Оцинкованный рулон",
    company: "Asia Steel Group",
    price: 850,
    description: "",
    date: "12 мар 2025",
    issues: ["Нет описании товара", "Нет фото товара"],
  },
  {
    id: "mp3",
    name: "Оцинкованный рулон",
    company: "Asia Steel Group",
    price: 850,
    description: "Оцинкованный рулон горячекатаная диаметром 16 мм, класс А500С, длина прутков 11,7 м. Производство Казахстан.",
    date: "12 мар 2025",
    issues: [],
  },
  {
    id: "mp4",
    name: "Оцинкованный рулон",
    company: "Asia Steel Group",
    price: 850,
    description: "",
    date: "12 мар 2025",
    issues: ["Нет описании товара", "Нет фото товара"],
  },
];

export const companyVerifications = [
  {
    id: "cv1",
    name: "Алтын Цемент",
    industry: "Металлургия - Павлодар",
    status: "ready",
    docs: [{ name: "Свидетельство о регистрации", ok: true }, { name: "Устав компании", ok: true }],
  },
  {
    id: "cv2",
    name: "Алтын Цемент",
    industry: "Металлургия - Павлодар",
    status: "issues",
    docs: [{ name: "Свидетельство о регистрации", ok: true }, { name: "Отсутствует Устав компании", ok: false }],
  },
];

export const complaints = [
  {
    id: "cx1",
    title: "Оцинкованный рулон",
    company: 'ООО "Алтын цемент"',
    date: "27 мар 2026",
    reason: "Фейковое объявление",
    detail: "Товар не соответствует описанию. Заявленный ГОСТ не совпадает с реальным сертификатом.",
  },
  {
    id: "cx2",
    title: "Алтын Цемент",
    company: "Металлургия - Павлодар",
    date: "27 мар 2026",
    reason: "Мошенничество",
    detail: "Компания взяла предоплату и перестала выходить на связь. Сумма ущерба: $8500",
  },
  {
    id: "cx3",
    title: "Переписка #chat-88",
    company: 'ООО "Алтын цемент"',
    date: "27 мар 2026",
    reason: "Спам и реклама",
    detail: "Пользователь рассылает рекламные сообщения в чатах.",
  },
];

export const accounts = [
  {
    id: "a1",
    name: "BuildKaz LLP",
    role: "Продавец",
    email: "info@buildkaz.kz",
    regDate: "25 июн 2024",
    warnings: 1,
    status: "active",
  },
  {
    id: "a2",
    name: 'ООО "АлтынМетал"',
    role: "Покупатель",
    email: "altyn@metal.kz",
    regDate: "8 фев 2025",
    warnings: 0,
    status: "active",
  },
  {
    id: "a3",
    name: "TradeHub KZ",
    role: "Продавец",
    email: "admin@tradehub.kz",
    regDate: "3 мар 2024",
    warnings: 3,
    status: "blocked",
  },
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
