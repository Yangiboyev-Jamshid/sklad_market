import { describe, expect, it } from "vitest";
import { normalizeResultSet, normalizeResultSets, prepareResultSections, updateIntentInResultSet } from "../resultSets";

describe("structured result normalization", () => {
  it("keeps a canonical business result and bounds its item collection", () => {
    const result = normalizeResultSet({
      kind: "business_search",
      items: Array.from({ length: 60 }, (_, id) => ({ id, type: "PRODUCT" })),
    });

    expect(result.kind).toBe("business_search");
    expect(result.items).toHaveLength(50);
    expect(result.invalid).toBe(false);
  });

  it("accepts legacy buyer and buying-intent collection fields", () => {
    expect(normalizeResultSet({ opportunities: [{ leadId: 7 }] })).toMatchObject({
      kind: "buyer_recommendations",
      items: [{ leadId: 7 }],
    });
    expect(normalizeResultSet({ matches: [{ intentId: "i-1" }] })).toMatchObject({
      kind: "buying_intent_matches",
      items: [{ intentId: "i-1" }],
    });
    expect(normalizeResultSet({ intents: [{ intentId: "i-2" }] })).toMatchObject({
      kind: "buying_intents",
      items: [{ intentId: "i-2" }],
    });
  });

  it("turns malformed payloads into an inert unavailable state", () => {
    expect(normalizeResultSet(null)).toEqual({ kind: "unknown", items: [], invalid: true });
    expect(normalizeResultSets("not-an-array")).toEqual([]);
  });

  it("removes an intermediate empty search notice once another search finds matches", () => {
    const { sections, totalCount } = prepareResultSections([
      { kind: "business_search", items: [] },
      { kind: "business_search", items: [{ type: "PRODUCT", id: 1, slug: "steel" }] },
    ]);
    expect(totalCount).toBe(1);
    expect(sections.map(({ index }) => index)).toEqual([1]);
  });

  it("updates only the selected intent without mutating the original result", () => {
    const original = normalizeResultSet({
      kind: "buying_intents",
      items: [
        { intentId: "first", status: "DRAFT" },
        { intentId: "second", status: "DRAFT" },
      ],
    });
    const updated = updateIntentInResultSet(original, "first", { status: "PUBLISHED" });

    expect(updated.items[0].status).toBe("PUBLISHED");
    expect(updated.items[1].status).toBe("DRAFT");
    expect(original.items[0].status).toBe("DRAFT");
  });
});
