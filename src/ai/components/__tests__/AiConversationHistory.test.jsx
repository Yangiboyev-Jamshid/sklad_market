import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AiConversationHistory from "../AiConversationHistory";
import { setAiLocale } from "../../i18n";

const { listConversationsMock } = vi.hoisted(() => ({
  listConversationsMock: vi.fn(),
}));

vi.mock("../../api/aiClient", () => ({
  listConversations: listConversationsMock,
}));

function sessions(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `conversation-${index + 1}`,
    title: `Session ${index + 1}`,
    updatedAt: `2026-08-${String(20 - index).padStart(2, "0")}T10:00:00Z`,
  }));
}

describe("AiConversationHistory", () => {
  beforeEach(() => {
    setAiLocale("en");
    listConversationsMock.mockReset();
  });

  it("shows only the 15 newest sessions and supports switching and New Chat", async () => {
    const onSelect = vi.fn();
    const onNewChat = vi.fn();
    listConversationsMock.mockResolvedValue({ items: sessions(16) });

    render(
      <AiConversationHistory
        accountKey="buyer-1"
        activeConversationId="conversation-1"
        chatStatus="idle"
        onSelect={onSelect}
        onNewChat={onNewChat}
      />
    );

    expect(await screen.findByText("Session 1")).toBeInTheDocument();
    expect(screen.getByText("Session 15")).toBeInTheDocument();
    expect(screen.queryByText("Session 16")).not.toBeInTheDocument();
    expect(listConversationsMock).toHaveBeenCalledWith({
      page: 1,
      per_page: 15,
      signal: expect.any(AbortSignal),
    });

    const activeButton = screen.getByRole("button", { name: "Session 1" });
    expect(activeButton).toHaveAttribute("aria-current", "true");
    fireEvent.click(screen.getByRole("button", { name: "Session 2" }));
    expect(onSelect).toHaveBeenCalledWith("conversation-2");

    fireEvent.click(screen.getByRole("button", { name: "New chat" }));
    expect(onNewChat).toHaveBeenCalledTimes(1);
  });

  it("contains history failures and retries without affecting chat controls", async () => {
    listConversationsMock
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ items: [] });

    render(
      <AiConversationHistory
        accountKey="buyer-1"
        chatStatus="idle"
        onNewChat={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    expect(await screen.findByText("Chat history is temporarily unavailable.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(listConversationsMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/saved chats will appear here/i)).toBeInTheDocument();
  });
});
