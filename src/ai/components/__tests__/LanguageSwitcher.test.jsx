import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LanguageSwitcher from "../LanguageSwitcher";
import { getAiLocale, setAiLocale } from "../../i18n";

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
    setAiLocale("ru");
  });

  it("changes the single platform and AI locale together", () => {
    render(<LanguageSwitcher alwaysVisible />);

    fireEvent.click(screen.getByRole("button", { name: "Язык" }));
    fireEvent.click(screen.getByRole("button", { name: /English/ }));

    expect(getAiLocale()).toBe("en");
    expect(localStorage.getItem("skladx_lang")).toBe("en");
    expect(screen.getByRole("button", { name: "Language" })).toHaveTextContent("EN");
  });

  it("persists the switch across independently-mounted instances", () => {
    const { unmount } = render(<LanguageSwitcher alwaysVisible />);
    fireEvent.click(screen.getByRole("button", { name: "Язык" }));
    fireEvent.click(screen.getByRole("button", { name: /O'zbekcha/ }));
    unmount();

    render(<LanguageSwitcher alwaysVisible />);
    expect(screen.getByRole("button", { name: "Til" })).toHaveTextContent("UZ");
  });
});
