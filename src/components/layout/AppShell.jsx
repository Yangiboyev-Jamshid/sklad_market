import SidebarRail from "./SidebarRail";
import Header from "./Header";

export default function AppShell({ children }) {
  return (
    <div className="h-screen w-full flex bg-surface dark:bg-[#121212] overflow-hidden transition-colors">
      <SidebarRail />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-3 sm:pb-16 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
