import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AiAgentPage from "../../pages/AiAgentPage";

vi.mock("../flag", () => ({ isAiAgentEnabled: () => true }));
vi.mock("../../components/layout/AppShell", () => ({
  default: ({ children }) => <div data-testid="shell">{children}</div>,
}));

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));
vi.mock("../../context/AuthContext", () => ({ useAuth: useAuthMock }));

const { createConversationMock, listConversationsMock, streamAiMessageMock } = vi.hoisted(() => ({
  createConversationMock: vi.fn(),
  listConversationsMock: vi.fn(),
  streamAiMessageMock: vi.fn(),
}));
vi.mock("../api/aiClient", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createConversation: createConversationMock,
    listConversations: listConversationsMock,
    streamAiMessage: streamAiMessageMock,
  };
});

describe("AiAgentPage — persona-aware seller surface (PLAN.md Phase 6)", () => {
  beforeEach(() => {
    localStorage.clear();
    createConversationMock.mockReset().mockResolvedValue({ id: "conv-1" });
    listConversationsMock.mockReset().mockResolvedValue({ items: [] });
    streamAiMessageMock.mockReset();
  });

  it("shows the listing-assist entry for a SELLER and toggles the helper panel", () => {
    useAuthMock.mockReturnValue({ isLoggedIn: true, user: { role: "SELLER" } });

    render(
      <MemoryRouter>
        <AiAgentPage />
      </MemoryRouter>
    );

    const entryButton = screen.getByRole("button", { name: "Помощь с объявлением" });
    expect(screen.queryByText("Помощник по объявлению")).not.toBeInTheDocument();

    fireEvent.click(entryButton);
    expect(screen.getByText("Помощник по объявлению")).toBeInTheDocument();

    fireEvent.click(entryButton);
    expect(screen.queryByText("Помощник по объявлению")).not.toBeInTheDocument();
  });

  it("does not show the listing-assist entry for a BUYER", () => {
    useAuthMock.mockReturnValue({ isLoggedIn: true, user: { role: "BUYER" } });

    render(
      <MemoryRouter>
        <AiAgentPage />
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: "Помощь с объявлением" })).not.toBeInTheDocument();
  });

  it("shows admin-flavored suggestion chips for role=ADMIN", () => {
    useAuthMock.mockReturnValue({ isLoggedIn: true, user: { role: "ADMIN" } });

    render(
      <MemoryRouter>
        <AiAgentPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Покажи очередь модерации")).toBeInTheDocument();
  });
});
