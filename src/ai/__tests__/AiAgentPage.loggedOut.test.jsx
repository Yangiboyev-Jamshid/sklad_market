import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AiAgentPage from "../../pages/AiAgentPage";

vi.mock("../flag", () => ({ isAiAgentEnabled: () => true }));
vi.mock("../../components/layout/AppShell", () => ({
  default: ({ children }) => <div data-testid="shell">{children}</div>,
}));
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ isLoggedIn: false }),
}));

describe("AiAgentPage — flag on, logged out", () => {
  it("shows a login prompt linking to /login instead of the chat", () => {
    render(
      <MemoryRouter>
        <AiAgentPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Войдите в аккаунт")).toBeInTheDocument();
    const loginLink = screen.getByRole("link", { name: "Войти" });
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
