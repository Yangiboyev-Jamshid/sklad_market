import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AiAgentPage from "../../pages/AiAgentPage";
import { AiStreamError } from "../api/aiClient";
import { setAiLocale } from "../i18n";

vi.mock("../flag", () => ({ isAiAgentEnabled: () => true }));
vi.mock("../../components/layout/AppShell", () => ({
  default: ({ children }) => <div data-testid="shell">{children}</div>,
}));
const { logoutMock, useAuthMock } = vi.hoisted(() => ({
  logoutMock: vi.fn(),
  useAuthMock: vi.fn(),
}));
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

const {
  createConversationMock,
  listConversationsMock,
  getConversationMessagesMock,
  streamAiMessageMock,
  confirmDraftMock,
  cancelDraftMock,
} = vi.hoisted(() => ({
  createConversationMock: vi.fn(),
  listConversationsMock: vi.fn(),
  getConversationMessagesMock: vi.fn(),
  streamAiMessageMock: vi.fn(),
  confirmDraftMock: vi.fn(),
  cancelDraftMock: vi.fn(),
}));

vi.mock("../api/aiClient", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createConversation: createConversationMock,
    listConversations: listConversationsMock,
    getConversationMessages: getConversationMessagesMock,
    streamAiMessage: streamAiMessageMock,
    confirmDraft: confirmDraftMock,
    cancelDraft: cancelDraftMock,
  };
});

