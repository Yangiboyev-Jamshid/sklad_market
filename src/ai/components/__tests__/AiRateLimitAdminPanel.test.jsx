import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AiRateLimitAdminPanel from "../AiRateLimitAdminPanel";
import { setAiLocale } from "../../i18n";

const { listMock, updateMock, resetMock, listRoleQuotasMock, updateRoleQuotaMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  updateMock: vi.fn(),
  resetMock: vi.fn(),
  listRoleQuotasMock: vi.fn(),
  updateRoleQuotaMock: vi.fn(),
}));

vi.mock("../../api/aiClient", () => ({
  listAiRateLimits: listMock,
  listAiRoleQuotas: listRoleQuotasMock,
  updateAiRateLimit: updateMock,
  updateAiRoleQuota: updateRoleQuotaMock,
  resetAiRateLimit: resetMock,
}));

describe("AiRateLimitAdminPanel", () => {
  beforeEach(() => {
    setAiLocale("en");
    listMock.mockReset();
    updateMock.mockReset();
    resetMock.mockReset();
    listRoleQuotasMock.mockReset();
    updateRoleQuotaMock.mockReset();
    listRoleQuotasMock.mockResolvedValue([]);
  });

  it("is isolated from non-admin chat users", () => {
    render(<AiRateLimitAdminPanel role="BUYER" />);
    expect(screen.queryByText("AI usage controls")).not.toBeInTheDocument();
    expect(listMock).not.toHaveBeenCalled();
  });

  it("lets an admin change one user's chat-only RPM", async () => {
    listMock.mockResolvedValue([
      {
        userSub: "user-sub-1",
        username: "buyer@example.com",
        requestsPerMinute: null,
        effectiveRequestsPerMinute: 10,
        dailyTokenBudget: null,
        effectiveDailyTokenBudget: 200000,
        usedTokensToday: 1000,
        remainingTokensToday: 199000,
      },
    ]);
    updateMock.mockResolvedValue({
      userSub: "user-sub-1",
      username: "buyer@example.com",
      requestsPerMinute: 30,
      effectiveRequestsPerMinute: 30,
      dailyTokenBudget: 2000000,
      effectiveDailyTokenBudget: 2000000,
      usedTokensToday: 1000,
      remainingTokensToday: 1999000,
    });

    render(<AiRateLimitAdminPanel role="SUPER_ADMIN" />);
    fireEvent.click(screen.getByRole("button", { name: /AI usage controls/i }));

    const input = await screen.findByRole("spinbutton", {
      name: "Requests per minute for buyer@example.com",
    });
    const budgetInput = screen.getByRole("spinbutton", {
      name: "Daily token budget for buyer@example.com",
    });
    fireEvent.change(input, { target: { value: "30" } });
    fireEvent.change(budgetInput, { target: { value: "2000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledWith("user-sub-1", {
      requestsPerMinute: 30,
      dailyTokenBudget: 2000000,
    }));
    expect(input).toHaveValue(30);
  });

  it("loads data-driven role quotas and can add a future role", async () => {
    listMock.mockResolvedValue([]);
    listRoleQuotasMock.mockResolvedValue([
      { roleName: "BUYER", hourlyRequestLimit: 120, dailyRequestLimit: 500 },
    ]);
    updateRoleQuotaMock.mockResolvedValue({
      roleName: "PREMIUM",
      hourlyRequestLimit: 300,
      dailyRequestLimit: 3000,
    });

    render(<AiRateLimitAdminPanel role="ADMIN" />);
    fireEvent.click(screen.getByRole("button", { name: /AI usage controls/i }));

    expect(await screen.findByDisplayValue("120")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "New AI quota role" }), {
      target: { value: "premium" },
    });
    fireEvent.change(screen.getByRole("spinbutton", {
      name: "Hourly request limit for the new role",
    }), { target: { value: "300" } });
    fireEvent.change(screen.getByRole("spinbutton", {
      name: "Daily request limit for the new role",
    }), { target: { value: "3000" } });
    fireEvent.click(screen.getByRole("button", { name: "Add role" }));

    await waitFor(() => expect(updateRoleQuotaMock).toHaveBeenCalledWith("PREMIUM", {
      hourlyRequestLimit: 300,
      dailyRequestLimit: 3000,
    }));
    expect(await screen.findByText("PREMIUM")).toBeInTheDocument();
  });
});
