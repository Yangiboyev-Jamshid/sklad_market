import { useState, useEffect, useRef } from "react";
import { Export, TickCircle, Edit2, CloseCircle, ShieldTick } from "iconsax-reactjs";
import {
  getMyCompany,
  updateCompany,
  uploadCompanyLogo,
  submitCompanyVerification,
} from "../../api/api";
import CreateCompanyForm from "../company/CreateCompanyForm";
import { useAuth } from "../../context/AuthContext";
import { getCurrentCoords } from "../../utils/geo";
import { tariffPlans } from "../../data/mockData";

const VERIFICATION_BADGE = {
  VERIFIED: { label: "Верифицирован", cls: "text-success-600 dark:text-success-400" },
  PENDING: { label: "На проверке", cls: "text-amber-500 dark:text-amber-400" },
  DRAFT: { label: "Черновик", cls: "text-ink-400 dark:text-ink-500" },
  REJECTED: { label: "Отклонён", cls: "text-danger-500 dark:text-danger-400" },
};

// Backend отклоняет ЛЮБОЕ обновление компании, если хоть одно из этих полей
// пусто — даже если меняется совсем другое поле. lat/lng можно молча
// восстановить через геолокацию; для остальных источника данных нет, поэтому
// сохранение просто нужно понятно объяснить, а не падать с сырой ошибкой бэкенда.
const REQUIRED_COMPANY_FIELDS = {
  stir: "ИНН (STIR)",
  phonePrimary: "Телефон",
  address: "Адрес",
  regionId: "ID региона",
  districtId: "ID района",
  lat: "Широта (lat)",
  lng: "Долгота (lng)",
};

function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

// Resolves lat/lng silently via geolocation when the stored company record
// doesn't have them yet, then reports which required fields are still
// missing (nothing this function can recover without asking the user).
async function resolveRequiredCompanyFields(company, overrides) {
  const merged = { ...company, ...overrides };
  if (isEmpty(merged.lat) || isEmpty(merged.lng)) {
    const coords = await getCurrentCoords();
    if (coords) {
      merged.lat = String(coords.lat);
      merged.lng = String(coords.lng);
    }
  }
  const missing = Object.keys(REQUIRED_COMPANY_FIELDS).filter((k) => isEmpty(merged[k]));
  return { merged, missing };
}

