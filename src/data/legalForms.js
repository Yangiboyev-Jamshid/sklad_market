export const LEGAL_FORMS = [
  { code: "MCHJ", uz: "Mas'uliyati cheklangan jamiyat", ru: "Общество с ограниченной ответственностью", en: "Limited Liability Company" },
  { code: "XK", uz: "Xususiy korxona", ru: "Частное предприятие", en: "Private Enterprise" },
  { code: "YATT", uz: "Yakka tartibdagi tadbirkor", ru: "Индивидуальный предприниматель", en: "Individual Entrepreneur" },
];

const LANG_KEY = { ru: "ru", uz: "uz", en: "en" };

export function getLegalFormFullName(code, lang) {
  const entry = LEGAL_FORMS.find((f) => f.code === code);
  if (!entry) return "";
  const key = LANG_KEY[lang] ?? "ru";
  return entry[key] ?? entry.ru;
}

export function getLegalFormLabel(code, lang) {
  const entry = LEGAL_FORMS.find((f) => f.code === code);
  if (!entry) return "";
  return `${entry.code} — ${getLegalFormFullName(code, lang)}`;
}
