import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Camera, Buildings } from "iconsax-reactjs";
import AppShell from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { getMyUserProfile, updateMyUserProfile, uploadUserPhoto, setUserPhoto } from "../api/api";

const ROLE_LABEL_KEYS = {
  BUYER: "moderator.roleBuyer",
  SELLER: "moderator.roleSeller",
  ADMIN: "moderator.roleAdmin",
  SUPER_ADMIN: "moderator.roleSuperAdmin",
};

export default function UserProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoggedIn, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [telegram, setTelegram] = useState("");
  const [extraPhone, setExtraPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    getMyUserProfile()
      .then((data) => {
        setFirstName(data?.firstName || "");
        setLastName(data?.lastName || "");
        setPosition(data?.position || "");
        setTelegram(data?.telegram || "");
        setExtraPhone(data?.extraPhone || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isLoggedIn, navigate]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setError("");
    try {
      const uploaded = await uploadUserPhoto(file);
      if (!uploaded?.id || !uploaded?.url) throw new Error(t("account.photoUploadFailed"));
      await setUserPhoto(uploaded.id);
      setPhotoPreview(uploaded.url);
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError(t("account.nameRequired"));
      return;
    }
    if (!position.trim() || !telegram.trim() || !extraPhone.trim()) {
      setError(t("account.allFieldsRequired"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateMyUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        position: position.trim(),
        telegram: telegram.trim(),
        extraPhone: extraPhone.trim(),
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const displayPhoto = photoPreview || user?.photoUrl;
  const initials = [firstName, lastName].filter(Boolean).map((s) => s[0]).join("").toUpperCase() || "?";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || t("account.noName");
  const roleLabel = user?.role ? t(ROLE_LABEL_KEYS[user.role] || "") || user.role : null;

  if (loading) {
    return (
      <AppShell>
        <div className="p-5 sm:p-10">
          <div className="h-8 w-48 bg-ink-200 dark:bg-[#1C1C1C] rounded-xl animate-pulse mb-6 sm:mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 sm:gap-6">
            <div className="h-56 rounded-2xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
            <div className="h-80 rounded-2xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-5 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white mb-5 sm:mb-8">
          {t("account.title")}
        </h1>

        {success && (
          <div className="mb-4 p-3 rounded-2xl bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400 text-sm font-medium text-center">
            {t("account.saved")}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-danger-50 dark:bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 sm:gap-6">
          {/* Identity card — stacks above the form on mobile, sits as a sidebar on desktop */}
          <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-5 sm:p-6 flex flex-col items-center text-center h-fit transition-colors">
            <div className="relative shrink-0 mb-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-brand-600 flex items-center justify-center text-white text-3xl font-bold">
                {displayPhoto ? <img src={displayPhoto} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-md disabled:opacity-50 transition-colors"
                aria-label={t("account.changePhoto")}
              >
                {photoUploading ? <span className="animate-spin text-xs">⏳</span> : <Camera size={16} />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            <p className="font-semibold text-ink-900 dark:text-white truncate max-w-full">{fullName}</p>
            <p className="text-xs text-ink-400 dark:text-ink-500 truncate max-w-full">{user?.username}</p>

            {roleLabel && (
              <span className="mt-3 inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                {roleLabel}
              </span>
            )}

            {user?.companyName && (
              <Link
                to="/profile"
                className="mt-3 flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:underline"
              >
                <Buildings size={14} /> {user.companyName}
              </Link>
            )}
          </div>

          {/* Editable fields */}
          <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-5 sm:p-7 transition-colors">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label={`${t("account.firstName")} *`} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <Field label={`${t("account.lastName")} *`} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Field label={`${t("account.position")} *`} value={position} onChange={(e) => setPosition(e.target.value)} placeholder={t("account.positionPlaceholder")} />
              <Field label={`${t("account.telegram")} *`} value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" />
              <Field label={`${t("account.extraPhone")} *`} value={extraPhone} onChange={(e) => setExtraPhone(e.target.value)} placeholder="+998 90 000 00 00" />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto sm:px-10 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {saving ? t("account.saving") : t("account.save")}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{label}</label>
      <input
        className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none placeholder:text-ink-400 dark:text-white"
        {...props}
      />
    </div>
  );
}
