import { useState } from "react";
import { SearchNormal1, Call, DocumentText1, ArrowLeft2, More, EmojiHappy, Send } from "iconsax-reactjs";
import { messages, chatThread } from "../../data/mockData";
import { HiOutlineEmojiHappy } from "react-icons/hi";
export default function MessagesTab() {
  const [activeId, setActiveId] = useState(messages[0].id);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const active = messages.find((m) => m.id === activeId);

  const openChat = (id) => {
    setActiveId(id);
    setMobileShowChat(true);
  };

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] grid grid-cols-1 md:grid-cols-[280px_1fr] overflow-hidden h-[560px] sm:h-[600px] transition-colors">
      <div className={`border-r border-ink-100 dark:border-[#1C1C1C] flex min-h-0 flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
        <div className="px-4 pt-4">
          <div className="pb-4border-b border-ink-100 dark:border-[#1C1C1C]">
            <p className="font-semibold text-[24px] text-ink-900 dark:text-white mb-4">Сообщения</p>
            <div className="grid grid-cols-[1fr_auto] items-center gap-2 bg-white dark:bg-[#0D0D0D] border dark:border-[#2D2D2D] rounded-2xl px-3 py-2.5">
              <SearchNormal1 size={16} className="text-ink-400" />
              <input placeholder="Поиск сообщений" className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white" />
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {messages.map((m) => (
            <button
              key={m.id}
              onClick={() => openChat(m.id)}
              className={`w-full flex mt-4 items-center gap-3 p-2 text-left border rounded-xl border-ink-50 dark:border-[#1C1C1C]/60 transition-colors ${activeId === m.id ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-ink-50 dark:hover:bg-[#171717]"
                }`}
            >
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white dark:text-black flex items-center justify-center font-bold text-xs shrink-0">
                {m.company.split(" ")[0][0].toUpperCase() + m.company.split(" ")[1][0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{m.company}</p>
                  <span className="text-[11px] text-ink-300 dark:text-ink-600">{m.time}</span>
                </div>
                <p className="text-xs text-[#7F7F7F] truncate">
                  <span>{m.preview}</span><br />
                </p>
                <p className="text-[10px] flex items-center justify-between text-[#7F7F7F] truncate">
                  <span>{m.pro}</span>
                  {m.unread && <div className="flex justify-center items-end">
                    <span className="text-[7px] w-[11px] h-[11px] flex items-center justify-center dark:text-black text-white rounded-full bg-brand-600"  >3</span>
                  </div>}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`min-h-0 flex-col ${mobileShowChat ? "flex" : "hidden md:flex"}`}>
        <div className="flex shrink-0 items-center justify-between p-4 border-b border-ink-100 dark:border-[#1C1C1C]">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileShowChat(false)} className="md:hidden text-ink-500 dark:text-ink-300 shrink-0">
              <ArrowLeft2 size={20} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-[#2E6FFC] text-white dark:text-black flex items-center justify-center font-bold text-xs shrink-0">
              {active.company.split(" ")[0][0].toUpperCase() + active.company.split(" ")[1][0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{active.company}</p>
              <p className="text-xs text-success-600 dark:text-success-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success-500" /> Онлайн
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-ink-400 dark:text-white shrink-0">
            <Call size={24} />
            <More size={24} style={{ transform: "rotate(90deg)" }} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
          {chatThread.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.from === "me" ? "items-end" : "items-start"}`}>
              {m.file ? (
                <div className="bg-brand-600 text-white rounded-2xl px-4 py-3 flex items-center gap-2 max-w-[85%] sm:max-w-xs">
                  <DocumentText1 size={18} className="shrink-0" />
                  <span className="text-sm truncate">{m.file}</span>
                </div>
              ) : (
                <div
                  className={`max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.from === "me" ? "bg-brand-600 text-white" : "bg-ink-50 dark:bg-[#171717] text-ink-700 dark:text-ink-200"
                    }`}
                >
                  {m.text}
                </div>
              )}
              <span className="text-[11px] text-ink-300 dark:text-ink-600 mt-1">{m.time}</span>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-4 px-4 sm:px-6 py-4 border-t border-ink-100 dark:border-[#1C1C1C]">
          <button className="text-[#75809F] text-[24px] hover:text-[#1A94FF] transition-colors shrink-0" type="button">
            <HiOutlineEmojiHappy />
          </button>
          <input
            placeholder="Сообщение"
            className="flex-1 min-w-0 bg-transparent text-base outline-none placeholder:text-[#75809F] text-ink-900 dark:text-white"
          />
          <button className="text-[#1A94FF] hover:text-brand-700 transition-colors p-1 shrink-0" type="button">
            <Send size={24} variant="Bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
