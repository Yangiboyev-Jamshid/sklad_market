import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import MessageBubble from "../MessageBubble";
import { setAiLocale } from "../../i18n";

describe("MessageBubble timestamps", () => {
  beforeEach(() => setAiLocale("en"));

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
