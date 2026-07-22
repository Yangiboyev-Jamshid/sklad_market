import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Export, TickCircle, Edit2, ShieldTick, Location } from "iconsax-reactjs";
import {
  getMyCompany,
  updateCompany,
  updateCompanyLocation,
  uploadCompanyLogo,
  uploadCompanyBackground,
  submitCompanyVerification,
} from "../../api/api";
import CreateCompanyForm from "../company/CreateCompanyForm";
import MapView from "../ui/MapView";
import { useAuth } from "../../context/AuthContext";
import { geocodeAddress, reverseGeocode } from "../../utils/geo";
import { tariffPlans } from "../../data/mockData";

const VERIFICATION_BADGE_KEYS = {
  VERIFIED: { labelKey: "profile.verifiedStatus", cls: "text-success-600 dark:text-success-400" },
  PENDING: { labelKey: "profile.pendingStatus", cls: "text-amber-500 dark:text-amber-400" },
  DRAFT: { labelKey: "profile.draftStatus", cls: "text-ink-400 dark:text-ink-500" },
  REJECTED: { labelKey: "profile.rejectedStatus", cls: "text-danger-500 dark:text-danger-400" },
};

const REQUIRED_COMPANY_FIELD_KEYS = {
  stir: "seller.requiredFieldStir",
  phonePrimary: "seller.fieldPhone",
  address: "seller.requiredFieldAddress",
  lat: "seller.requiredFieldLat",
  lng: "seller.requiredFieldLng",
};

function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

async function resolveRequiredCompanyFields(company, overrides) {
  const merged = { ...company, ...overrides };
  if ((isEmpty(merged.lat) || isEmpty(merged.lng)) && !isEmpty(merged.address)) {
    const { coords } = await geocodeAddress(merged.address);
    if (coords) {
      merged.lat = String(coords.lat);
      merged.lng = String(coords.lng);
    }
  }
  const missing = Object.keys(REQUIRED_COMPANY_FIELD_KEYS).filter((k) => isEmpty(merged[k]));
  return { merged, missing };
}

