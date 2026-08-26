import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DashboardAiSearchPanel from "../DashboardAiSearchPanel";
import { setAiLocale } from "../../i18n";

const { searchBusinessesMock } = vi.hoisted(() => ({ searchBusinessesMock: vi.fn() }));

vi.mock("../../api/aiClient", () => ({ searchBusinesses: searchBusinessesMock }));
vi.mock("../../flag", () => ({ isAiAgentEnabled: () => true }));

function renderPanel(query = "cement") {
  return render(
    <MemoryRouter>
      <DashboardAiSearchPanel query={query} isLoggedIn />
    </MemoryRouter>
  );
}

describe("DashboardAiSearchPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    setAiLocale("en");
    searchBusinessesMock.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders clickable product and company matches in the right-side panel", async () => {
    searchBusinessesMock.mockResolvedValue({
      items: [
        {
          type: "PRODUCT",
          id: 1,
          slug: "cement-m500",
          name: "Cement M500",
          price: 15000,
          currency: "UZS",
          relevance: 0.91,
          reasons: ["SEMANTIC_MATCH"],
        },
        {
          type: "COMPANY",
          id: 2,
          slug: "acme-supply",
          name: "Acme Supply",
          relevance: 0.82,
          productCount: 12,
          verificationStatus: "VERIFIED",
          reasons: ["INDEXED_AS_VERIFIED"],
        },
      ],
      indexFreshness: { stale: false },
    });

    renderPanel();
    await act(async () => vi.advanceTimersByTimeAsync(650));

    expect(searchBusinessesMock).toHaveBeenCalledWith(
      { query: "cement", types: ["PRODUCT", "COMPANY"], limit: 8 },
      { signal: expect.any(AbortSignal) }
    );
    expect(screen.getByRole("link", { name: "Cement M500" })).toHaveAttribute(
      "href",
      "/product/cement-m500"
    );
    expect(screen.getByRole("link", { name: "Acme Supply" })).toHaveAttribute(
      "href",
      "/company/acme-supply"
    );
    expect(screen.getByText("91%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Companies" }));
    expect(screen.queryByRole("link", { name: "Cement M500" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Acme Supply" })).toBeInTheDocument();
  });

  it("debounces changing queries and only searches the final value", async () => {
    searchBusinessesMock.mockResolvedValue({ items: [] });
    const view = renderPanel("cem");
    view.rerender(
      <MemoryRouter>
        <DashboardAiSearchPanel query="cement" isLoggedIn />
      </MemoryRouter>
    );

    await act(async () => vi.advanceTimersByTimeAsync(650));

    expect(searchBusinessesMock).toHaveBeenCalledTimes(1);
    expect(searchBusinessesMock).toHaveBeenCalledWith(
      expect.objectContaining({ query: "cement" }),
      expect.any(Object)
    );
  });

  it("contains AI failure without hiding or replacing the normal dashboard", async () => {
    searchBusinessesMock.mockRejectedValue(Object.assign(new Error("down"), { status: 503 }));
    renderPanel();
    await act(async () => vi.advanceTimersByTimeAsync(650));

    expect(
      screen.getByText("AI matches are temporarily unavailable. Normal search is still working.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ask AI about these results" })).not.toBeInTheDocument();
  });

  it("does not call the authenticated AI endpoint for a logged-out visitor", async () => {
    render(
      <MemoryRouter>
        <DashboardAiSearchPanel query="cement" isLoggedIn={false} />
      </MemoryRouter>
    );
    await act(async () => vi.advanceTimersByTimeAsync(1000));

    expect(searchBusinessesMock).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("AI smart matches")).not.toBeInTheDocument();
  });
});
