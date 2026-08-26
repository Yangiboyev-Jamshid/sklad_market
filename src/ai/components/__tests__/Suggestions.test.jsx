import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Suggestions from "../Suggestions";
import ru from "../../i18n/ru";

describe("Suggestions", () => {
  it("renders only the base suggestions for a buyer / no role", () => {
    render(<Suggestions onSelect={vi.fn()} />);

    for (const item of ru.suggestions.items) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    for (const item of ru.suggestions.sellerItems) {
      expect(screen.queryByText(item)).not.toBeInTheDocument();
    }
    for (const item of ru.suggestions.adminItems) {
      expect(screen.queryByText(item)).not.toBeInTheDocument();
    }
  });

  it("adds seller-specific suggestions for role=SELLER", () => {
    render(<Suggestions onSelect={vi.fn()} role="SELLER" />);

    for (const item of ru.suggestions.sellerItems) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    for (const item of ru.suggestions.adminItems) {
      expect(screen.queryByText(item)).not.toBeInTheDocument();
    }
  });

  it("adds admin-specific suggestions for role=ADMIN and role=SUPER_ADMIN", () => {
    const { unmount } = render(<Suggestions onSelect={vi.fn()} role="ADMIN" />);
    for (const item of ru.suggestions.adminItems) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    unmount();

    render(<Suggestions onSelect={vi.fn()} role="SUPER_ADMIN" />);
    for (const item of ru.suggestions.adminItems) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
  });
});
