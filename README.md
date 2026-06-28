# Sklad Market — B2B Marketplace (SkladX)

Figma dizayni asosida ishlab chiqilgan to'liq frontend ilova.

## Texnologiyalar
- **React 19** (Vite)
- **Tailwind CSS** — utility-first styling, custom design tokens
- **Ant Design** — ConfigProvider orqali ulangan (forma va boshqa murakkab komponentlar uchun tayyor)
- **Framer Motion** — sahifa o'tishlari, tab almashinuvi, hover animatsiyalari
- **iconsax-react** (Vuesax/Iconsax icon to'plami)
- **React Router** — client-side routing
- **Recharts** — sotuvchi panelidagi trend grafigi

## O'rnatish va ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda `http://localhost:5173` manzilini oching.

Production build uchun:

```bash
npm run build
npm run preview
```

## Sahifalar / Routelar

| Route | Sahifa |
|---|---|
| `/login` | Kirish / Ro'yxatdan o'tish (Telefon/Email, Xaridor/Sotuvchi) |
| `/` | Bosh sahifa — bannerlar, mashhur tovarlar |
| `/catalog` | Katalog — filtrlar, grid/karta ko'rinishi |
| `/product/:id` | Tovar sahifasi — galereya, tab'lar, xarid bloki |
| `/favorites` | Fovaritlar — Tovarlar / Kompaniyalar |
| `/cart` | Savatcha |
| `/ai-agent` | AI yordamchi chat |
| `/companies` | Kompaniyalar — grid/karta |
| `/profile`, `/company/:id` | Kompaniya profili |
| `/seller` | Sotuvchi paneli — Obzor/Tovarlar/So'rovlar/Xabarlar/Sozlamalar |
| `/moderator` | Moderator paneli — Obzor/Tovarlar/Kompaniyalar/Shikoyatlar/Akkauntlar |
| `/tariffs` | Tarif rejalari |

## Loyiha tuzilishi

```
src/
  components/
    layout/      — AppShell, Header, SidebarRail
    ui/          — ProductCard, CompanyCard, MapView, PillToggle, RatingStars, ProductThumb
    seller/      — Sotuvchi paneli tab komponentlari
    moderator/   — Moderator paneli tab komponentlari
  context/       — AuthContext, CartContext (global state)
  data/          — mockData.js (barcha demo ma'lumotlar)
  pages/         — har bir route uchun sahifa komponenti
```

## Eslatmalar
- Barcha ma'lumotlar `src/data/mockData.js` faylida — backend ulanmaguncha shu yerdan tahrirlanadi.
- Xarita komponenti (`MapView`) tashqi xarita xizmatlariga bog'liq emas — SVG asosida stilize qilingan, offline ishlaydi. Google Maps/Mapbox ulash kerak bo'lsa, shu komponentni almashtirish kifoya.
- Mahsulot rasmlari o'rniga `ProductThumb` SVG-placeholder ishlatilgan (Figma'dagi wireframe-uslubiga mos). Haqiqiy rasmlar qo'shilganda bu komponentni `<img>` bilan almashtirish kerak.
- Auth holati hozircha frontend-only (login qilingan "John Doe / TradeHub KZ" holatida boshlanadi) — real autentifikatsiya backend bilan integratsiya qilinganda `AuthContext.jsx` ni yangilang.

## Yangi imkoniyatlar (dark mode + responsive)

- **Dark / Light mode**: Header'ning o'ng tomonidagi Oy/Quyosh tugmasi orqali almashtiriladi. Tanlov `localStorage`'da saqlanadi va keyingi tashrifda eslab qolinadi; agar foydalanuvchi hali tanlamagan bo'lsa, brauzer/OS'ning tizim sozlamasi (`prefers-color-scheme`) avtomatik aniqlanadi. Ant Design komponentlari ham `ConfigProvider`'ning `darkAlgorithm`/`defaultAlgorithm` orqali mos ravishda almashadi.
- **Responsive (mobil/tablet/desktop)**:
  - `lg` (≥1024px) — to'liq desktop ko'rinish: chap tomonda doimiy ikon-panel.
  - `md`–`lg` oralig'i — yon panel yashiriladi, header'da hamburger menyu chiqadi.
  - `< md` (telefon) — pastda tab-bar (Главная/Каталог/Фавориты/Корзина/Компании), header qisqartirilgan, qidiruv katakcha sifatida ochiladi, filtrlar va modal oynalar pastdan chiqadigan bottom-sheet shaklida ko'rsatiladi.
  - Jadval (Аккаунты), chat (Сообщения) va boshqa murakkab komponentlar kichik ekranlarda gorizontal scroll yoki bir-panelli navigatsiyaga moslashtirilgan.

Theme holatini boshqarish uchun: `src/context/ThemeContext.jsx`.
Mobil navigatsiya: `src/components/layout/BottomNav.jsx` va `src/components/layout/MobileMenu.jsx`.
