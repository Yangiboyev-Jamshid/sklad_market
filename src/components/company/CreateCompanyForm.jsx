import { useState } from "react";
import { Buildings } from "iconsax-reactjs";
import { createCompany } from "../../api/api";
import { geocodeAddress } from "../../utils/geo";

const LOCATION_ERROR_MESSAGES = {
  empty: "Введите адрес компании, чтобы определить координаты.",
  not_found: "Не удалось найти этот адрес на карте. Уточните адрес (например, добавьте название города) и попробуйте снова.",
  unavailable: "Не удалось определить координаты по адресу. Проверьте подключение к интернету и попробуйте снова.",
};

export default function CreateCompanyForm({ onCreated }) {
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [stir, setStir] = useState("");
  const [phonePrimary, setPhonePrimary] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Введите название компании");
      return;
    }
    if (!stir.trim() || !phonePrimary.trim() || !address.trim()) {
      setError("Заполните ИНН (STIR), телефон и адрес — они обязательны");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Backend requires lat/lng, but there's no reason to interrupt the
      // user with a device-location permission prompt for it — geocode the
      // address they already typed instead.
      const { coords, reason } = await geocodeAddress(address);
      if (!coords) {
        setError(LOCATION_ERROR_MESSAGES[reason] ?? LOCATION_ERROR_MESSAGES.unavailable);
        setLoading(false);
        return;
      }
      const company = await createCompany({
        name: name.trim(),
        shortDescription: shortDescription.trim() || undefined,
        stir: stir.trim(),
        phonePrimary: phonePrimary.trim(),
        address: address.trim(),
        lat: String(coords.lat),
        lng: String(coords.lng),
      });
      onCreated?.(company);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-6 sm:p-10 max-w-lg mx-auto text-center transition-colors">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 mx-auto mb-4">
        <Buildings size={28} variant="Bulk" />
      </div>
      <p className="font-semibold text-lg text-ink-900 dark:text-white mb-1">У вас пока нет компании</p>
      <p className="text-sm text-ink-400 dark:text-ink-500 mb-6">
        Создайте компанию, чтобы продавать товары на Sklad Market
      </p>

      <form onSubmit={submit} className="flex flex-col gap-3 text-left">
        <Field label="Название компании *" value={name} onChange={setName} placeholder="ООО Steel Group" />
        <Field
          label="Краткое описание"
          value={shortDescription}
          onChange={setShortDescription}
          placeholder="Оптовая продажа металлопроката"
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="ИНН (STIR) *" value={stir} onChange={setStir} placeholder="123456789" />
          <Field label="Телефон *" value={phonePrimary} onChange={setPhonePrimary} placeholder="+998 90 000 00 00" />
        </div>
        <Field label="Адрес *" value={address} onChange={setAddress} placeholder="г. Ташкент, ..." />

        {error && (
          <p className="text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors mt-1"
        >
          {loading ? "Создание..." : "Создать компанию"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      {label && <label className="text-xs font-medium text-ink-500 dark:text-ink-400 mb-1 block">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-400 dark:text-white"
      />
    </div>
  );
}
