import { useMemo } from "react";
import { Console } from "../components/chat/Console";
import { GhostButton, StatusDot } from "../components/ui/Primitives";
import { useApp } from "../store/AppContext";
import { money, seconds } from "../utils/format";

export function SuperAgent() {
  const { agents, runs, openDrawer, setPage, modelById, modelForAgent, openrouter, settings, docs, memory } = useApp();
  const hermes = agents.find((a) => a.kind === "super-agent") ?? agents[0];
  const specialists = agents.filter((a) => a.kind === "specialist" && a.enabled);

  const stats = useMemo(() => {
    const mine = runs.filter((r) => r.agentId === hermes?.id);
    const done = mine.filter((r) => r.status === "completed");
    const lat = done.filter((r) => r.latencyMs).map((r) => r.latencyMs);
    return {
      total: mine.length,
      done: done.length,
      cost: mine.reduce((s, r) => s + r.cost, 0),
      tokens: mine.reduce((s, r) => s + r.promptTokens + r.completionTokens, 0),
      avg: lat.length ? lat.reduce((a, b) => a + b, 0) / lat.length : 0,
    };
  }, [runs, hermes?.id]);

  if (!hermes) return null;
  const model = modelById(modelForAgent(hermes));

  return (
    <div className="scroll-thin flex h-full min-h-0 flex-col gap-3 overflow-y-auto xl:overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-[0.24em] text-cyan sm:text-[11px] sm:tracking-[0.28em]">
            PRIMARY CONTROL SURFACE
          </div>
          <h1 className="font-display text-[26px] tracking-[0.06em] text-white sm:text-[32px] xl:text-4xl">
            SUPER AGENT
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <GhostButton onClick={() => openDrawer("agent", { agentId: hermes.id })}>Configure</GhostButton>
          <GhostButton onClick={() => setPage("bots")}>Manage bots</GhostButton>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex h-[62vh] min-h-[380px] flex-col xl:h-auto xl:min-h-0">
          <Console agentId={hermes.id} />
        </div>

        <div className="scroll-thin space-y-3 xl:overflow-y-auto">
          <section className="panel space-y-2 p-4">
            <h3 className="font-display text-sm tracking-[0.16em] text-white">RUNTIME</h3>
            <Row
              ok={openrouter.state === "connected"}
              label="OpenRouter"
              value={openrouter.state === "connected" ? "Live" : openrouter.detail}
            />
            <Row ok={Boolean(model)} label="Model" value={model ? model.name : "not selected"} />
            <Row ok={Boolean(settings.business.name)} label="Business context" value={settings.business.name || "empty"} />
            <Row
              ok={docs.some((d) => d.includeInContext)}
              label="Documents"
              value={`${docs.filter((d) => d.includeInContext).length} in context`}
            />
            <Row ok={memory.length > 0} label="Memory" value={`${memory.length} notes`} />
          </section>

          <section className="panel p-4">
            <h3 className="mb-3 font-display text-sm tracking-[0.16em] text-white">PERFORMANCE</h3>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Runs" value={stats.total ? String(stats.total) : "—"} />
              <Stat label="Completed" value={stats.done ? String(stats.done) : "—"} />
              <Stat label="Avg latency" value={stats.avg ? seconds(stats.avg) : "—"} />
              <Stat label="Spend" value={stats.total ? money(stats.cost, 3) : "—"} />
            </div>
            <p className="mt-3 text-[11px] text-muted">
              {stats.tokens ? `${stats.tokens.toLocaleString()} tokens processed` : "No usage recorded yet."}
            </p>
          </section>

          <section className="panel p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-sm tracking-[0.16em] text-white">LINKED BOTS</h3>
              <button type="button" onClick={() => setPage("bots")} className="text-[10px] tracking-[0.16em] text-cyan">
                MANAGE
              </button>
            </div>
            {specialists.length === 0 ? (
              <p className="text-[12px] leading-relaxed text-muted">
                No specialists yet. Hermes handles every mission directly.
              </p>
            ) : (
              <div className="space-y-1.5">
                {specialists.map((bot) => (
                  <button
                    key={bot.id}
                    type="button"
                    onClick={() => openDrawer("agent", { agentId: bot.id })}
                    className="flex w-full items-center justify-between rounded-lg border border-cyan/10 px-3 py-2 text-left hover:border-cyan/30"
                  >
                    <span className="text-sm text-white">{bot.name}</span>
                    <span className="text-[11px] text-muted">{bot.role}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <StatusDot tone={ok ? "ok" : "warn"} pulse={ok} />
      <span className="text-white/85">{label}</span>
      <span className="min-w-0 flex-1 truncate text-right text-muted">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cyan/10 bg-[#071018] px-3 py-2">
      <div className="text-[9px] tracking-[0.16em] text-muted">{label}</div>
      <div className="font-display text-xl text-white">{value}</div>
    </div>
  );
}