export default function SettingsTab() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isSeller = user?.accountType === "seller";

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({});
  const [logoUploading, setLogoUploading] = useState(false);
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const logoInputRef = useRef(null);
  const backgroundInputRef = useRef(null);

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pickedCoords, setPickedCoords] = useState(null);
  const [pickedCity, setPickedCity] = useState("");
  const [resolvingCity, setResolvingCity] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    getMyCompany()
      .then(setCompany)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    setLogoUploading(true);
    setError("");
    try {
      const result = await uploadCompanyLogo(company.id, file);
      if (!result?.url) throw new Error(t("seller.logoUploadFailed"));
      setCompany((prev) => ({ ...prev, logoUrl: result.url }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    setBackgroundUploading(true);
    setError("");
    try {
      const result = await uploadCompanyBackground(company.id, file);
      if (!result?.url) throw new Error(t("seller.backgroundUploadFailed"));
      setCompany((prev) => ({ ...prev, backgroundUrl: result.url }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setBackgroundUploading(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!company) return;
    setVerifying(true);
    setError("");
    let fresh;
    try {
      fresh = await getMyCompany();
      setCompany(fresh);
    } catch (err) {
      setError(err.message);
      setVerifying(false);
      return;
    }
    if (!["DRAFT", "REJECTED"].includes(fresh.verificationStatus)) {
      setError(t("seller.alreadySentOrVerified"));
      setVerifying(false);
      return;
    }
    const missing = Object.keys(REQUIRED_COMPANY_FIELD_KEYS).filter((k) => isEmpty(fresh[k]));
    if (missing.length > 0) {
      setError(t("seller.fillBeforeVerification", { fields: missing.map((k) => t(REQUIRED_COMPANY_FIELD_KEYS[k])).join(", ") }));
      setVerifying(false);
      return;
    }
    if (!window.confirm(t("seller.confirmSendVerification"))) {
      setVerifying(false);
      return;
    }
    try {
      await submitCompanyVerification(fresh.id);
      setCompany((prev) => ({ ...prev, verificationStatus: "PENDING" }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const toggleMapPicker = () => {
    if (!showMapPicker) {
      const hasCoords = company?.lat && company?.lng;
      setPickedCoords(hasCoords ? { lat: Number(company.lat), lng: Number(company.lng) } : null);
      setPickedCity("");
    }
    setShowMapPicker((v) => !v);
  };

  const handleMapPick = (coords) => {
    setPickedCoords(coords);
    setPickedCity("");
    setResolvingCity(true);
    reverseGeocode(coords.lat, coords.lng, { lang: i18n.language })
      .then(({ city }) => setPickedCity(city || ""))
      .finally(() => setResolvingCity(false));
  };

  const saveLocation = async () => {
    if (!company || !pickedCoords) return;
    setSavingLocation(true);
    setError("");
    try {
      const address = pickedCity || company.address;
      const updated = await updateCompanyLocation(company.id, { ...pickedCoords, address });
      const next = {
        ...company,
        ...updated,
        address,
        lat: String(pickedCoords.lat),
        lng: String(pickedCoords.lng),
      };

      setCompany(next);
      setShowMapPicker(false);
      setPickedCity("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingLocation(false);
    }
  };

  const startEditProfile = () => {
    setProfileDraft({
      name: company?.name ?? "",
      shortDescription: company?.shortDescription ?? "",
      description: company?.description ?? "",
      stir: company?.stir ?? "",
      phonePrimary: company?.phonePrimary ?? "",
      phoneSecondary: company?.phoneSecondary ?? "",
      website: company?.website ?? "",
      address: company?.address ?? "",
    });
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    if (!company) return;
    setSaving(true);
    setError("");
    try {
      const { merged, missing } = await resolveRequiredCompanyFields(company, profileDraft);
      if (missing.length > 0) {
        setError(
          t("seller.cannotSaveMissingFields", { fields: missing.map((k) => t(REQUIRED_COMPANY_FIELD_KEYS[k])).join(", ") })
        );
        return;
      }
      const updated = await updateCompany(company.id, {
        shortDescription: merged.shortDescription,
        description: merged.description,
        stir: merged.stir,
        phoneSecondary: merged.phoneSecondary,
        regionId: merged.regionId,
        districtId: merged.districtId,
        address: merged.address,
        lat: merged.lat,
        lng: merged.lng,
        companyCreatedDate: merged.companyCreatedDate,
        ...profileDraft,
      });
      setCompany({ ...company, ...merged, ...profileDraft, ...updated });
      setEditingProfile(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse mb-3" />
          ))}
        </div>
      </div>
    );
  }

  if (!company) {
    if (!isSeller) {
      return (
        <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-6 sm:p-10 max-w-lg mx-auto text-center transition-colors">
          <p className="font-semibold text-lg text-ink-900 dark:text-white mb-1">{t("profile.createUnavailable")}</p>
          <p className="text-sm text-ink-400 dark:text-ink-500">
            {t("profile.createUnavailableDesc")}
          </p>
        </div>
      );
    }
    return (
      <CreateCompanyForm
        onCreated={(c) => {
          setError("");
          setCompany(c);
        }}
      />
    );
  }

  const vStatusInfo = VERIFICATION_BADGE_KEYS[company?.verificationStatus] ?? VERIFICATION_BADGE_KEYS.DRAFT;
  const vStatus = { label: t(vStatusInfo.labelKey), cls: vStatusInfo.cls };

  const fields = [
    { key: "name", label: t("seller.fieldCompanyName") },
    { key: "shortDescription", label: t("seller.fieldIndustry") },
    { key: "stir", label: t("profile.stir") },
    { key: "phonePrimary", label: t("seller.fieldPhone") },
    { key: "phoneSecondary", label: t("seller.fieldEmail") },
    { key: "website", label: t("seller.fieldWebsite") },
    { key: "address", label: t("seller.fieldCity") },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {success && (
        <div className="text-sm text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-500/10 rounded-2xl p-3 text-center">
          {t("seller.companyDataUpdated")}
        </div>
      )}
      {error && (
        <div className="text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 rounded-2xl p-3 text-center">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
        <p className="font-semibold text-[24px] text-ink-900 dark:text-white mb-4 sm:mb-5">{t("seller.companyProfile")}</p>

        <div className="flex sm:flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#F0F0F0] dark:border-[#1C1C1C] mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <>{company.name.split(" ")?.[0]?.[0] || ' '}{company.name.split(" ")?.[1]?.[0] || ' '}</>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900 dark:text-white flex items-center gap-1.5">
                <span translate="no" className="notranslate">{company?.name}</span>
                {company?.verificationStatus === "VERIFIED" && (
                  <TickCircle size={18} variant="Outline" className="text-brand-500" />
                )}
              </p>
              {company?.stir && (
                <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">
                  {t("profile.stir")}: {company.stir}
                </p>
              )}
              <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">
                {company?.address}
              </p>
              {company?.verificationStatus !== "VERIFIED" && (
                <p className={`text-xs mt-0.5 ${vStatus.cls}`}>{vStatus.label}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="flex items-center gap-2 border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 text-sm font-medium px-4 py-2.5 rounded-xl text-ink-700 dark:text-ink-200 transition-colors shrink-0 disabled:opacity-50"
            >
              {logoUploading ? <span className="animate-spin">⏳</span> : <Export size={20} />}
              {t("seller.logo")}
            </button>
            <input ref={backgroundInputRef} type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
            <button
              onClick={() => backgroundInputRef.current?.click()}
              disabled={backgroundUploading}
              className="flex items-center gap-2 border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 text-sm font-medium px-4 py-2.5 rounded-xl text-ink-700 dark:text-ink-200 transition-colors shrink-0 disabled:opacity-50"
            >
              {backgroundUploading ? <span className="animate-spin">⏳</span> : <Export size={20} />}
              {t("seller.background")}
            </button>
            {(company?.verificationStatus === "DRAFT" || company?.verificationStatus === "REJECTED") && (
              <button
                onClick={handleSubmitVerification}
                disabled={verifying}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0"
              >
                <ShieldTick size={18} /> {verifying ? "..." : t("seller.toVerification")}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col divide-y divide-[#F0F0F0] dark:divide-[#1C1C1C]">
          {fields.map((f) => (
            <div key={f.key} className="grid grid-cols-2 sm:flex items-center justify-between gap-3 py-3.5">
              <p className="text-sm sm:text-xs text-ink-400 dark:text-ink-500 shrink-0 sm:w-40">{f.label}</p>
              {editingProfile ? (
                <input
                  value={profileDraft[f.key] ?? ""}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="sm:flex-1 bg-ink-50 dark:bg-[#171717] border border-brand-400 dark:border-brand-500 rounded-xl px-3 py-1.5 text-sm outline-none dark:text-white"
                />
              ) : (
                <p className="sm:flex-1 text-sm font-medium text-ink-900 dark:text-white truncate text-left">{company?.[f.key] || "—"}</p>
              )}
            </div>
          ))}
        </div>

        <div className="py-3.5 border-t border-[#F0F0F0] dark:border-[#1C1C1C]">
          <p className="text-sm sm:text-xs text-ink-400 dark:text-ink-500 mb-2">{t("seller.fieldDescription")}</p>
          {editingProfile ? (
            <textarea
              value={profileDraft.description ?? ""}
              onChange={(e) => setProfileDraft((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t("seller.fieldDescriptionPlaceholder")}
              rows={4}
              className="w-full bg-ink-50 dark:bg-[#171717] border border-brand-400 dark:border-brand-500 rounded-xl px-3 py-2 text-sm outline-none dark:text-white resize-none"
            />
          ) : (
            <p className="text-sm font-medium text-ink-900 dark:text-white whitespace-pre-line">{company?.description || "—"}</p>
          )}
        </div>

        <div className="mt-4">
          {editingProfile ? (
            <div className="flex items-center gap-2">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex-1 sm:flex-none sm:px-6 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
              >
                {saving ? t("seller.saving") : t("seller.save")}
              </button>
              <button
                onClick={() => setEditingProfile(false)}
                className="px-4 py-3 rounded-xl border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 text-sm font-medium text-ink-600 dark:text-ink-300 transition-colors"
              >
                {t("seller.cancel")}
              </button>
            </div>
          ) : (
            <button
              onClick={startEditProfile}
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 text-sm font-medium py-3 px-6 rounded-xl text-ink-700 dark:text-ink-200 transition-colors"
            >
              <Edit2 size={16} /> {t("seller.edit")}
            </button>
          )}
        </div>

        <div className="pt-4 mt-2 border-t border-[#F0F0F0] dark:border-[#1C1C1C]">
          <button
            onClick={toggleMapPicker}
            className="flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            <Location size={16} /> {showMapPicker ? t("seller.hideMap") : t("seller.changeOnMap")}
          </button>

          {showMapPicker && (
            <div className="mt-3 flex flex-col gap-3">
              <MapView height="h-[280px] sm:h-[380px]" center={pickedCoords} onPick={handleMapPick} />
              {resolvingCity ? (
                <p className="text-xs text-ink-400 dark:text-ink-500">{t("seller.resolvingCity")}</p>
              ) : pickedCity ? (
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  {t("seller.detectedCity")}: <span className="font-medium text-ink-900 dark:text-white">{pickedCity}</span>
                </p>
              ) : (
                <p className="text-xs text-ink-400 dark:text-ink-500">{t("seller.tapMapToSetLocation")}</p>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={saveLocation}
                  disabled={!pickedCoords || savingLocation}
                  className="flex-1 sm:flex-none sm:px-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {savingLocation ? t("seller.saving") : t("seller.saveLocation")}
                </button>
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="px-4 py-2.5 rounded-xl border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 text-sm font-medium text-ink-600 dark:text-ink-300 transition-colors"
                >
                  {t("seller.cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
        <p className="font-semibold text-lg text-ink-900 dark:text-white mb-4">{t("seller.tariffPlan")}</p>
        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4">
          {tariffPlans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-4 border transition-colors ${plan.highlight
                ? "border-brand-400 dark:border-brand-500 bg-brand-50/60 dark:bg-brand-500/10"
                : "border-ink-100 dark:border-[#1C1C1C]"
                }`}
            >
              <p className="font-bold text-ink-900 dark:text-white">{plan.name}</p>
              <p className="text-xs text-ink-400 dark:text-ink-500 mb-3">{plan.price}</p>
              <ul className="flex flex-col gap-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs text-ink-600 dark:text-ink-300 flex items-center gap-1.5">
                    <span className="text-brand-500 dark:text-brand-400 font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
