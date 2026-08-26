import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Markdown from "../markdown";

function renderMarkdown(text) {
  return render(
    <MemoryRouter>
      <Markdown text={text} />
    </MemoryRouter>
  );
}

describe("Markdown", () => {
  it("renders bold, italic and inline code", () => {
    renderMarkdown("**bold** and *italic* and `code`");
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("italic").tagName).toBe("EM");
    expect(screen.getByText("code").tagName).toBe("CODE");
  });

  it("renders unordered and ordered lists", () => {
    const { container } = renderMarkdown("- first\n- second");
    expect(container.querySelector("ul")).toBeTruthy();
    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
  });

  it("linkifies an internal /product/... path as a router Link", () => {
    renderMarkdown("See [this product](/product/cement-50kg)");
    const link = screen.getByText("this product");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/product/cement-50kg");
  });

  it("linkifies an internal /company/... path as a router Link", () => {
    renderMarkdown("[Acme Co](/company/acme)");
    const link = screen.getByText("Acme Co");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/company/acme");
  });

  it("never turns an external URL into a clickable link", () => {
    const { container } = renderMarkdown("[click me](https://evil.example.com/steal)");
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("click me (https://evil.example.com/steal)");
  });

  it("never renders raw HTML — it stays as inert text, not a DOM element", () => {
    const { container } = renderMarkdown('<img src=x onerror="alert(1)">');
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
  });

  it("does not treat a script tag as markup", () => {
    const { container } = renderMarkdown("<script>alert(1)</script>");
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>alert(1)</script>");
  });
});
