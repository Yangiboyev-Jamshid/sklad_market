import { useTranslation } from "react-i18next";
import AppShell from "../components/layout/AppShell";
import ChatPanel from "../components/chat/ChatPanel";

export default function ChatPage() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <div className="p-4 sm:p-10">
        <h1 className="hidden sm:block text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white mb-5 sm:mb-6">
          {t("chat.messages")}
        </h1>
        <ChatPanel />
      </div>
    </AppShell>
  );
}
