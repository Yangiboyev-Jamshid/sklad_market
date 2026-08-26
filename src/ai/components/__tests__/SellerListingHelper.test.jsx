import { describe, it, expect, vi, beforeEach } from "vitest";
import { StrictMode } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SellerListingHelper from "../SellerListingHelper";

const { suggestListingMock, uploadListingImageMock, deleteListingImageMock } = vi.hoisted(() => ({
  suggestListingMock: vi.fn(),
  uploadListingImageMock: vi.fn(),
  deleteListingImageMock: vi.fn(),
}));

vi.mock("../../api/aiClient", () => ({
  suggestListing: suggestListingMock,
  uploadListingImage: uploadListingImageMock,
  deleteListingImage: deleteListingImageMock,
}));

describe("SellerListingHelper", () => {
  beforeEach(() => {
    suggestListingMock.mockReset();
    uploadListingImageMock.mockReset();
    deleteListingImageMock.mockReset().mockResolvedValue(true);
  });

  it("submits the description and renders the returned suggestion", async () => {
    suggestListingMock.mockResolvedValue({
      category: { slug: "cement", name: "Цемент" },
      categoryConfidence: 0.9,
      attributes: [{ code: "grade", label: "Марка", dataType: "SELECT", value: "M500" }],
      missingRequired: [],
      notes: null,
    });

    render(<SellerListingHelper />);

    fireEvent.change(screen.getByPlaceholderText(/цемент М500/i), {
      target: { value: "Цемент М500 в мешках по 50кг" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Предложить категорию" }));

    expect(await screen.findByText("Цемент")).toBeInTheDocument();
    expect(suggestListingMock).toHaveBeenCalledWith({
      description: "Цемент М500 в мешках по 50кг",
      imageIds: [],
    });
  });

  it("submit button is disabled until a non-blank description is entered", () => {
    render(<SellerListingHelper />);
    expect(screen.getByRole("button", { name: "Предложить категорию" })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/цемент М500/i), { target: { value: "  " } });
    expect(screen.getByRole("button", { name: "Предложить категорию" })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/цемент М500/i), { target: { value: "cement" } });
    expect(screen.getByRole("button", { name: "Предложить категорию" })).toBeEnabled();
  });

  it("keeps a selected image local until Submit, then uploads and includes its id", async () => {
    uploadListingImageMock.mockResolvedValue({ id: "img-123.jpg" });
    suggestListingMock.mockResolvedValue({ category: null, attributes: [], missingRequired: [] });

    render(<SellerListingHelper />);

    fireEvent.change(screen.getByPlaceholderText(/цемент М500/i), { target: { value: "cement bags" } });
    const file = new File(["fake"], "cement.jpg", { type: "image/jpeg" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await screen.findByText("cement.jpg");
    expect(uploadListingImageMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Предложить категорию" }));

    await waitFor(() => expect(uploadListingImageMock).toHaveBeenCalledWith(file));
    await waitFor(() =>
      expect(suggestListingMock).toHaveBeenCalledWith({ description: "cement bags", imageIds: ["img-123.jpg"] })
    );
    await waitFor(() => expect(deleteListingImageMock).toHaveBeenCalledWith("img-123.jpg"));
  });

  it("shows a failed upload and lets the seller retry it", async () => {
    uploadListingImageMock
      .mockRejectedValueOnce(new Error("upload failed"))
      .mockResolvedValueOnce({ id: "img-retried.jpg" });
    suggestListingMock.mockResolvedValue({ category: null, attributes: [], missingRequired: [] });

    render(
      <StrictMode>
        <SellerListingHelper />
      </StrictMode>
    );
    fireEvent.change(screen.getByPlaceholderText(/цемент М500/i), {
      target: { value: "cement bags" },
    });
    const file = new File(["fake"], "failed.jpg", { type: "image/jpeg" });
    fireEvent.change(document.querySelector('input[type="file"]'), {
      target: { files: [file] },
    });

    expect(uploadListingImageMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Предложить категорию" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось загрузить");
    expect(screen.getByRole("button", { name: "Предложить категорию" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    await waitFor(() => expect(uploadListingImageMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Предложить категорию" }));
    await waitFor(() =>
      expect(suggestListingMock).toHaveBeenCalledWith({
        description: "cement bags",
        imageIds: ["img-retried.jpg"],
      })
    );
  });

  it("best-effort deletes already uploaded temporary images after a partial upload failure", async () => {
    uploadListingImageMock
      .mockResolvedValueOnce({ id: "temporary-first.jpg" })
      .mockRejectedValueOnce(new Error("second upload failed"));

    render(<SellerListingHelper />);
    fireEvent.change(screen.getByPlaceholderText(/цемент М500/i), {
      target: { value: "cement with two photos" },
    });
    const first = new File(["one"], "one.jpg", { type: "image/jpeg" });
    const second = new File(["two"], "two.jpg", { type: "image/jpeg" });
    fireEvent.change(document.querySelector('input[type="file"]'), {
      target: { files: [first, second] },
    });

    fireEvent.click(screen.getByRole("button", { name: "Предложить категорию" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось загрузить");
    await waitFor(() =>
      expect(deleteListingImageMock).toHaveBeenCalledWith("temporary-first.jpg")
    );
    expect(suggestListingMock).not.toHaveBeenCalled();
  });

  it("shows a localized error message when the request fails", async () => {
    suggestListingMock.mockRejectedValue(new Error("boom"));

    render(<SellerListingHelper />);
    fireEvent.change(screen.getByPlaceholderText(/цемент М500/i), { target: { value: "cement" } });
    fireEvent.click(screen.getByRole("button", { name: "Предложить категорию" }));

    expect(await screen.findByText(/Не удалось получить предложение/i)).toBeInTheDocument();
  });

  it("calls onClose when the close button is pressed", async () => {
    const onClose = vi.fn();
    render(<SellerListingHelper onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Закрыть"));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(uploadListingImageMock).not.toHaveBeenCalled();
  });

  it("removing a queued image before Submit creates no attachment", () => {
    render(<SellerListingHelper />);
    const file = new File(["fake"], "remove-me.jpg", { type: "image/jpeg" });
    fireEvent.change(document.querySelector('input[type="file"]'), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole("button", { name: "Убрать" }));

    expect(screen.queryByText("remove-me.jpg")).not.toBeInTheDocument();
    expect(uploadListingImageMock).not.toHaveBeenCalled();
  });

  it("rejects images over 6 MB locally before any upload", async () => {
    render(<SellerListingHelper />);
    const file = new File(["oversized"], "too-large.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 6_000_001 });
    fireEvent.change(document.querySelector('input[type="file"]'), {
      target: { files: [file] },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Изображение больше 6 МБ");
    expect(uploadListingImageMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Предложить категорию" })).toBeDisabled();
  });
});
