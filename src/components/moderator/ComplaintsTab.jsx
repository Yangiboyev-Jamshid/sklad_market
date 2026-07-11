import { useState, useEffect, useCallback } from "react";
import { Slash, Box, Buildings, Messages2, Danger } from "iconsax-reactjs";
import { getAdminReports, getAdminReport, rejectReport, warnReportedUser, blockReportTarget } from "../../api/api";

const TARGET_ICON = {
  PRODUCT: Box,
  COMPANY: Buildings,
  CHAT: Messages2,
};

const TARGET_LABEL = {
  PRODUCT: "Товар",
  COMPANY: "Компания",
  CHAT: "Переписка",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ComplaintsTab() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [details, setDetails] = useState({});
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminReports({ status: "PENDING", page: 1, size: 50 });
      setComplaints(data?.content ?? []);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpand = async (c) => {
    const next = expanded === c.id ? null : c.id;
    setExpanded(next);
    if (next && !details[c.id]) {
      try {
        const full = await getAdminReport(c.id);
        setDetails((prev) => ({ ...prev, [c.id]: full }));
      } catch {
        // ignore, fall back to list data
      }
    }
  };

  const removeFromList = (id) => setComplaints((prev) => prev.filter((c) => c.id !== id));

  const handleReject = async (c) => {
    setActionId(c.id);
    try {
      await rejectReport(c.id, "Жалоба отклонена модератором");
      removeFromList(c.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleWarn = async (c) => {
    const message = window.prompt("Текст предупреждения:", "Нарушение правил платформы");
    if (message == null) return;
    setActionId(c.id);
    try {
      await warnReportedUser(c.id, message);
      removeFromList(c.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleBlock = async (c) => {
    if (!window.confirm("Заблокировать объект жалобы?")) return;
    setActionId(c.id);
    try {
      await blockReportTarget(c.id, c.reasonCode || "Нарушение правил");
      removeFromList(c.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
      <p className="font-semibold text-ink-900 text-[24px] dark:text-white mb-4 sm:mb-5">Жалобы и нарушения</p>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <p className="text-center py-12 text-ink-400">Жалоб пока нет</p>
      ) : (
        <div className="flex flex-col gap-3">
          {complaints.map((c) => {
            const Icon = TARGET_ICON[c.targetType] ?? Box;
            const isOpen = expanded === c.id;
            const busy = actionId === c.id;
            const detail = details[c.id];
            return (
              <div key={c.id} className={`border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-4 transition-opacity ${busy ? "opacity-50" : ""}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="w-[30px] h-[30px] rounded-lg bg-[#4851B1] dark:bg-[#5860BB] text-white dark:text-black flex items-center justify-center shrink-0">
                      <Icon size={20} variant="Outline" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900 dark:text-white">
                        {TARGET_LABEL[c.targetType] ?? c.targetType} #{c.targetId}
                      </p>
                      <p className="text-xs text-[#7F7F7F] mt-1">{formatDate(c.createdDate)}</p>
                      <span className="text-[14px] font-medium bg-[#D3171733] dark:bg-[#E61C1C33] text-[#FF0000] dark:text-[#FF1A1A] px-1 py-0.5 rounded-[4px]">
                        {c.reasonCode}
                      </span>
                      <button
                        onClick={() => toggleExpand(c)}
                        className="block text-[14px] text-xs text-black dark:text-white mt-1 hover:underline"
                      >
                        Подробнее
                      </button>
                    </div>
                  </div>
                  <div className="flex w-full sm:w-auto flex-col sm:flex-row items-center gap-2 shrink-0 overflow-x-auto">
                    <button
                      disabled={busy}
                      onClick={() => handleReject(c)}
                      className="w-full sm:w-auto justify-center text-xs sm:text-xs font-medium px-3 sm:px-[10px] py-[11px] rounded-xl text-white bg-[#B9B9B9] border border-[#B9B9B9] dark:text-[#0D0D0D] dark:border-[#1E1E1E] dark:bg-[#B9B9B9] whitespace-nowrap"
                    >
                      Отклонить жалобу
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => handleWarn(c)}
                      className="w-full sm:w-auto justify-center flex items-center gap-2 bg-warning-500 hover:bg-warning-600 text-white dark:text-black text-xs sm:text-xs font-medium px-3 sm:p-[10px] py-[11px] rounded-xl transition-colors whitespace-nowrap"
                    >
                      <Danger size={20} /> Предупредить
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => handleBlock(c)}
                      className="w-full sm:w-auto justify-center flex items-center gap-2 bg-danger-500 hover:bg-danger-600 text-white dark:text-black text-xs sm:text-xs font-medium px-3 sm:p-[10px] py-[11px] rounded-xl transition-colors whitespace-nowrap"
                    >
                      <Slash size={20} /> Заблокировать
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-ink-100 dark:border-[#1C1C1C] text-sm text-ink-600 dark:text-ink-300">
                    {detail?.comment || "Комментарий отсутствует"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
