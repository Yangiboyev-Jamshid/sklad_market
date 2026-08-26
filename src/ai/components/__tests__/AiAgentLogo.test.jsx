import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AiAgentLogo from "../AiAgentLogo";

describe("AiAgentLogo", () => {
  it("renders the shared scalable mark at the requested size", () => {
    render(<AiAgentLogo size={36} label="Sklad AI agent" />);

    const logo = screen.getByRole("img", { name: "Sklad AI agent" });
    expect(logo.getAttribute("src")).toMatch(/^(data:image\/svg\+xml|.*ai-agent-logo\.svg)/);
    expect(logo).toHaveAttribute("width", "36");
    expect(logo).toHaveAttribute("height", "36");
  });
});
