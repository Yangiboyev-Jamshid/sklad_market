const KNOWN_KINDS = new Set([
  "business_search",
  "supplier_recommendations",
  "buyer_recommendations",
  "buying_intent_draft",
  "buying_intents",
  "buying_intent_matches",
  "buying_intent_status",
]);

const KIND_ALIASES = {
  recommend_buyers: "buyer_recommendations",
  buyer_opportunities: "buyer_recommendations",
  supplier_recommendation: "supplier_recommendations",
  buying_intent_search: "buying_intent_matches",
  buying_intent_match: "buying_intent_matches",
  my_buying_intents: "buying_intents",
};

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function inferKind(payload) {
  const suppliedKind = typeof payload.kind === "string" ? payload.kind.toLowerCase() : "";
  const canonicalKind = KIND_ALIASES[suppliedKind] ?? suppliedKind;
  if (KNOWN_KINDS.has(canonicalKind)) return canonicalKind;
  if (Array.isArray(payload.opportunities)) return "buyer_recommendations";
  if (Array.isArray(payload.matches)) return "buying_intent_matches";
  if (Array.isArray(payload.intents)) return "buying_intents";
  if (payload.requiresPublicationConfirmation) return "buying_intent_draft";
  if (payload.intentId && (payload.closed !== undefined || payload.status)) {
    return "buying_intent_status";
  }
  if (Array.isArray(payload.items)) {
    const first = payload.items.find(isRecord);
    if (first?.type === "PRODUCT" || first?.type === "COMPANY") return "business_search";
    if (first?.companyId !== undefined) return "supplier_recommendations";
    if (first?.leadId !== undefined) return "buyer_recommendations";
    if (first?.intentId !== undefined && first?.matchScore !== undefined) {
      return "buying_intent_matches";
    }
    if (first?.intentId !== undefined) return "buying_intents";
  }
  return "unknown";
}

function collectionFor(payload, kind) {
  if (Array.isArray(payload.items)) return payload.items;
  if (kind === "buyer_recommendations" && Array.isArray(payload.opportunities)) {
    return payload.opportunities;
  }
  if (kind === "buying_intent_matches" && Array.isArray(payload.matches)) {
    return payload.matches;
  }
  if (kind === "buying_intents" && Array.isArray(payload.intents)) return payload.intents;
  if (payload.intentId && kind.startsWith("buying_intent")) return [payload];
  return [];
}

/**
 * Converts current and earlier backend result shapes into a small, render-safe contract. React
 * still escapes every displayed value; this function additionally bounds collections so a bad
 * stream event cannot create an unbounded card tree.
 */
export function normalizeResultSet(payload) {
  if (!isRecord(payload)) {
    return { kind: "unknown", items: [], invalid: true };
  }
  const kind = inferKind(payload);
  const items = collectionFor(payload, kind).filter(isRecord).slice(0, 50);
  return {
    ...payload,
    kind,
    items,
    invalid: kind === "unknown",
  };
}

export function normalizeResultSets(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).map(normalizeResultSet);
}

export function updateIntentInResultSet(resultSet, intentId, update) {
  if (!resultSet || !intentId) return resultSet;
  const expected = String(intentId);
  return {
    ...resultSet,
    items: resultSet.items.map((item) =>
      String(item.intentId ?? item.id ?? "") === expected ? { ...item, ...update } : item
    ),
  };
}
