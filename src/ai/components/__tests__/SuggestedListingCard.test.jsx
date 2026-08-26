import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SuggestedListingCard from "../SuggestedListingCard";

const result = {
  category: { slug: "cement", name: "Цемент" },
  categoryConfidence: 0.87,
  attributes: [
    { code: "grade", label: "Марка", dataType: "SELECT", value: "M500" },
    { code: "weightKg", label: "Вес (кг)", dataType: "NUMBER", value: 50 },
  ],
  missingRequired: ["packaging"],
  notes: null,
};

describe("SuggestedListingCard", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("renders the suggested category, confidence, and attributes", () => {
    render(<SuggestedListingCard result={result} />);

    expect(screen.getByText("Цемент")).toBeInTheDocument();
    expect(screen.getByText(/87%/)).toBeInTheDocument();
    expect(screen.getByText(/M500/)).toBeInTheDocument();
    expect(screen.getByText(/Вес \(кг\)/)).toBeInTheDocument();
  });

  it("lists missing required attributes", () => {
    render(<SuggestedListingCard result={result} />);
    expect(screen.getByText(/packaging/)).toBeInTheDocument();
  });

  it("copy button writes the field value to the clipboard", async () => {
    render(<SuggestedListingCard result={result} />);

    const copyButtons = screen.getAllByRole("button", { name: /Копировать/i });
    fireEvent.click(copyButtons[1]); // the "grade" attribute row

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("M500");
    expect(await screen.findByText("Скопировано")).toBeInTheDocument();
  });

  it("shows the empty-category message when nothing was matched", () => {
    render(<SuggestedListingCard result={{ category: null, attributes: [], missingRequired: [], notes: "no active categories" }} />);

    expect(screen.getByText(/Не удалось уверенно подобрать категорию/i)).toBeInTheDocument();
    expect(screen.getByText(/no active categories/)).toBeInTheDocument();
  });

  it("shows the empty-attributes message when the category has no configured attributes", () => {
    render(<SuggestedListingCard result={{ category: { slug: "x", name: "X" }, categoryConfidence: 0.5, attributes: [], missingRequired: [] }} />);

    expect(screen.getByText(/Для этой категории нет характеристик/i)).toBeInTheDocument();
  });

  it("renders nothing for a null result", () => {
    const { container } = render(<SuggestedListingCard result={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
