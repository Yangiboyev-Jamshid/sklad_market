import { useState, useEffect, useCallback } from "react";
import { getAdminUsers, blockUser, unblockUser } from "../../api/api";
import { IoIosMore } from "react-icons/io";

const headers = ["Пользователи", "Роли", "Логин", "Дата регистрации", "Предупреждении", "Статус"];

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }) {
  const isActive = status !== "BLOCKED";
  return (
    <span
      className={`inline-flex w-[100px] text-xs items-center justify-center rounded-[4px] px-2 py-1 text-[16px] leading-none font-normal whitespace-nowrap ${isActive
        ? "bg-[#D5F8DE] dark:bg-[#0F4119] text-[#38A34D] dark:text-[#38A34D]"
        : "bg-[#FFD0D0] dark:bg-[#4A0E0E] text-[#FF0000] dark:text-[#FF1A1A]"
        }`}
    >
      {isActive ? "Активный" : "Заблокирован"}
    </span>
  );
}

export default function AccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers({ page: 1, per_page: 50 });
      setAccounts(data?.content ?? []);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest("[data-account-menu]")) setMenuOpen(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleBlock = async (a) => {
    setMenuOpen(null);
    setActionId(a.id);
    try {
      if (a.status === "BLOCKED") {
        await unblockUser(a.id);
        setAccounts((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: "ACTIVE" } : x)));
      } else {
        const reason = window.prompt("Причина блокировки:") ?? "";
        await blockUser(a.id, reason);
        setAccounts((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: "BLOCKED" } : x)));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] px-4 py-6 sm:p-4 transition-colors">
      <p className="font-semibold text-[24px] leading-tight text-ink-900 dark:text-white mb-6 ml-3 sm:mb-7">Управление аккаунтами</p>

      {loading ? (
        <div className="flex flex-col gap-3 px-3 sm:px-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <p className="text-center py-12 text-ink-400">Аккаунты не найдены</p>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="sm:hidden flex flex-col gap-3">
            {accounts.map((a) => (
              <div key={a.id} className={`relative border border-[#F0F0F0] dark:border-[#1C1C1C] rounded-2xl p-4 ${actionId === a.id ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{a.name || a.username}</p>
                    <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">{a.roles}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" data-account-menu>
                    <StatusBadge status={a.status} />
                    <button
                      onClick={() => setMenuOpen(menuOpen === a.id ? null : a.id)}
                      className="inline-flex items-center justify-center text-black rounded-[4px] hover:bg-ink-50 dark:text-white dark:hover:bg-[#171717]"
                      aria-label="Открыть меню аккаунта"
                    >
                      <IoIosMore className="text-[24px]" />
                    </button>
                    {menuOpen === a.id && (
                      <div className="absolute right-0 top-8 bg-white dark:bg-[#171717] border border-ink-100 dark:border-[#1C1C1C] rounded-xl shadow-popover z-10 w-40">
                        <button
                          onClick={() => toggleBlock(a)}
                          className="w-full text-left px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded-xl"
                        >
                          {a.status === "BLOCKED" ? "Разблокировать" : "Заблокировать"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 text-xs border-t border-[#F0F0F0] dark:border-[#1C1C1C] pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink-400 dark:text-ink-500">Логин</span>
                    <span className="text-ink-900 dark:text-white font-medium truncate">{a.username}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink-400 dark:text-ink-500">Дата регистрации</span>
                    <span className="text-ink-900 dark:text-white font-medium">{formatDate(a.createdDate)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink-400 dark:text-ink-500">Предупреждении</span>
                    <span className="text-ink-900 dark:text-white font-medium">{a.warningCount || "-"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <div className="w-full">
              <div className="text-left text-[16px] grid grid-cols-6 text-black dark:text-white">
                {headers.map((header, index) => (
                  <div key={header} className={`pb-1 font-normal ${index === 0 ? "pl-4" : "border-l border-[#6F6F6F] px-5"}`}>
                    <span className="flex items-center text-sm gap-3 whitespace-nowrap">{header}</span>
                  </div>
                ))}
              </div>
              {accounts.map((a) => (
                <div key={a.id} className={`group grid grid-cols-6 items-center text-black dark:text-white py-5 mt-4 rounded-2xl border border-[#F0F0F0] dark:border-[#1C1C1C] ${actionId === a.id ? "opacity-50" : ""}`}>
                  <span className="bg-white dark:bg-[#0D0D0D] px-4 font-normal border-r border-[#333333] truncate">
                    {a.name || a.username}
                  </span>
                  <div className="bg-white dark:bg-[#0D0D0D] px-4 border-r border-[#333333] font-normal">{a.roles}</div>
                  <div className="bg-white dark:bg-[#0D0D0D] px-4 border-r border-[#333333] font-normal truncate">{a.username}</div>
                  <div className="bg-white dark:bg-[#0D0D0D] px-4 border-r border-[#333333] font-normal">{formatDate(a.createdDate)}</div>
                  <div className="bg-white dark:bg-[#0D0D0D] px-4 border-r border-[#333333] font-normal">{a.warningCount || "-"}</div>
                  <div className="bg-white dark:bg-[#0D0D0D] relative px-4 flex items-center justify-between" data-account-menu>
                    <StatusBadge status={a.status} />
                    <button
                      onClick={() => setMenuOpen(menuOpen === a.id ? null : a.id)}
                      className="inline-flex items-center justify-center text-black rounded-[4px] hover:bg-ink-50 dark:text-white dark:hover:bg-[#171717]"
                      aria-label="Открыть меню аккаунта"
                    >
                      <IoIosMore className="text-[24px]" />
                    </button>
                    {menuOpen === a.id && (
                      <div className="absolute right-0 top-8 bg-white dark:bg-[#171717] border border-ink-100 dark:border-[#1C1C1C] rounded-xl shadow-popover z-10 w-40">
                        <button
                          onClick={() => toggleBlock(a)}
                          className="w-full text-left px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded-xl"
                        >
                          {a.status === "BLOCKED" ? "Разблокировать" : "Заблокировать"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
