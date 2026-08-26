import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import uz from "./locales/uz.json";
import en from "./locales/en.json";
import aiRu from "../ai/i18n/ru";
import aiUz from "../ai/i18n/uz";
import aiEn from "../ai/i18n/en";

const STORAGE_KEY = "skladx_lang";
const SUPPORTED_LANGS = ["ru", "uz", "en"];

function getInitialLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  return "ru";
}

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: { ...ru, ai: aiRu } },
    uz: { translation: { ...uz, ai: aiUz } },
    en: { translation: { ...en, ai: aiEn } },
  },
  lng: getInitialLang(),
  fallbackLng: "ru",
  supportedLngs: SUPPORTED_LANGS,
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  document.documentElement.lang = lng;
});

document.documentElement.lang = i18n.language;

export default i18n;
