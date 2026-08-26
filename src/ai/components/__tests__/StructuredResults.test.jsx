import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StructuredResults from "../StructuredResults";
import { setAiLocale } from "../../i18n";
import { normalizeResultSet } from "../../lib/resultSets";

function renderResults(resultSets, props = {}) {
  return render(
    <MemoryRouter>
      <StructuredResults resultSets={resultSets.map(normalizeResultSet)} {...props} />
    </MemoryRouter>
  );
}

describe("StructuredResults", () => {
  beforeEach(() => {
    localStorage.clear();
    setAiLocale("en");
    vi.restoreAllMocks();
  });

  it("renders product/company links, grounded reasons, and public company contacts", () => {
    renderResults([
      {
        kind: "business_search",
        indexFreshness: {
          asOf: "2026-08-10T09:30:00Z",
          stale: true,
          sourceStatus: "products=SUCCESS;companies=SUCCESS",
        },
        items: [
          {
            type: "PRODUCT",
            id: 1,
            slug: "cement-m500",
            name: "Cement M500",
            price: 15000,
            currency: "UZS",
            imageUrl: "/media/cement-m500.jpg",
            relevance: 0.91,
            reasons: ["SEMANTIC_MATCH"],
          },
          {
            type: "COMPANY",
            id: 2,
            slug: "acme-supply",
            name: "Acme Supply",
            verificationStatus: "VERIFIED",
            relevance: 0.87,
            productCount: 12,
            logoUrl: "/media/acme-supply.png",
            contactStatus: "AVAILABLE",
            contact: {
              phonePrimary: "+998 90 123 45 67",
              website: "acme.uz",
              address: "Tashkent",
            },
          },
        ],
      },
    ]);

    const productLink = screen.getByRole("link", { name: "Cement M500" });
    expect(productLink).toHaveAttribute(
      "href",
      "/product/cement-m500"
    );
    expect(productLink).toContainElement(screen.getByText("Open product"));
    const companyLink = screen.getByRole("link", { name: "Acme Supply" });
    expect(companyLink).toHaveAttribute(
      "href",
      "/company/acme-supply"
    );
    expect(companyLink).toContainElement(screen.getByText("Open company"));
    expect(screen.getByRole("link", { name: "+998 90 123 45 67" })).toHaveAttribute(
      "href",
      "tel:+998901234567"
    );
    expect(screen.getByRole("link", { name: "Website" })).toHaveAttribute(
      "href",
      "https://acme.uz/"
    );
    expect(screen.getByLabelText("AI relevance score: 91%")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Cement M500" })).toHaveAttribute(
      "src",
      "/media/cement-m500.jpg"
    );
    expect(screen.getByRole("img", { name: "Acme Supply" })).toHaveAttribute(
      "src",
      "/media/acme-supply.png"
    );
    expect(screen.getByText("meaning match")).toBeInTheDocument();
    expect(screen.getByText("Verified at index snapshot")).toBeInTheDocument();
    expect(screen.getByText(/Catalog index snapshot:/)).toBeInTheDocument();
    expect(screen.getByText(/This index is stale/i)).toBeInTheDocument();
  });

  it("renders supplier explanations and the non-guarantee disclaimer", () => {
    renderResults([
      {
        kind: "supplier_recommendations",
        items: [
          {
            companyId: 3,
            slug: "best-supplier",
            name: "Best Supplier",
            logoUrl: "/media/best-supplier.png",
            relevance: 0.75,
            reasons: ["VERIFIED_COMPANY", "ACTIVE_CATALOG"],
            contactStatus: "NOT_CHECKED",
            contact: null,
          },
        ],
      },
    ]);

    expect(screen.getByText("Recommended suppliers")).toBeInTheDocument();
    expect(screen.getByText(/not guaranteed commercial outcomes/i)).toBeInTheDocument();
    expect(screen.getByText(/Public contact was not checked/i)).toBeInTheDocument();
  });

  it("renders every backend contact status without inferring a reason from null", () => {
    renderResults([
      {
        kind: "supplier_recommendations",
        items: [
          { companyId: 1, name: "No fields", contactStatus: "NO_PUBLIC_FIELDS", contact: null },
          { companyId: 2, name: "Missing profile", contactStatus: "NOT_FOUND", contact: null },
          {
            companyId: 3,
            name: "Lookup outage",
            contactStatus: "TEMPORARILY_UNAVAILABLE",
            contact: null,
          },
          { companyId: 4, name: "Not checked", contactStatus: "NOT_CHECKED", contact: null },
          { companyId: 5, name: "Inconsistent available", contactStatus: "AVAILABLE", contact: null },
        ],
      },
    ]);

    expect(screen.getByText("The company profile has no public contact fields.")).toBeInTheDocument();
    expect(screen.getByText(/profile was not found/i)).toBeInTheDocument();
    expect(screen.getByText(/lookup is temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/was not checked for this result/i)).toBeInTheDocument();
    expect(screen.getByText(/reported available.*no safe contact fields/i)).toBeInTheDocument();
  });

  it("shows only seller-authorized lead fields and ignores injected buyer contact data", () => {
    renderResults([
      {
        opportunities: [
          {
            leadId: 44,
            status: "NEW",
            matchScore: 1,
            requestedItems: [{ productName: "Steel pipe", quantity: 4 }],
            contactPhone: "+998 00 PRIVATE",
            buyerName: "Private Buyer",
            reasons: ["PRODUCT_OR_NEED_MATCH"],
          },
        ],
        evaluatedLeadCount: 100,
        totalLeadCount: 245,
        candidatesTruncated: true,
        asOf: "2026-08-11T07:00:00Z",
      },
    ]);

    expect(screen.getByText("Buyer request #44")).toBeInTheDocument();
    expect(screen.getByText(/Only requests already authorized/i)).toBeInTheDocument();
    expect(screen.queryByText("+998 00 PRIVATE")).not.toBeInTheDocument();
    expect(screen.queryByText("Private Buyer")).not.toBeInTheDocument();
    expect(screen.getByLabelText("AI relevance score: 1%")).toBeInTheDocument();
    expect(screen.getByText("Evaluated 100 of 245 available candidates.")).toBeInTheDocument();
    expect(screen.getByText(/candidate scan was capped/i)).toBeInTheDocument();
    expect(screen.getByText(/Candidate data evaluated as of/i)).toBeInTheDocument();
  });

  it("requires confirmation before publishing an owner-scoped buying-intent draft", () => {
    const publish = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const backendDisclosure =
      "When published, category, region, need text, quantity, and budget are visible to sellers.";
    renderResults(
      [
        {
          kind: "buying_intent_draft",
          items: [
            {
              intentId: "intent-1",
              status: "DRAFT",
              category: "Cement",
              region: "Tashkent",
              need: "Need 10 tons for a warehouse",
              quantity: 10,
              quantityUnit: "tons",
              budgetMin: 1000000,
              budgetMax: 1200000,
              currency: "UZS",
              expiresAt: "2026-09-01T00:00:00Z",
              publicationDisclosure: backendDisclosure,
            },
          ],
        },
      ],
      { onPublishIntent: publish }
    );

    fireEvent.click(screen.getByRole("button", { name: "Publish for matching" }));

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm.mock.calls[0][0]).toContain("Category: Cement");
    expect(confirm.mock.calls[0][0]).toContain("Region: Tashkent");
    expect(confirm.mock.calls[0][0]).toContain("Need text: Need 10 tons for a warehouse");
    expect(confirm.mock.calls[0][0]).toContain("Quantity: 10 tons");
    expect(confirm.mock.calls[0][0]).toContain("Budget: 1,000,000 UZS");
    expect(confirm.mock.calls[0][0]).toContain("Expires:");
    expect(confirm.mock.calls[0][0]).toContain(backendDisclosure);
    expect(publish).toHaveBeenCalledWith(0, "intent-1");
    expect(screen.getByText("Fields that sellers will see")).toBeInTheDocument();
    expect(screen.getByText(backendDisclosure)).toBeInTheDocument();
    expect(screen.getByText(/Drafts stay private until you explicitly publish/i)).toBeInTheDocument();
  });

  it("renders account-ID-hidden buying-intent matches without any contact action", () => {
    renderResults([
      {
        matches: [
          {
            intentId: "intent-2",
            category: "Pipe",
            need: "Need galvanized pipe",
            matchScore: 70,
            contactAvailable: true,
            contactPhone: "must-not-render",
          },
        ],
      },
    ]);

    expect(screen.getByText("Buyer need with account ID hidden")).toBeInTheDocument();
    expect(screen.getByText(/Buyer account IDs and dedicated contact fields are not shown/i)).toBeInTheDocument();
    expect(screen.queryByText("must-not-render")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the explicit close action for a confirmation-required status card", () => {
    const close = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderResults(
      [
        {
          kind: "buying_intent_status",
          items: [
            {
              intentId: "intent-close-1",
              status: "CONFIRMATION_REQUIRED",
              confirmationRequired: true,
              category: "Steel",
            },
          ],
        },
      ],
      { onCloseIntent: close }
    );

    expect(screen.getByText("confirmation required")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close intent" }));
    expect(close).toHaveBeenCalledWith(0, "intent-close-1");
  });

  it("has explicit empty and malformed-result states", () => {
    renderResults([{ kind: "business_search", items: [] }, { unexpected: true }]);

    expect(screen.getByText(/No matching results were found/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot be displayed safely/i)).toBeInTheDocument();
  });

  it("makes owner-list pagination explicit", () => {
    renderResults([
      {
        kind: "buying_intents",
        items: [{ intentId: "intent-3", status: "PUBLISHED", category: "Steel" }],
        page: 1,
        perPage: 1,
        total: 4,
        totalPages: 4,
      },
    ]);

    expect(screen.getByText("Displaying 1 of 4 buying intents.")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 4.")).toBeInTheDocument();
  });
});