describe("AiAgentPage — flag on, logged in (streaming happy path)", () => {
  const jwt = (subject, roles = ["BUYER"]) =>
    `header.${btoa(JSON.stringify({ sub: subject, realm_access: { roles } }))}.signature`;

  beforeEach(() => {
    localStorage.clear();
    setAiLocale("ru");
    useAuthMock.mockReset().mockReturnValue({
      isLoggedIn: true,
      user: { username: "buyer-test", role: "BUYER" },
      logout: logoutMock,
    });
    createConversationMock.mockReset().mockResolvedValue({ id: "conv-1" });
    listConversationsMock.mockReset().mockResolvedValue({ items: [] });
    getConversationMessagesMock.mockReset().mockResolvedValue({
      items: [],
      meta: { total_pages: 1 },
    });
    streamAiMessageMock.mockReset();
    confirmDraftMock.mockReset();
    cancelDraftMock.mockReset();
    logoutMock.mockReset();
  });

  it("sends a message and renders the streamed assistant reply as it arrives", async () => {
    streamAiMessageMock.mockImplementation(async ({ onEvent }) => {
      onEvent({ event: "token", data: { text: "Нашёл " } });
      onEvent({ event: "token", data: { text: "поставщиков." } });
      onEvent({ event: "done", data: { messageId: "m1", conversationId: "conv-1" } });
    });

    render(
      <MemoryRouter>
        <AiAgentPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText("Спросите что-нибудь...");
    fireEvent.change(input, { target: { value: "Найди поставщиков" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("Найди поставщиков")).toBeInTheDocument();
    expect(await screen.findByText("Нашёл поставщиков.")).toBeInTheDocument();
    expect(createConversationMock).toHaveBeenCalledTimes(1);
  });

  it("automatically sends an AI-assisted dashboard search prompt once", async () => {
    localStorage.setItem(
      "skladx_ai_conversation_id:username%3Abuyer-test%7Crole%3ABUYER",
      "old-conversation"
    );
    streamAiMessageMock.mockImplementation(async ({ onEvent }) => {
      onEvent({ event: "token", data: { text: "I found matching products and companies." } });
      onEvent({ event: "done", data: { messageId: "m-dashboard", conversationId: "conv-1" } });
    });

    render(
      <MemoryRouter initialEntries={["/ai-agent?new=1&prompt=Find%20industrial%20pumps"]}>
        <AiAgentPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Find industrial pumps")).toBeInTheDocument();
    expect(await screen.findByText("I found matching products and companies.")).toBeInTheDocument();
    expect(streamAiMessageMock).toHaveBeenCalledTimes(1);
    expect(streamAiMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: "conv-1", content: "Find industrial pumps" })
    );
    expect(createConversationMock).toHaveBeenCalledTimes(1);
    expect(
      localStorage.getItem(
        "skladx_ai_conversation_id:username%3Abuyer-test%7Crole%3ABUYER"
      )
    ).toBe("conv-1");
  });

  it("opens an empty new chat without creating or sending until the user types", async () => {
    const storageKey = "skladx_ai_conversation_id:username%3Abuyer-test%7Crole%3ABUYER";
    localStorage.setItem(storageKey, "old-conversation");

    render(
      <MemoryRouter initialEntries={["/ai-agent?new=1"]}>
        <AiAgentPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(localStorage.getItem(storageKey)).toBeNull());
    expect(screen.getByPlaceholderText("Спросите что-нибудь...")).toHaveValue("");
    expect(streamAiMessageMock).not.toHaveBeenCalled();
    expect(createConversationMock).not.toHaveBeenCalled();
  });

  it("shows tool status chips while a tool is running, then resolves", async () => {
    streamAiMessageMock.mockImplementation(async ({ onEvent }) => {
      onEvent({ event: "tool_start", data: { tool: "search_products", summary: "..." } });
      await Promise.resolve();
      onEvent({ event: "tool_end", data: { tool: "search_products", status: "ok" } });
      onEvent({ event: "done", data: { messageId: "m1", conversationId: "conv-1" } });
    });

    render(
      <MemoryRouter>
        <AiAgentPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText("Спросите что-нибудь...");
    fireEvent.change(input, { target: { value: "найди цемент" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("Ищу по каталогу…")).toBeInTheDocument();
  });

  it("renders a typed ErrorCard when the stream fails", async () => {
    streamAiMessageMock.mockRejectedValue(new AiStreamError("provider_error", "down"));

    render(
      <MemoryRouter>
        <AiAgentPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText("Спросите что-нибудь...");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(
      await screen.findByText("Ассистент временно недоступен. Попробуйте ещё раз.")
    ).toBeInTheDocument();
  });

  it("keeps failed history attached and offers retry or an explicit fresh start", async () => {
    localStorage.setItem(
      "skladx_ai_conversation_id:username%3Abuyer-test%7Crole%3ABUYER",
      "unavailable-history"
    );
    getConversationMessagesMock.mockRejectedValue(new Error("history unavailable"));

    render(
      <MemoryRouter>
        <AiAgentPage />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/Не удалось загрузить сохранённый диалог/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Начать новый чат" })).toBeInTheDocument();
    expect(
      localStorage.getItem(
        "skladx_ai_conversation_id:username%3Abuyer-test%7Crole%3ABUYER"
      )
    ).toBe("unavailable-history");
  });

  it("ignores same-role token rotation but invalidates token or cached-user role changes", () => {
    render(
      <MemoryRouter>
        <AiAgentPage />
      </MemoryRouter>
    );

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "access_token",
        oldValue: jwt("buyer-sub"),
        newValue: jwt("buyer-sub"),
      })
    );
    expect(logoutMock).not.toHaveBeenCalled();

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "skladx_user",
        oldValue: JSON.stringify({ username: "buyer-test", role: "BUYER" }),
        newValue: JSON.stringify({ username: "buyer-test", role: "BUYER" }),
      })
    );
    expect(logoutMock).not.toHaveBeenCalled();

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "access_token",
        oldValue: jwt("buyer-sub", ["BUYER"]),
        newValue: jwt("buyer-sub", ["SELLER"]),
      })
    );
    expect(logoutMock).toHaveBeenCalledTimes(1);

    logoutMock.mockClear();
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "skladx_user",
        oldValue: JSON.stringify({ username: "buyer-test", role: "BUYER" }),
        newValue: JSON.stringify({ username: "buyer-test", role: "SELLER" }),
      })
    );
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it("clears unsent chat and seller-helper state before a role switch is painted", () => {
    useAuthMock.mockReturnValue({
      isLoggedIn: true,
      user: { username: "same-user", role: "SELLER" },
      logout: logoutMock,
    });
    const view = render(
      <MemoryRouter>
        <AiAgentPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "private unsent chat text" },
    });
    fireEvent.click(view.container.querySelector("button[aria-pressed]"));
    const sellerTextareas = screen.getAllByRole("textbox");
    expect(sellerTextareas).toHaveLength(2);
    fireEvent.change(sellerTextareas[0], {
      target: { value: "private unsent listing description" },
    });

    useAuthMock.mockReturnValue({
      isLoggedIn: true,
      user: { username: "same-user", role: "BUYER" },
      logout: logoutMock,
    });
    view.rerender(
      <MemoryRouter>
        <AiAgentPage />
      </MemoryRouter>
    );

    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.queryByDisplayValue("private unsent chat text")).not.toBeInTheDocument();
    expect(
      screen.queryByDisplayValue("private unsent listing description")
    ).not.toBeInTheDocument();
  });

  it("renders a draft SSE event as a DraftLeadCard, then shows the success state after Confirm", async () => {
    streamAiMessageMock.mockImplementation(async ({ onEvent }) => {
      onEvent({ event: "token", data: { text: "Готовлю заявку." } });
      onEvent({
        event: "draft",
        data: {
          draftId: "draft-1",
          type: "LEAD",
          payload: {
            companyName: "Acme LLC",
            contactName: "Ali",
            contactPhone: "+998901234567",
            quantity: 2,
            items: [{ name: "Cement M500", slug: "cement-m500", price: 15000, currency: "UZS" }],
          },
        },
      });
      onEvent({ event: "done", data: { messageId: "m1", conversationId: "conv-1" } });
    });
    confirmDraftMock.mockResolvedValue({ leadId: 555, status: "CONFIRMED" });

    render(
      <MemoryRouter>
        <AiAgentPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText("Спросите что-нибудь...");
    fireEvent.change(input, { target: { value: "20 мешков цемента" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("Cement M500")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Подтвердить" }));

    expect(await screen.findByText(/№555/)).toBeInTheDocument();
    expect(confirmDraftMock).toHaveBeenCalledWith(
      "draft-1",
      expect.objectContaining({ contactName: "Ali", contactPhone: "+998901234567" })
    );
  });
});
