import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DraftLeadCard from "../DraftLeadCard";

const basePayload = {
  companyName: "Acme LLC",
  quantity: 3,
  contactName: "Ali Valiyev",
  contactPhone: "+998901234567",
  contactEmail: "",
  deliveryAddress: "",
  neededDate: "",
  comment: "",
  items: [{ name: "Cement M500", slug: "cement-m500", price: 15000, currency: "UZS" }],
};

function draft(overrides) {
  return { draftId: "draft-1", type: "LEAD", status: "pending", pending: false, payload: basePayload, ...overrides };
}

describe("DraftLeadCard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders items, seller, and pre-filled contact fields", () => {
    render(<DraftLeadCard draft={draft()} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText("Cement M500")).toBeInTheDocument();
    expect(screen.getByText(/Acme LLC/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ali Valiyev")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+998901234567")).toBeInTheDocument();
  });

  it("confirm sends the edited contact fields, not the original ones", () => {
    const onConfirm = vi.fn();
    render(<DraftLeadCard draft={draft()} onConfirm={onConfirm} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByDisplayValue("+998901234567"), { target: { value: "+998900000000" } });
    fireEvent.click(screen.getByRole("button", { name: /Подтвердить/i }));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ contactName: "Ali Valiyev", contactPhone: "+998900000000" })
    );
  });

  it("cancel button invokes onCancel", () => {
    const onCancel = vi.fn();
    render(<DraftLeadCard draft={draft()} onConfirm={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /Отменить/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables both buttons while an action is pending", () => {
    render(<DraftLeadCard draft={draft({ pending: true })} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Подтвердить/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Отменить/i })).toBeDisabled();
  });

  it("shows an inline error without losing the form", () => {
    render(<DraftLeadCard draft={draft({ error: "boom" })} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText(/Не удалось выполнить действие/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Подтвердить/i })).toBeEnabled();
  });

  it("renders a confirmed summary instead of the form once confirmed", () => {
    render(<DraftLeadCard draft={draft({ status: "confirmed", leadId: 101 })} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText(/101/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Подтвердить/i })).not.toBeInTheDocument();
  });

  it("renders a cancelled summary instead of the form once cancelled", () => {
    render(<DraftLeadCard draft={draft({ status: "cancelled" })} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText(/Заявка отменена/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Отменить/i })).not.toBeInTheDocument();
  });
});
