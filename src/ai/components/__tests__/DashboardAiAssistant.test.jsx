import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import DashboardAiAssistant from "../DashboardAiAssistant";
import { setAiLocale } from "../../i18n";

vi.mock("../../flag", () => ({ isAiAgentEnabled: () => true }));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

describe("DashboardAiAssistant", () => {
  beforeEach(() => {
    localStorage.clear();
    setAiLocale("en");
  });

  it("welcomes the logged-in user and opens one empty AI chat", () => {
    render(
      <MemoryRouter>
        <DashboardAiAssistant
          user={{ id: 7, firstName: "Alex", role: "BUYER" }}
          isLoggedIn
        />
        <LocationProbe />
      </MemoryRouter>
    );

    expect(screen.getByText("Hi, Alex!")).toBeInTheDocument();
    expect(screen.queryByText("Recommend suitable suppliers")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Open AI assistant" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/ai-agent?new=1");
  });

  it("does not expose the authenticated dashboard helper to a logged-out visitor", () => {
    render(
      <MemoryRouter>
        <DashboardAiAssistant user={null} isLoggedIn={false} />
      </MemoryRouter>
    );

    expect(screen.queryByLabelText("AI assistant")).not.toBeInTheDocument();
  });
});
