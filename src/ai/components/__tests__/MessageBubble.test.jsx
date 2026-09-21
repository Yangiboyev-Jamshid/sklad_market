import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import MessageBubble from "../MessageBubble";
import ChatMessages from "../ChatMessages";
import { setAiLocale } from "../../i18n";

describe("MessageBubble timestamps", () => {
  beforeEach(() => setAiLocale("en"));

  it("keeps plain-text preferences across an assistant turn without hiding confirmation controls", () => {
    const publish = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <MemoryRouter>
        <ChatMessages onPublishIntent={publish} messages={[
          { id: "u1", role: "user", text: "Find steel, plain text only, and draft a buying request" },
          { id: "a1", role: "assistant", text: "Searching." },
          { id: "a2", role: "assistant", text: "Please confirm before publishing.", resultSets: [
            { kind: "business_search", items: [{ type: "PRODUCT", id: 1, slug: "steel", name: "Steel card" }] },
            { kind: "buying_intent_draft", items: [{ intentId: "intent-1", status: "DRAFT", category: "Steel" }] },
          ] },
        ]} />
      </MemoryRouter>
    );
    expect(screen.queryByRole("link", { name: "Steel card" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Publish for matching" }));
    expect(publish).toHaveBeenCalledWith("a2", 1, "intent-1");
    confirm.mockRestore();
  });

  it("shows the saved prompt and output times with machine-readable timestamps", () => {
    const { rerender } = render(
      <MessageBubble
        message={{
          id: "user-1",
          role: "user",
          text: "Find cement",
          createdAt: "2026-08-20T10:00:00Z",
        }}
      />
    );

    const sentAt = screen.getByLabelText(/Sent at/);
    expect(sentAt).toHaveAttribute("datetime", "2026-08-20T10:00:00Z");

    rerender(
      <MessageBubble
        message={{
          id: "assistant-1",
          role: "assistant",
          text: "I found three options.",
          toolEvents: [],
          resultSets: [],
          createdAt: "2026-08-20T10:00:02Z",
        }}
      />
    );

    const respondedAt = screen.getByLabelText(/Responded at/);
    expect(respondedAt).toHaveAttribute("datetime", "2026-08-20T10:00:02Z");
  });
});
