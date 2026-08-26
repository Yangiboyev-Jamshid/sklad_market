import { useEffect, useRef, useState } from "react";
import { CloseCircle, GalleryAdd } from "iconsax-reactjs";
import { t } from "../i18n";
import { deleteListingImage, suggestListing, uploadListingImage } from "../api/aiClient";
import SuggestedListingCard from "./SuggestedListingCard";

const MAX_IMAGES = 4;
const MAX_DESCRIPTION_CHARS = 2000;
const MAX_IMAGE_BYTES = 6_000_000;

async function deleteTemporaryImages(imageIds) {
  const uniqueIds = [...new Set(imageIds.filter(Boolean))];
  await Promise.allSettled(uniqueIds.map((imageId) => deleteListingImage(imageId)));
}

// Seller-only listing-help entry point (PLAN.md Phase 6, C8): paste a description, optionally
// attach photos already uploaded through the platform's own file-service, get a suggested
// category + attributes back. A standalone panel, not part of the streamed chat loop — the
// backend endpoint is plain JSON, not SSE.
export default function SellerListingHelper({ onClose }) {
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]); // Local Files; durable upload begins only on Submit.
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const uploadedIdsRef = useRef(new Set());

  useEffect(() => {
    mountedRef.current = true;
    const uploadedIds = uploadedIdsRef.current;
    return () => {
      mountedRef.current = false;
      const imageIds = [...uploadedIds];
      uploadedIds.clear();
      void deleteTemporaryImages(imageIds);
    };
  }, []);

  const cleanupImageIds = async (imageIds) => {
    imageIds.forEach((imageId) => uploadedIdsRef.current.delete(imageId));
    await deleteTemporaryImages(imageIds);
  };

  const uploadImage = async (entry) => {
    if (entry.file.size > MAX_IMAGE_BYTES) return null;
    setImages((prev) =>
      prev.map((img) =>
        img.key === entry.key ? { ...img, id: null, uploading: true, error: null } : img
      )
    );
    try {
      const uploaded = await uploadListingImage(entry.file);
      if (!uploaded?.id) throw new Error("Upload response did not include an attachment id");
      if (!mountedRef.current) {
        await deleteTemporaryImages([uploaded.id]);
        return null;
      }
      uploadedIdsRef.current.add(uploaded.id);
      setImages((prev) =>
        prev.map((img) =>
          img.key === entry.key
            ? { ...img, id: uploaded.id, uploading: false, error: null }
            : img
        )
      );
      return uploaded.id;
    } catch {
      setImages((prev) =>
        prev.map((img) =>
          img.key === entry.key
            ? { ...img, id: null, uploading: false, error: "upload" }
            : img
        )
      );
      return null;
    }
  };

  const handleAddImages = (fileList) => {
    const files = Array.from(fileList).slice(0, MAX_IMAGES - images.length);
    const entries = files.map((file, index) => ({
      key: `${file.name}-${file.size}-${Date.now()}-${index}`,
      file,
      id: null,
      uploading: false,
      error: file.size > MAX_IMAGE_BYTES ? "too_large" : null,
    }));
    setImages((prev) => [...prev, ...entries]);
  };

  const handleRemoveImage = (key) => {
    if (submitting) return;
    const imageId = images.find((img) => img.key === key)?.id;
    setImages((prev) => prev.filter((img) => img.key !== key));
    if (imageId) void cleanupImageIds([imageId]);
  };

  const handleClose = async () => {
    if (submitting || images.some((image) => image.uploading)) return;
    await cleanupImageIds(images.map((image) => image.id));
    onClose?.();
  };

  const handleSubmit = async () => {
    const trimmed = description.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    const imageIds = [];
    try {
      for (const image of images) {
        const imageId = image.id || (await uploadImage(image));
        if (!imageId) return;
        imageIds.push(imageId);
      }
      const response = await suggestListing({ description: trimmed, imageIds });
      setResult(response);
    } catch {
      setError(t("seller.error"));
    } finally {
      await cleanupImageIds(imageIds);
      if (mountedRef.current) {
        setImages((prev) =>
          prev.map((image) =>
            imageIds.includes(image.id) ? { ...image, id: null, uploading: false } : image
          )
        );
        setSubmitting(false);
      }
    }
  };

  const stillUploading = images.some((img) => img.uploading);
  const hasUploadErrors = images.some((img) => img.error);

  return (
    <div className="rounded-xl border border-ink-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0D0D0D] px-4 sm:px-5 py-4 mb-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="font-semibold text-ink-900 dark:text-white">{t("seller.helperTitle")}</div>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">{t("seller.helperSubtitle")}</p>
        </div>
        {onClose && (
          <button type="button" disabled={submitting || stillUploading} onClick={handleClose} aria-label={t("seller.close")} className="text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 shrink-0 disabled:opacity-40">
            <CloseCircle size={20} />
          </button>
        )}
      </div>

      <label className="block text-xs font-medium text-ink-500 dark:text-ink-400 mb-1">{t("seller.descriptionLabel")}</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_CHARS))}
        placeholder={t("seller.descriptionPlaceholder")}
        rows={3}
        maxLength={MAX_DESCRIPTION_CHARS}
        className="w-full bg-ink-50 dark:bg-[#171717] border border-ink-200 dark:border-[#1C1C1C] rounded-lg px-3 py-2 text-sm outline-none dark:text-white placeholder:text-ink-400 resize-none mb-3"
      />

      <label className="block text-xs font-medium text-ink-500 dark:text-ink-400 mb-1.5">
        {t("seller.imagesLabel", { max: MAX_IMAGES })}
      </label>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {images.map((img) => (
          <div
            key={img.key}
            className={`flex items-center gap-1.5 bg-ink-50 dark:bg-[#171717] border rounded-lg px-2.5 py-1.5 text-xs ${
              img.error
                ? "border-danger-300 dark:border-danger-500/50"
                : "border-ink-200 dark:border-[#1C1C1C]"
            }`}
          >
            <span className="truncate max-w-[140px] text-ink-600 dark:text-ink-300">
              {img.uploading ? t("seller.uploadingImage") : img.file.name}
            </span>
            {img.error && (
              <>
                <span className="text-danger-600" role="alert">
                  {t(img.error === "too_large" ? "seller.imageTooLarge" : "seller.uploadImageError")}
                </span>
                {img.error === "upload" && (
                  <button
                    type="button"
                    onClick={() => uploadImage(img)}
                    aria-label={t("seller.retryImage")}
                    className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
                  >
                    {t("seller.retryImage")}
                  </button>
                )}
              </>
            )}
            <button type="button" disabled={submitting} onClick={() => handleRemoveImage(img.key)} aria-label={t("seller.removeImage")} className="text-ink-400 hover:text-danger-600 disabled:opacity-40">
              <CloseCircle size={14} />
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <label className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 cursor-pointer hover:text-brand-700 transition-colors">
            <GalleryAdd size={16} />
            {t("seller.addImages")}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={submitting}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleAddImages(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!description.trim() || submitting || stillUploading || hasUploadErrors}
        className="bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? t("seller.submitting") : t("seller.submit")}
      </button>

      {error && <div className="text-danger-600 text-xs mt-2">{error}</div>}

      {result && (
        <div className="mt-3">
          <SuggestedListingCard result={result} />
        </div>
      )}
    </div>
  );
}
