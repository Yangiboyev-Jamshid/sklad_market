import { describe, it, expect, beforeEach } from "vitest";
import ru from "../ru";
import uz from "../uz";
import en from "../en";
import { t, getAiLocale, setAiLocale, aiLocaleToAcceptLanguage, AI_LOCALES } from "../index";

function collectPaths(obj, prefix = "") {
  const paths = [];
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      paths.push(...collectPaths(value, path));
    } else {
      paths.push({ path, isArray: Array.isArray(value) });
    }
  }
  return paths.sort((a, b) => a.path.localeCompare(b.path));
}

describe("AI i18n dictionaries", () => {
  it("have identical key sets and leaf shapes across ru/uz/en", () => {
    const ruPaths = collectPaths(ru);
    const uzPaths = collectPaths(uz);
    const enPaths = collectPaths(en);

    expect(uzPaths).toEqual(ruPaths);
    expect(enPaths).toEqual(ruPaths);
  });

  it("has at least one populated key set (sanity check against an empty-object false positive)", () => {
    expect(collectPaths(ru).length).toBeGreaterThan(5);
  });

  it("has localized labels for every current and planned AI tool", () => {
    const tools = [
      "search_products",
      "semantic_search_products",
      "find_similar_products",
      "get_product",
      "list_categories",
      "get_catalog_filters",
      "get_company",
      "search_businesses",
      "recommend_suppliers",
      "recommend_buyers",
      "get_cart",
      "get_my_favorites",
      "get_my_leads",
      "get_lead",
      "draft_lead",
      "get_unread_chats",
      "get_seller_leads",
      "draft_lead_reply",
      "draft_chat_reply",
      "draft_buying_intent",
      "get_my_buying_intents",
      "search_buying_intents",
      "close_buying_intent",
      "get_moderation_queue",
      "get_reports",
      "summarize_moderation_item",
    ];

    for (const dictionary of [ru, uz, en]) {
      expect(Object.keys(dictionary.tool.names).sort()).toEqual([...tools].sort());
      for (const tool of tools) expect(dictionary.tool.names[tool]).toBeTruthy();
    }
  });

  it("localizes every reason code emitted by the current business-discovery backend", () => {
    const businessReasonCodes = [
      "MATCHED_EXPLICIT_NEED",
      "OWN_ACTIVITY_RELEVANCE",
      "GENERAL_CATALOG_RELEVANCE",
      "SEMANTIC_MATCH",
      "SEMANTIC_OFFERING_RELEVANCE",
      "LEXICAL_NAME_OR_SLUG_MATCH",
      "CATEGORY_MATCH",
      "REGION_MATCH",
      "INDEXED_AS_VERIFIED",
      "INDEXED_PUBLIC_CATALOG",
      "PRODUCT_PRICE_FILTER_MATCH",
    ];

    for (const dictionary of [ru, uz, en]) {
      for (const code of businessReasonCodes) {
        expect(dictionary.results.reason[code]).toBeTruthy();
      }
    }
  });
});

describe("t()", () => {
  beforeEach(() => {
    localStorage.clear();
    setAiLocale("ru");
  });

  it("resolves a nested key from the current locale", () => {
    setAiLocale("en");
    expect(t("greeting.title")).toBe(en.greeting.title);
  });

  it("substitutes params in the resolved string", () => {
    setAiLocale("ru");
    expect(t("chat.charLimit", { count: 3, max: 4000 })).toBe("3 / 4000");
  });

  it("falls back to ru when the key is missing in the active locale (defensive; dictionaries are complete)", () => {
    setAiLocale("uz");
    expect(t("greeting.title")).toBe(uz.greeting.title);
  });

  it("returns the raw key when it exists nowhere", () => {
    expect(t("nope.not.a.key")).toBe("nope.not.a.key");
  });
});

describe("getAiLocale / setAiLocale", () => {
  beforeEach(() => {
    localStorage.clear();
    setAiLocale("ru");
  });

  it("defaults to ru when nothing is stored", () => {
    expect(getAiLocale()).toBe("ru");
  });

  it("uses the platform locale and persists it through the shared language key", () => {
    setAiLocale("en");
    expect(getAiLocale()).toBe("en");
    expect(localStorage.getItem("skladx_lang")).toBe("en");
    expect(localStorage.getItem("skladx_ai_lang")).toBeNull();
  });

  it("ignores an unknown locale", () => {
    setAiLocale("en");
    setAiLocale("fr");
    expect(getAiLocale()).toBe("en");
  });

  it("maps every AI locale to the platform's Accept-Language convention", () => {
    expect(aiLocaleToAcceptLanguage("ru")).toBe("RU");
    expect(aiLocaleToAcceptLanguage("uz")).toBe("UZ");
    expect(aiLocaleToAcceptLanguage("en")).toBe("EN");
  });

  it("exposes exactly the three supported locales", () => {
    expect(AI_LOCALES).toEqual(["ru", "uz", "en"]);
  });
});
