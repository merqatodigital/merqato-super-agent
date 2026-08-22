import {
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  Cpu,
  Globe,
  LayoutDashboard,
  ListChecks,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LogoMark } from "../icons/AgentMark";
import { StatusDot } from "../ui/Primitives";
import { useApp } from "../../store/AppContext";
import type { PageId } from "../../types";
import { cn } from "../../utils/cn";

const NAV: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: "command-center", label: "Command Center", icon: LayoutDashboard },
  { id: "super-agent", label: "Super Agent", icon: Cpu },
  { id: "bots", label: "Bots", icon: Bot },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "browser", label: "Browser", icon: Globe },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
  { id: "memory", label: "Memory", icon: BrainCircuit },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "usage", label: "Usage", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { page, setPage, runs, settings, openrouter } = useApp();
  const go = (id: PageId) => {
    setPage(id);
    onNavigate?.();
  };
  const approvals = runs.filter((r) => r.status === "pending_approval").length;
  const org = settings.business.name || "Unconfigured workspace";
  const operator = settings.operator.name || "Operator";
  const initials =
    operator
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "OP";
  const role = settings.operator.role;

  // Live contact summary — reflects any edit made in Settings immediately.
  const b = settings.business;
  const locality = [b.city, b.country].filter(Boolean).join(", ");
  const contact = [
    { label: "email", icon: Mail, value: settings.operator.email || b.email },
    { label: "phone", icon: Phone, value: settings.operator.phone || b.phone },
    { label: "location", icon: MapPin, value: locality },
  ].filter((row): row is { label: string; icon: LucideIcon; value: string } => Boolean(row.value));

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-r border-cyan/10 bg-[#070b12]",
        collapsed ? "w-[72px]" : "w-[232px]",
      )}
    >
      <div className={cn("flex items-center gap-3 px-5 py-5", collapsed && "justify-center px-2")}>
        <LogoMark size={28} />
        {!collapsed && (
          <div className="leading-none">
            <div className="font-display text-[17px] font-semibold tracking-[0.18em] text-white">MERQATO</div>
            <div className="mt-1 text-[10px] tracking-[0.28em] text-cyan">AGENT OS</div>
          </div>
        )}
      </div>

      <nav className="scroll-thin mt-2 flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map((item) => {
          const active = page === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => go(item.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition",
                active
                  ? "bg-[#12202c] text-white shadow-[inset_0_0_0_1px_rgba(46,230,214,0.18)]"
                  : "text-white/75 hover:bg-white/[0.05] hover:text-white",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon size={16} className={cn(active ? "text-cyan" : "text-white/55 group-hover:text-cyan")} />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && item.id === "approvals" && approvals > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warn/90 px-1.5 text-[10px] font-semibold text-[#2a1b00]">
                  {approvals}
                </span>
              )}
              {!collapsed && item.id === "settings" && openrouter.state !== "connected" && (
                <StatusDot tone={openrouter.state === "error" ? "warn" : "off"} />
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-cyan/10 p-3">
        <button
          type="button"
          title={collapsed ? `${operator} · ${org}` : "Edit company and contact details"}
          onClick={() => go("settings")}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.05]",
            collapsed && "justify-center",
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan/40 text-[11px] font-semibold text-cyan">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] text-white">{operator}</div>
              <div className="truncate text-[11px] text-white/65">{role ? `${role} · ${org}` : org}</div>
            </div>
          )}
          {!collapsed && (
            <Pencil size={12} className="shrink-0 text-white/0 transition group-hover:text-cyan" />
          )}
        </button>

        {!collapsed && contact.length > 0 && (
          <div className="mt-1 space-y-1 px-2 pb-1">
            {contact.map((row) => (
              <div key={row.label} className="flex items-center gap-2 text-[10px] text-white/60" title={row.value}>
                <row.icon size={10} className="shrink-0 text-white/45" />
                <span className="truncate">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
