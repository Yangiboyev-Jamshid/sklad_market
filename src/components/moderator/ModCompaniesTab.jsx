import { useState, useEffect, useCallback } from "react";
import { getCompanyModerationQueue, verifyCompany, rejectCompany, updateCompany } from "../../api/api";
import { IoIosClose } from "react-icons/io";
import { GrFormCheckmark } from "react-icons/gr";

function LocationEditor({ company }) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState(company.address ?? "");
  const [lat, setLat] = useState(company.lat ?? "");
  const [lng, setLng] = useState(company.lng ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateCompany(company.id, {
        address,
        lat: lat === "" ? null : Number(lat),
        lng: lng === "" ? null : Number(lng),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full sm:w-auto">
      <button onClick={() => setOpen((v) => !v)} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
        {open ? "Скрыть" : "Изменить местоположение"}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-2 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-3 w-full sm:w-64">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Адрес"
            className="text-xs bg-ink-50 dark:bg-[#171717] rounded-lg px-2.5 py-2 outline-none text-ink-900 dark:text-white placeholder:text-ink-400"
          />
          <div className="flex gap-2">
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Широта (lat)"
              className="text-xs bg-ink-50 dark:bg-[#171717] rounded-lg px-2.5 py-2 outline-none text-ink-900 dark:text-white placeholder:text-ink-400 w-1/2"
            />
            <input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="Долгота (lng)"
              className="text-xs bg-ink-50 dark:bg-[#171717] rounded-lg px-2.5 py-2 outline-none text-ink-900 dark:text-white placeholder:text-ink-400 w-1/2"
            />
          </div>
          {error && <p className="text-[11px] text-danger-500">{error}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-medium bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg px-2.5 py-2 transition-colors"
          >
            {saving ? "Сохранение..." : saved ? "Сохранено ✓" : "Сохранить"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ModCompaniesTab() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompanyModerationQueue();
      setCompanies(data ?? []);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleVerify = async (id) => {
    setActionId(id);
    try {
      await verifyCompany(id);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    const comment = window.prompt("Причина отклонения:") ?? "";
    setActionId(id);
    try {
      await rejectCompany(id, { reasonCode: "OTHER", comment });
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
      <p className="font-semibold text-ink-900 text-[24px] dark:text-white mb-4 sm:mb-5">Верификация компаний</p>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <p className="text-center py-12 text-ink-400">Нет компаний, ожидающих верификации</p>
      ) : (
        <div className="flex flex-col gap-3">
          {companies.map((c) => {
            const busy = actionId === c.id;
            const parts = c.name.trim().split(" ");
            const initials = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
            return (
              <div key={c.id} className={`flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-4 transition-opacity ${busy ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-600 text-white dark:text-black flex items-center justify-center font-bold text-[11px] shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 dark:text-white">{c.name}</p>
                    {c.stir && <p className="text-xs text-[#7F7F7F] mt-1">ИНН: {c.stir}</p>}
                    {c.phonePrimary && <p className="text-xs text-[#7F7F7F] mt-1">{c.phonePrimary}</p>}
                    {c.address && <p className="text-xs text-[#7F7F7F] mt-1">{c.address}</p>}
                  </div>
                </div>
                <div className="flex content-between flex-col items-end gap-[30px]">
                  <div className="w-full sm:w-auto flex items-center gap-2 shrink-0">
                    <button
                      disabled={busy}
                      onClick={() => handleVerify(c.id)}
                      className="w-full sm:w-auto flex justify-center items-center gap-1.5 bg-success-500 hover:bg-success-600 text-white dark:text-black text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                    >
                      <GrFormCheckmark className="text-[20px]" /> Принять
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => handleReject(c.id)}
                      className="w-full sm:w-auto flex justify-center items-center gap-1.5 bg-danger-500 hover:bg-danger-600 text-white dark:text-black text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                    >
                      <IoIosClose className="text-[20px]" /> Отклонить
                    </button>
                  </div>
                  <LocationEditor company={c} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
