import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AiAgentPage from "../../pages/AiAgentPage";

vi.mock("../flag", () => ({ isAiAgentEnabled: () => false }));
vi.mock("../../components/layout/AppShell", () => ({
  default: ({ children }) => <div data-testid="shell">{children}</div>,
}));
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ isLoggedIn: true, user: { username: "buyer-test", role: "BUYER" } }),
}));

describe("AiAgentPage — flag off", () => {
  it("keeps the disabled-feature mock available to an authenticated user", () => {
    render(
      <MemoryRouter>
        <AiAgentPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Здравствуйте")).toBeInTheDocument();
    expect(screen.getByText(/Я ваш AI-ассистент/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Спросите что нибудь...")).toBeInTheDocument();
  });

  it("still uses the canned mock reply, never a real network call", async () => {
    render(
      <MemoryRouter>
        <AiAgentPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText("Спросите что нибудь...");
    fireEvent.change(input, { target: { value: "тест" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("тест")).toBeInTheDocument();
    expect(
      await screen.findByText("Ищу подходящих поставщиков по вашему запросу. Один момент...")
    ).toBeInTheDocument();
  });
});
