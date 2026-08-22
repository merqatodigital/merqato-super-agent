import { useMemo } from "react";
import { AgentAvatar } from "../icons/AgentMark";
import { StatusDot } from "../ui/Primitives";
import { Sparkline } from "../ui/Sparkline";
import { useApp } from "../../store/AppContext";
import type { Agent } from "../../types";
import { money, relTime, seconds } from "../../utils/format";

export function AgentCard({ agent, onClick }: { agent: Agent; onClick?: () => void }) {
  const { runs, streamingAgentId, modelById, modelForAgent, hermesReady } = useApp();
  const model = modelById(modelForAgent(agent));
  const streaming = streamingAgentId === agent.id;

  const stats = useMemo(() => {
    const mine = runs.filter((r) => r.agentId === agent.id);
    const done = mine.filter((r) => r.status === "completed");
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const latencies = done.filter((r) => r.latencyMs).map((r) => r.latencyMs);
    return {
      total: mine.length,
      today: mine.filter((r) => r.createdAt >= startOfDay && r.status === "completed").length,
      cost: mine.reduce((s, r) => s + r.cost, 0),
      avg: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      last: mine[0],
      series: done.slice(0, 12).map((r) => r.latencyMs).reverse(),
    };
  }, [runs, agent.id]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="panel flex w-full min-w-0 flex-1 flex-col p-3.5 text-left transition hover:border-cyan/30"
    >
      <div className="flex items-center gap-3">
        <AgentAvatar icon={agent.icon} size={38} active={agent.enabled} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-[17px] tracking-[0.14em] text-white">{agent.name}</span>
            <span className="truncate text-[11px] text-muted">· {agent.role}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] tracking-[0.16em] text-muted">
            <StatusDot
              tone={streaming ? "cyan" : !agent.enabled ? "off" : hermesReady ? "ok" : "warn"}
              pulse={streaming || (agent.enabled && hermesReady)}
            />
            {streaming ? "WORKING" : !agent.enabled ? "DISABLED" : hermesReady ? "READY" : "OFFLINE"}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-[9px] tracking-[0.16em] text-muted">LAST MISSION</div>
        <div className="mt-1 line-clamp-2 min-h-[34px] text-[12px] leading-snug text-white/90">
          {stats.last ? stats.last.title : "No missions yet"}
        </div>
        <div className="text-[10px] text-dim">
          {stats.last ? relTime(stats.last.createdAt) : model ? model.name : "no model assigned"}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
        <div>
          <div className="text-[9px] tracking-[0.16em] text-muted">TODAY</div>
          <div className="font-display text-xl leading-none text-white">{stats.today || "—"}</div>
          <div className="text-[10px] text-dim">Completed</div>
        </div>
        <div>
          <div className="text-[9px] tracking-[0.16em] text-muted">AVG</div>
          <div className="font-display text-xl leading-none text-white">
            {stats.avg ? seconds(stats.avg) : "—"}
          </div>
          <div className="text-[10px] text-dim">{stats.cost ? money(stats.cost, 3) : "no spend"}</div>
        </div>
        {stats.series.length > 1 ? <Sparkline data={stats.series} width={78} height={30} /> : <div className="h-[30px]" />}
      </div>
    </button>
  );
}

export function AgentRail({ agents, onSelect }: { agents: Agent[]; onSelect: (agent: Agent) => void }) {
  return (
    // Stacks on mobile, two-up on tablet, single row from xl — never scrolls sideways.
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
      {agents.map((agent) => (
        <div key={agent.id} className="min-w-0 xl:min-w-[220px] xl:flex-1">
          <AgentCard agent={agent} onClick={() => onSelect(agent)} />
        </div>
      ))}
    </div>
  );
}
