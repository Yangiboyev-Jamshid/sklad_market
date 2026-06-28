import { useState, useRef, useEffect } from "react";
import { MoreCircle } from "iconsax-reactjs";
import { accounts as initialAccounts } from "../../data/mockData";

export default function AccountsTab() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [menuOpen, setMenuOpen] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleBlock = (id) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: a.status === "blocked" ? "active" : "blocked" } : a))
    );
    setMenuOpen(null);
  };

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
      <p className="font-semibold text-ink-900 dark:text-white mb-4 sm:mb-5">Управление аккаунтами</p>
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full text-sm min-w-[720px] sm:min-w-0">
          <thead>
            <tr className="text-left text-ink-400 text-xs border-b border-ink-100 dark:border-[#1C1C1C]">
              <th className="py-3 pr-4 font-medium">Пользователи</th>
              <th className="py-3 pr-4 font-medium">Роли</th>
              <th className="py-3 pr-4 font-medium">Email</th>
              <th className="py-3 pr-4 font-medium">Дата регистрации</th>
              <th className="py-3 pr-4 font-medium">Предупреждении</th>
              <th className="py-3 pr-4 font-medium">Статус</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b border-ink-50 dark:border-[#1C1C1C]/60 last:border-0">
                <td className="py-4 pr-4 font-medium text-ink-900 dark:text-white">{a.name}</td>
                <td className="py-4 pr-4 text-ink-600 dark:text-ink-300">{a.role}</td>
                <td className="py-4 pr-4 text-ink-600 dark:text-ink-300">{a.email}</td>
                <td className="py-4 pr-4 text-ink-600 dark:text-ink-300">{a.regDate}</td>
                <td className="py-4 pr-4 text-ink-600 dark:text-ink-300">{a.warnings || "-"}</td>
                <td className="py-4 pr-4">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                      a.status === "active"
                        ? "bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-400"
                        : "bg-danger-50 dark:bg-danger-500/15 text-danger-600 dark:text-danger-400"
                    }`}
                  >
                    {a.status === "active" ? "Активный" : "Заблокирован"}
                  </span>
                </td>
                <td className="py-4 relative">
                  <button onClick={() => setMenuOpen(menuOpen === a.id ? null : a.id)} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200">
                    <MoreCircle size={18} />
                  </button>
                  {menuOpen === a.id && (
                    <div ref={ref} className="absolute right-0 top-8 bg-white dark:bg-[#171717] border border-ink-100 dark:border-[#1C1C1C] rounded-xl shadow-popover z-10 w-40">
                      <button
                        onClick={() => toggleBlock(a.id)}
                        className="w-full text-left px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded-xl"
                      >
                        {a.status === "blocked" ? "Разблокировать" : "Заблокировать"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
