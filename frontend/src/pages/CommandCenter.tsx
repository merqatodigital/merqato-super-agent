import { ArrowRight, KeyRound } from "lucide-react";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { AgentRail } from "../components/dashboard/AgentCard";
import { LiveOperations } from "../components/dashboard/LiveOperations";
import { MetricStrip } from "../components/dashboard/MetricStrip";
import { MissionComposer } from "../components/dashboard/MissionComposer";
import { ModelRouter } from "../components/dashboard/ModelRouter";
import { SystemOrb } from "../components/dashboard/SystemOrb";
import { StatusPills } from "../components/layout/StatusPills";
import { useApp, useMetrics } from "../store/AppContext";

function greeting(hour: number) {
  if (hour < 12) return "GOOD MORNING";
  if (hour < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export function CommandCenter() {
  const { agents, settings, openDrawer, setPage, hermesReady, readyDetail, streamingAgentId, modelById } = useApp();
  const metrics = useMetrics();
  const visible = agents.filter((a) => a.enabled);
  const name = settings.operator.name.split(" ")[0]?.toUpperCase();

  // Banner speaks to whichever provider is actually in play.
  const activeModel = modelById(settings.defaultModel);
  const usingLocal = activeModel ? activeModel.source === "ollama" : settings.provider === "ollama";
  const setupMessage = !settings.defaultModel
    ? "No model selected. Open Settings to choose a model from OpenRouter or Ollama Local."
    : usingLocal
      ? `Ollama is not ready — ${readyDetail.toLowerCase()}. Start the local runtime, or switch to OpenRouter in Settings.`
      : `OpenRouter is not ready — ${readyDetail.toLowerCase()}. Add or verify your API key, or switch to Ollama Local.`;

  const sync = streamingAgentId ? 100 : metrics.successRate === null ? 0 : Math.round(metrics.successRate);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-3">
      <div className="scroll-thin flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
          <div>
          <h1 className="font-display text-[26px] font-semibold leading-none tracking-[0.06em] text-white sm:text-[32px] xl:text-[40px] 2xl:text-[48px]">
            COMMAND CENTER
          </h1>
          <p className="mt-2 text-[10px] tracking-[0.28em] text-cyan sm:text-[12px] sm:tracking-[0.32em]">
            {greeting(new Date().getHours())}
            {name ? `, ${name}` : ""}
          </p>
          </div>
          <StatusPills />
        </div>

        {!hermesReady && (
          <button
            type="button"
            onClick={() => setPage("settings")}
            className="flex shrink-0 items-center gap-3 rounded-xl border border-warn/30 bg-warn/[0.07] px-4 py-2.5 text-left transition hover:border-warn/50"
          >
            <KeyRound size={15} className="shrink-0 text-warn" />
            <span className="text-sm leading-snug text-white">{setupMessage}</span>
            <ArrowRight size={14} className="ml-auto shrink-0 text-warn" />
          </button>
        )}

        <div className="grid min-h-0 shrink-0 grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-[200px_minmax(0,1fr)_290px]">
          {/* Orb + composer stay together so the input is always within reach. */}
          <div className="order-1 flex min-w-0 flex-col gap-2 lg:col-span-2 xl:order-2 xl:col-span-1">
            <div className="panel relative h-[170px] overflow-hidden sm:h-[196px] xl:h-[212px] 2xl:h-[236px]">
              <div className="grid-bg absolute inset-0 opacity-60" />
              <SystemOrb sync={sync} />
            </div>
            <MissionComposer />
          </div>
          <div className="order-2 min-w-0 xl:order-1">
            <MetricStrip />
          </div>
          <div className="order-3 min-w-0">
            <ModelRouter />
          </div>
        </div>

        <div className="shrink-0">
          <AgentRail
            agents={visible}
            onSelect={(agent) => {
              if (agent.kind === "super-agent") setPage("super-agent");
              else openDrawer("agent", { agentId: agent.id });
            }}
          />
        </div>

        <div className="flex min-h-[240px] flex-1 flex-col gap-3 xl:flex-row">
          <LiveOperations />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
