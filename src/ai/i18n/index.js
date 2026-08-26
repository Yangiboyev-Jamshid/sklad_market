import { useSyncExternalStore } from "react";
import platformI18n from "../../i18n";
import ru from "./ru";
import uz from "./uz";
import en from "./en";

const DICTS = { ru, uz, en };
export const AI_LOCALES = ["ru", "uz", "en"];
const DEFAULT_LOCALE = "ru";
const ACCEPT_LANGUAGE = { ru: "RU", uz: "UZ", en: "EN" };

function normalizeLocale(locale) {
  const normalized = String(locale ?? "").split("-")[0].toLowerCase();
  return DICTS[normalized] ? normalized : DEFAULT_LOCALE;
}

export function getAiLocale() {
  return normalizeLocale(platformI18n.resolvedLanguage ?? platformI18n.language);
}

export function setAiLocale(locale) {
  if (!DICTS[locale]) return;
  void platformI18n.changeLanguage(locale);
}

export function useAiLocale() {
  return useSyncExternalStore(
    (onStoreChange) => {
      platformI18n.on("languageChanged", onStoreChange);
      return () => platformI18n.off("languageChanged", onStoreChange);
    },
    getAiLocale,
    getAiLocale
  );
}

export function aiLocaleToAcceptLanguage(locale = getAiLocale()) {
  return ACCEPT_LANGUAGE[locale] ?? ACCEPT_LANGUAGE[DEFAULT_LOCALE];
}

export function t(key, params) {
  return platformI18n.t(`ai.${key}`, {
    ...params,
    defaultValue: key,
    returnObjects: true,
    interpolation: { prefix: "{", suffix: "}" },
  });
}

export { DICTS as __dicts };
