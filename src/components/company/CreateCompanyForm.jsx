import { useState, useRef, useEffect } from "react";
import { Buildings, TickCircle, Location } from "iconsax-reactjs";
import { createCompany } from "../../api/api";
import { geocodeAddress, suggestAddress, reverseGeocode } from "../../utils/geo";
import LegalFormSelect from "../ui/LegalFormSelect";
import MapView from "../ui/MapView";

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
  const [companyCreatedDate, setCompanyCreatedDate] = useState("");
  const [legalForm, setLegalForm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const submittingRef = useRef(false);

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pickedCoords, setPickedCoords] = useState(null);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  const toggleMapPicker = () => {
    setShowMapPicker((v) => !v);
  };

  const handleMapPick = (coords) => {
    setPickedCoords(coords);
    setResolvingAddress(true);
    reverseGeocode(coords.lat, coords.lng)
      .then(({ address }) => {
        if (address) setAddress(address);
      })
      .finally(() => setResolvingAddress(false));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!name.trim()) {
      setError("Введите название компании");
      return;
    }
    if (!stir.trim() || !phonePrimary.trim() || !address.trim()) {
      setError("Заполните ИНН (STIR), телефон и адрес — они обязательны");
      return;
    }
    if (!companyCreatedDate) {
      setError("Укажите дату создания компании");
      return;
    }
    if (!legalForm) {
      setError("Выберите организационно-правовую форму компании");
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    setError("");
    try {
      let coords = pickedCoords;
      if (!coords) {
        const geo = await geocodeAddress(address);
        coords = geo.coords;
        if (!coords) {
          setError(LOCATION_ERROR_MESSAGES[geo.reason] ?? LOCATION_ERROR_MESSAGES.unavailable);
          submittingRef.current = false;
          setLoading(false);
          return;
        }
      }
      const company = await createCompany({
        name: name.trim(),
        shortDescription: shortDescription.trim() || undefined,
        stir: stir.trim(),
        phonePrimary: phonePrimary.trim(),
        address: address.trim(),
        companyCreatedDate,
        legalForm,
        lat: String(coords.lat),
        lng: String(coords.lng),
      });
      setCreated(company);
      setTimeout(() => onCreated?.(company), 1600);
    } catch (err) {
      setError(err.message);
      submittingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-6 sm:p-10 max-w-lg mx-auto text-center transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-success-50 dark:bg-success-500/10 flex items-center justify-center text-success-600 dark:text-success-400 mx-auto mb-4">
          <TickCircle size={28} variant="Bulk" />
        </div>
        <p className="font-semibold text-lg text-ink-900 dark:text-white mb-1">Компания создана!</p>
        <p className="text-sm text-ink-400 dark:text-ink-500">
          «<span translate="no" className="notranslate">{created.name}</span>» успешно зарегистрирована на Sklad Market
        </p>
      </div>
    );
  }

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
        <div>
          <label className="text-xs font-medium text-ink-500 dark:text-ink-400 mb-1 block">
            Организационно-правовая форма *
          </label>
          <LegalFormSelect value={legalForm} onChange={setLegalForm} />
        </div>
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
        <AddressField label="Адрес *" value={address} onChange={setAddress} placeholder="г. Ташкент, ..." />

        <div>
          <button
            type="button"
            onClick={toggleMapPicker}
            className="flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            <Location size={16} /> {showMapPicker ? "Скрыть карту" : "Указать на карте"}
          </button>

          {showMapPicker && (
            <div className="mt-3 flex flex-col gap-2">
              <MapView height="h-[240px] sm:h-[320px]" center={pickedCoords} onPick={handleMapPick} />
              {resolvingAddress ? (
                <p className="text-xs text-ink-400 dark:text-ink-500">Определяем адрес...</p>
              ) : pickedCoords ? (
                <p className="text-xs text-ink-500 dark:text-ink-400">Точка на карте выбрана</p>
              ) : (
                <p className="text-xs text-ink-400 dark:text-ink-500">Нажмите на карту, чтобы указать местоположение компании</p>
              )}
            </div>
          )}
        </div>

        <Field
          label="Дата создания компании *"
          value={companyCreatedDate}
          onChange={setCompanyCreatedDate}
          type="date"
        />

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

function AddressField({ label, value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleChange = (val) => {
    onChange(val);
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    if (!val.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      const results = await suggestAddress(val, { signal: controller.signal });
      setSuggestions(results);
      setOpen(results.length > 0);
    }, 300);
  };

  const pick = (s) => {
    onChange(s.address);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      {label && <label className="text-xs font-medium text-ink-500 dark:text-ink-400 mb-1 block">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-400 dark:text-white"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-[#171717] border border-ink-100 dark:border-[#1C1C1C] rounded-xl shadow-lg max-h-56 overflow-auto">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="w-full text-left px-3.5 py-2 text-sm hover:bg-ink-50 dark:hover:bg-[#212121] text-ink-900 dark:text-white"
              >
                <span className="font-medium">{s.title}</span>
                {s.subtitle && (
                  <span className="text-ink-400 dark:text-ink-500"> {s.subtitle}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
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
