import { AlertTriangle, Check, CircleDashed, Loader2, ShieldQuestion, X } from "lucide-react";
import { AgentAvatar } from "../icons/AgentMark";
import { StatusDot } from "../ui/Primitives";
import { useApp } from "../../store/AppContext";
import type { Run, RunStatus } from "../../types";
import { money, relTime, seconds } from "../../utils/format";
import { cn } from "../../utils/cn";

export const statusMeta: Record<RunStatus, { label: string; className: string }> = {
  pending_approval: { label: "Needs approval", className: "text-warn" },
  running: { label: "Running", className: "text-cyan" },
  completed: { label: "Completed", className: "text-ok" },
  failed: { label: "Failed", className: "text-danger" },
  rejected: { label: "Rejected", className: "text-muted" },
};

export function RunStatusIcon({ status }: { status: RunStatus }) {
  if (status === "completed") return <Check size={13} className="text-ok" />;
  if (status === "running") return <Loader2 size={13} className="animate-spin text-cyan" />;
  if (status === "failed") return <AlertTriangle size={13} className="text-danger" />;
  if (status === "rejected") return <X size={13} className="text-muted" />;
  return <ShieldQuestion size={13} className="text-warn" />;
}

export function LiveOperations() {
  const { runs, agents, openDrawer, setPage } = useApp();
  const rows = runs.slice(0, 6);
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));
  const live = runs.some((r) => r.status === "running");

  return (
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <StatusDot tone={live ? "ok" : "off"} pulse={live} />
          <span className="truncate font-display text-[15px] tracking-[0.18em] text-white">LIVE OPERATIONS</span>
        </div>
        {runs.length > 0 && (
          <button
            type="button"
            onClick={() => setPage("tasks")}
            className="shrink-0 text-[10px] tracking-[0.16em] text-muted hover:text-cyan"
          >
            VIEW ALL
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyOps />
      ) : (
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
          {/* Stacked cards on mobile and tablet — no horizontal scrolling */}
          <div className="space-y-2 lg:hidden">
            {rows.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                agent={agentMap[run.agentId]}
                onOpen={() => openDrawer("run", { runId: run.id })}
              />
            ))}
          </div>

          {/* Table from lg up */}
          <table className="hidden w-full border-collapse text-left lg:table">
            <thead>
              <tr className="text-[10px] tracking-[0.16em] text-muted">
                <th className="px-2 py-2 font-medium">MISSION</th>
                <th className="px-2 py-2 font-medium">AGENT</th>
                <th className="px-2 py-2 font-medium">STATUS</th>
                <th className="px-2 py-2 font-medium">TOKENS</th>
                <th className="px-2 py-2 font-medium">LATENCY</th>
                <th className="px-2 py-2 font-medium">COST</th>
                <th className="px-2 py-2 font-medium">WHEN</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((run) => {
                const agent = agentMap[run.agentId];
                const meta = statusMeta[run.status];
                return (
                  <tr
                    key={run.id}
                    onClick={() => openDrawer("run", { runId: run.id })}
                    className="cursor-pointer border-t border-cyan/8 text-[12px] transition hover:bg-white/[0.025]"
                  >
                    <td className="max-w-[240px] px-2 py-2.5">
                      <div className="flex items-center gap-2 text-white/90">
                        <RunStatusIcon status={run.status} />
                        <span className="truncate">{run.title}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        {agent && <AgentAvatar icon={agent.icon} size={22} active />}
                        <span className="truncate text-white/80">{agent?.name ?? run.agentId}</span>
                      </div>
                    </td>
                    <td className={cn("whitespace-nowrap px-2 py-2.5", meta.className)}>{meta.label}</td>
                    <td className="px-2 py-2.5 text-muted">{run.promptTokens + run.completionTokens || "—"}</td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-muted">
                      {run.latencyMs ? seconds(run.latencyMs) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-muted">
                      {run.cost ? money(run.cost, 4) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-muted">{relTime(run.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RunCard({
  run,
  agent,
  onOpen,
}: {
  run: Run;
  agent?: { name: string; icon: string };
  onOpen: () => void;
}) {
  const meta = statusMeta[run.status];
  const tokens = run.promptTokens + run.completionTokens;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-xl border border-cyan/10 bg-[#071018] p-3 text-left transition hover:border-cyan/30"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">
          <RunStatusIcon status={run.status} />
        </span>
        <span className="min-w-0 flex-1 break-words text-[13px] leading-snug text-white">{run.title}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="flex min-w-0 items-center gap-1.5">
          {agent && <AgentAvatar icon={agent.icon} size={20} active />}
          <span className="truncate text-[11px] text-white/80">{agent?.name ?? run.agentId}</span>
        </span>
        <span className={cn("text-[11px]", meta.className)}>{meta.label}</span>
        <span className="ml-auto text-[10px] text-muted">{relTime(run.createdAt)}</span>
      </div>

      {(tokens > 0 || run.latencyMs > 0 || run.cost > 0) && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-cyan/10 pt-2 text-[10px] text-muted">
          {tokens > 0 && <span>{tokens} tokens</span>}
          {run.latencyMs > 0 && <span>{seconds(run.latencyMs)}</span>}
          {run.cost > 0 && <span>{money(run.cost, 4)}</span>}
        </div>
      )}
    </button>
  );
}

function EmptyOps() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <CircleDashed size={22} className="text-dim" />
      <p className="text-sm text-white">No missions yet</p>
      <p className="max-w-xs text-xs leading-relaxed text-muted">
        Send a mission below and every run — tokens, latency and cost — appears here.
      </p>
    </div>
  );
}
