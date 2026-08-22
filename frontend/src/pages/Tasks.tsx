import { useMemo, useState } from "react";
import { AgentAvatar } from "../components/icons/AgentMark";
import { GhostButton } from "../components/ui/Primitives";
import { RunStatusIcon, statusMeta } from "../components/dashboard/LiveOperations";
import { useApp } from "../store/AppContext";
import type { RunStatus } from "../types";
import { money, relTime, seconds } from "../utils/format";
import { cn } from "../utils/cn";

const FILTERS: { id: "all" | RunStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "running", label: "Running" },
  { id: "pending_approval", label: "Awaiting approval" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
  { id: "rejected", label: "Rejected" },
];

export function Tasks() {
  const { runs, agents, openDrawer, setPage } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  const rows = useMemo(
    () =>
      runs.filter((r) => {
        if (filter !== "all" && r.status !== filter) return false;
        if (query && !r.title.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [runs, filter, query],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.28em] text-cyan">HISTORY</div>
          <h1 className="font-display text-4xl tracking-[0.08em] text-white">TASKS</h1>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter missions"
          className="w-full rounded-lg border border-cyan/15 bg-[#071018] px-3 py-2 text-sm outline-none placeholder:text-dim focus:border-cyan/40 sm:w-56"
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <GhostButton
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(filter === f.id && "border-cyan/40 bg-cyan/10 text-white")}
          >
            {f.label}
          </GhostButton>
        ))}
      </div>

      <div className="panel scroll-thin min-h-0 flex-1 overflow-auto p-2">
        {rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
            <p className="text-sm text-white">{runs.length === 0 ? "No missions run yet" : "Nothing in this view"}</p>
            <p className="max-w-sm text-xs text-muted">
              Every message you send to an agent is recorded here with its model, tokens, latency and cost.
            </p>
            {runs.length === 0 && (
              <GhostButton className="mt-2" onClick={() => setPage("super-agent")}>
                Open Super Agent
              </GhostButton>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((run) => {
              const agent = agentMap[run.agentId];
              const meta = statusMeta[run.status];
              return (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => openDrawer("run", { runId: run.id })}
                  className="flex w-full flex-wrap items-center gap-3 rounded-xl border border-cyan/10 bg-[#071018] px-3 py-3 text-left hover:border-cyan/30"
                >
                  {agent && <AgentAvatar icon={agent.icon} size={32} active />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-white">{run.title}</div>
                    <div className="truncate text-[11px] text-muted">
                      {agent?.name ?? run.agentId} · {run.model || "no model"} · {relTime(run.createdAt)}
                    </div>
                  </div>
                  <div className="hidden text-right text-[11px] text-muted sm:block">
                    <div>{run.promptTokens + run.completionTokens || 0} tokens</div>
                    <div>
                      {run.latencyMs ? seconds(run.latencyMs) : "—"} · {run.cost ? money(run.cost, 4) : "$0"}
                    </div>
                  </div>
                  <div className={cn("flex items-center gap-1.5 text-xs", meta.className)}>
                    <RunStatusIcon status={run.status} />
                    {meta.label}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
