import { t } from "../i18n";

const KNOWN_TOOLS = new Set([
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
]);

export default function ToolStatusChip({ tool, status, summary }) {
  const label = KNOWN_TOOLS.has(tool) ? t(`tool.names.${tool}`) : summary || tool;
  const isError = status === "error";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${
        isError
          ? "border-danger-100 text-danger-600 bg-danger-50 dark:bg-danger-500/10 dark:border-danger-500/30"
          : "border-ink-200 dark:border-[#1C1C1C] text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-[#171717]"
      }`}
    >
      {status === "running" && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {label}
    </span>
  );
}