export default function SettingsTab() {
  const { user } = useAuth();
  const isSeller = user?.accountType === "seller";

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [editing, setEditing] = useState({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({});
  const [logoUploading, setLogoUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const logoInputRef = useRef(null);

  useEffect(() => {
    getMyCompany()
      .then(setCompany)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (key, value) => {
    setEditing((prev) => ({ ...prev, [key]: value ?? "" }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    setLogoUploading(true);
    setError("");
    try {
      const result = await uploadCompanyLogo(company.id, file);
      if (!result?.url) throw new Error("Сервер не вернул ссылку на загруженный логотип");
      setCompany((prev) => ({ ...prev, logoUrl: result.url }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!company) return;
    if (!window.confirm("Отправить компанию на верификацию?")) return;
    setVerifying(true);
    setError("");
    try {
      await submitCompanyVerification(company.id);
      setCompany((prev) => ({ ...prev, verificationStatus: "PENDING" }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const cancelEdit = (key) => {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const saveField = async (key) => {
    if (!company) return;
    setSaving(true);
    setError("");
    try {
      const { merged, missing } = await resolveRequiredCompanyFields(company, { [key]: editing[key] });
      if (missing.length > 0) {
        setError(
          `Не удаётся сохранить: в профиле компании не хватает данных — ${missing.map((k) => REQUIRED_COMPANY_FIELDS[k]).join(", ")}. Эти данные указываются при создании компании и сейчас отсутствуют в записи.`
        );
        return;
      }
      const updated = await updateCompany(company.id, {
        name: merged.name,
        shortDescription: merged.shortDescription,
        description: merged.description,
        stir: merged.stir,
        phonePrimary: merged.phonePrimary,
        phoneSecondary: merged.phoneSecondary,
        website: merged.website,
        regionId: merged.regionId,
        districtId: merged.districtId,
        address: merged.address,
        lat: merged.lat,
        lng: merged.lng,
        [key]: editing[key],
      });
      setCompany(updated);
      cancelEdit(key);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEditProfile = () => {
    setProfileDraft({
      name: company?.name ?? "",
      shortDescription: company?.shortDescription ?? "",
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
          `Не удаётся сохранить: в профиле компании не хватает данных — ${missing.map((k) => REQUIRED_COMPANY_FIELDS[k]).join(", ")}. Эти данные указываются при создании компании и сейчас отсутствуют в записи.`
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
        ...profileDraft,
      });
      setCompany(updated);
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
          <p className="font-semibold text-lg text-ink-900 dark:text-white mb-1">Создание компании недоступно</p>
          <p className="text-sm text-ink-400 dark:text-ink-500">
            Только пользователи с ролью «Продавец» могут создавать компанию на Sklad Market.
          </p>
        </div>
      );
    }
    return <CreateCompanyForm onCreated={setCompany} />;
  }

  const vStatus = VERIFICATION_BADGE[company?.verificationStatus] ?? VERIFICATION_BADGE.DRAFT;

  const fields = [
    { key: "name", label: "Название компании" },
    { key: "shortDescription", label: "Краткое описание" },
    { key: "phonePrimary", label: "Телефон" },
    { key: "phoneSecondary", label: "Email" },
    { key: "website", label: "Сайт" },
    { key: "address", label: "Город" },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {success && (
        <div className="text-sm text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-500/10 rounded-2xl p-3 text-center">
          ✓ Данные компании обновлены
        </div>
      )}
      {error && (
        <div className="text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 rounded-2xl p-3 text-center">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
        <p className="font-semibold text-[24px] text-ink-900 dark:text-white mb-4 sm:mb-5">Профиль компании</p>

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
                {company?.name}
                {company?.verificationStatus === "VERIFIED" && (
                  <TickCircle size={18} variant="Outline" className="text-brand-500" />
                )}
              </p>
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
              Логотип
            </button>
            {(company?.verificationStatus === "DRAFT" || company?.verificationStatus === "REJECTED") && (
              <button
                onClick={handleSubmitVerification}
                disabled={verifying}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0"
              >
                <ShieldTick size={18} /> {verifying ? "..." : "На верификацию"}
              </button>
            )}
          </div>
        </div>
        <div className="sm:hidden flex flex-col divide-y divide-[#F0F0F0] dark:divide-[#1C1C1C]">
          {fields.map((f) => (
            <div key={f.key} className="grid grid-cols-2 sm:flex items-center justify-between gap-3 py-3.5">
              <p className="text-sm text-ink-400 dark:text-ink-500 shrink-0">{f.label}</p>
              {editingProfile ? (
                <input
                  value={profileDraft[f.key] ?? ""}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="bg-ink-50 dark:bg-[#171717] border border-brand-400 dark:border-brand-500 rounded-xl px-3 py-1.5 text-sm outline-none dark:text-white text-right w-1/2"
                />
              ) : (
                <p className="text-sm font-medium text-ink-900 dark:text-white truncate text-left">{company?.[f.key] || "—"}</p>
              )}
            </div>
          ))}
        </div>

        <div className="sm:hidden mt-4">
          {editingProfile ? (
            <div className="flex items-center gap-2">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
              <button
                onClick={() => setEditingProfile(false)}
                className="px-4 py-3 rounded-xl border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 text-sm font-medium text-ink-600 dark:text-ink-300 transition-colors"
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              onClick={startEditProfile}
              className="w-full flex items-center justify-center gap-2 border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 text-sm font-medium py-3 rounded-xl text-ink-700 dark:text-ink-200 transition-colors"
            >
              <Edit2 size={16} /> Редактировать
            </button>
          )}
        </div>

        <div className="hidden sm:flex sm:flex-col">
          {fields.map((f) => {
            const isEditing = f.key in editing;
            return (
              <div key={f.key} className="flex items-center justify-between gap-3 py-3.5">
                <p className="text-xs text-ink-400 dark:text-ink-500 shrink-0 w-40">{f.label}</p>

                {isEditing ? (
                  <input
                    autoFocus
                    value={editing[f.key]}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") saveField(f.key); if (e.key === "Escape") cancelEdit(f.key); }}
                    className="flex-1 bg-ink-50 dark:bg-[#171717] border border-brand-400 dark:border-brand-500 rounded-xl px-3 py-1.5 text-sm outline-none dark:text-white text-start"
                  />
                ) : (
                  <p className="flex-1 text-sm font-medium text-ink-900 dark:text-white truncate text-start">{company?.[f.key] || "—"}</p>
                )}

                <div className="flex items-center gap-1 shrink-0 justify-end w-28">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveField(f.key)}
                        disabled={saving}
                        className="text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {saving ? "..." : "Сохранить"}
                      </button>
                      <button onClick={() => cancelEdit(f.key)} className="text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 p-1">
                        <CloseCircle size={18} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(f.key, company?.[f.key] ?? "")}
                      className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Изменить
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
        <p className="font-semibold text-lg text-ink-900 dark:text-white mb-4">Тарифный план</p>
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
