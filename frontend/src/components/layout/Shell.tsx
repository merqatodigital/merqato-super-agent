import { useEffect, useState } from "react";
import { Menu, Send, X } from "lucide-react";
import { CommandCenter } from "../../pages/CommandCenter";
import { SuperAgent } from "../../pages/SuperAgent";
import { Bots } from "../../pages/Bots";
import { Tasks } from "../../pages/Tasks";
import { Browser } from "../../pages/Browser";
import { Knowledge } from "../../pages/Knowledge";
import { Memory } from "../../pages/Memory";
import { Approvals } from "../../pages/Approvals";
import { Usage } from "../../pages/Usage";
import { Settings } from "../../pages/Settings";
import { useApp } from "../../store/AppContext";
import { useBreakpoint } from "../../hooks/useMediaQuery";
import { UpgradeModal } from "../billing/UpgradeModal";
import { LogoMark } from "../icons/AgentMark";
import { Drawers } from "./Drawers";
import { Sidebar } from "./Sidebar";

const TITLES: Record<string, string> = {
  "command-center": "Command Center",
  "super-agent": "Super Agent",
  bots: "Bots",
  tasks: "Tasks",
  browser: "Browser",
  knowledge: "Knowledge",
  memory: "Memory",
  approvals: "Approvals",
  usage: "Usage",
  settings: "Settings",
};

export function Shell() {
  const { page, toasts, settings } = useApp();
  const { width } = useBreakpoint();
  const [navOpen, setNavOpen] = useState(false);

  // Below lg the sidebar is an overlay drawer; at lg it collapses to an icon
  // rail; from xl it is the full sidebar. Same interface at every size.
  const isCompact = width < 1024;
  const telegramHref = settings.telegramHandle
    ? `https://t.me/${settings.telegramHandle.replace("@", "")}`
    : "https://t.me/";

  useEffect(() => {
    if (!isCompact) setNavOpen(false);
  }, [isCompact]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-void text-white">
      {/* Persistent sidebar from lg up */}
      {!isCompact && <Sidebar collapsed={width < 1280} />}

      {/* Overlay drawer below lg */}
      {isCompact && navOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setNavOpen(false)}
          />
          <div className="relative h-full animate-fade-up shadow-[8px_0_40px_rgba(0,0,0,0.5)]">
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
            className="absolute right-4 top-4 rounded-lg border border-cyan/20 bg-[#0a141e] p-2 text-white/80"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Compact top bar — replaces the sidebar below lg */}
        {isCompact && (
          <header className="flex shrink-0 items-center gap-3 border-b border-cyan/10 bg-[#070b12] px-3 py-2.5">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setNavOpen(true)}
              className="rounded-lg border border-cyan/20 p-2 text-white/85 transition hover:border-cyan/40 hover:text-white"
            >
              <Menu size={16} />
            </button>
            <LogoMark size={22} />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate font-display text-[13px] tracking-[0.18em] text-white">MERQATO</div>
              <div className="truncate text-[10px] tracking-[0.16em] text-cyan">
                {TITLES[page]?.toUpperCase() ?? "AGENT OS"}
              </div>
            </div>
            <a
              href={telegramHref}
              target="_blank"
              rel="noreferrer"
              aria-label="Continue in Telegram"
              className="flex items-center gap-1.5 rounded-lg bg-cyan px-2.5 py-2 text-[11px] font-medium text-[#042226]"
            >
              <Send size={13} />
              <span className="hidden sm:inline">Telegram</span>
            </a>
          </header>
        )}

        <main className="relative min-h-0 w-full min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-hidden p-3 sm:p-4 lg:p-5">
          <div className="h-full min-h-0 w-full min-w-0 max-w-full">
            {page === "command-center" && <CommandCenter />}
            {page === "super-agent" && <SuperAgent />}
            {page === "bots" && <Bots />}
            {page === "tasks" && <Tasks />}
            {page === "browser" && <Browser />}
            {page === "knowledge" && <Knowledge />}
            {page === "memory" && <Memory />}
            {page === "approvals" && <Approvals />}
            {page === "usage" && <Usage />}
            {page === "settings" && <Settings />}
          </div>
        </main>
      </div>

      <Drawers />
      <UpgradeModal />

      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-50 space-y-2 sm:inset-x-auto sm:bottom-6 sm:right-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-xl border border-cyan/20 bg-[#0c1520] px-4 py-3 shadow-xl sm:min-w-[240px]"
            style={{ animation: "toast-in 0.25s ease" }}
          >
            <div className="text-sm text-white">{toast.title}</div>
            {toast.detail && <div className="text-xs text-muted">{toast.detail}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
