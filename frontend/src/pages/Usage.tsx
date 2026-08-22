import { useMemo } from "react";
import { AreaChart } from "../components/ui/Sparkline";
import { useApp, useMetrics } from "../store/AppContext";
import { compact, money, seconds } from "../utils/format";

export function Usage() {
  const { runs, agents, keyInfo, modelById } = useApp();
  const metrics = useMetrics();

  const byModel = useMemo(() => {
    const map = new Map<string, { tokens: number; cost: number; runs: number }>();
    runs.forEach((r) => {
      if (!r.model) return;
      const entry = map.get(r.model) ?? { tokens: 0, cost: 0, runs: 0 };
      entry.tokens += r.promptTokens + r.completionTokens;
      entry.cost += r.cost;
      entry.runs += 1;
      map.set(r.model, entry);
    });
    return [...map.entries()].sort((a, b) => b[1].tokens - a[1].tokens);
  }, [runs]);

  const byAgent = useMemo(() => {
    const map = new Map<string, { tokens: number; cost: number; runs: number }>();
    runs.forEach((r) => {
      const entry = map.get(r.agentId) ?? { tokens: 0, cost: 0, runs: 0 };
      entry.tokens += r.promptTokens + r.completionTokens;
      entry.cost += r.cost;
      entry.runs += 1;
      map.set(r.agentId, entry);
    });
    return [...map.entries()].sort((a, b) => b[1].tokens - a[1].tokens);
  }, [runs]);

  const maxModel = Math.max(...byModel.map(([, v]) => v.tokens), 1);
  const maxAgent = Math.max(...byAgent.map(([, v]) => v.tokens), 1);

  return (
    <div className="scroll-thin h-full overflow-y-auto pr-1">
      <div className="mb-5">
        <div className="text-[11px] tracking-[0.28em] text-cyan">TELEMETRY</div>
        <h1 className="font-display text-4xl tracking-[0.08em] text-white">USAGE</h1>
        <p className="mt-2 text-sm text-muted">Measured from your own runs in this browser.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="TOTAL RUNS" value={metrics.totalRuns ? String(metrics.totalRuns) : "—"} />
        <Metric label="TOKENS" value={metrics.tokens ? compact(metrics.tokens) : "—"} />
        <Metric label="SPEND" value={metrics.hasData ? money(metrics.cost, 4) : "—"} />
        <Metric label="AVG LATENCY" value={metrics.avgLatency ? seconds(metrics.avgLatency) : "—"} />
      </div>

      {keyInfo && (
        <section className="panel mt-3 flex flex-wrap items-center gap-4 p-4 text-sm">
          <span className="text-muted">OpenRouter account:</span>
          <span className="text-white">{keyInfo.label}</span>
          <span className="text-muted">used {money(keyInfo.usage)}</span>
          {keyInfo.limitRemaining !== null && (
            <span className="text-ok">{money(keyInfo.limitRemaining)} remaining on this key</span>
          )}
        </section>
      )}

      {metrics.tokenSeries.length > 1 && (
        <section className="panel mt-3 p-4">
          <div className="mb-2 text-[11px] tracking-[0.16em] text-muted">TOKENS PER RUN (RECENT)</div>
          <AreaChart data={metrics.tokenSeries} height={110} />
        </section>
      )}

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section className="panel p-4">
          <h3 className="font-display text-lg tracking-[0.16em] text-white">BY MODEL</h3>
          {byModel.length === 0 && <p className="mt-3 text-sm text-muted">No usage recorded yet.</p>}
          <div className="mt-3 space-y-3">
            {byModel.map(([id, v]) => (
              <div key={id}>
                <div className="mb-1 flex justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate">{modelById(id)?.name ?? id}</span>
                  <span className="shrink-0 text-muted">
                    {compact(v.tokens)} · {money(v.cost, 4)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#163042]">
                  <div className="h-full rounded-full bg-cyan" style={{ width: `${(v.tokens / maxModel) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-4">
          <h3 className="font-display text-lg tracking-[0.16em] text-white">BY AGENT</h3>
          {byAgent.length === 0 && <p className="mt-3 text-sm text-muted">No usage recorded yet.</p>}
          <div className="mt-3 space-y-3">
            {byAgent.map(([id, v]) => (
              <div key={id} className="flex items-center gap-3">
                <div className="w-20 truncate text-xs tracking-wider text-muted">
                  {agents.find((a) => a.id === id)?.name ?? id}
                </div>
                <div className="h-2 flex-1 rounded-full bg-[#163042]">
                  <div className="h-full rounded-full bg-teal" style={{ width: `${(v.tokens / maxAgent) * 100}%` }} />
                </div>
                <div className="w-20 text-right text-[11px] text-muted">{money(v.cost, 4)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <div className="text-[10px] tracking-[0.16em] text-muted">{label}</div>
      <div className="truncate font-display text-2xl text-white sm:text-3xl">{value}</div>
    </div>
  );
}
