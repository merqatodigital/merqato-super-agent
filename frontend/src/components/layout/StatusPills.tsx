import { StatusDot } from "../ui/Primitives";
import { useApp } from "../../store/AppContext";

export function StatusPills() {
  const { agents, settings, openrouter, ollama, streamingAgentId, modelById, setPage, hermesReady, readyDetail } =
    useApp();

  const model = modelById(settings.defaultModel);
  // The selected model decides the live provider; fall back to the configured
  // choice while no model has been picked yet.
  const usingLocal = model ? model.source === "ollama" : settings.provider === "ollama";
  const providerLive = usingLocal ? ollama.state === "connected" : openrouter.state === "connected";

  // An agent only counts as active when Hermes can actually serve a request.
  const enabled = agents.filter((a) => a.enabled).length;
  const activeCount = hermesReady ? enabled : 0;

  const hermesLabel = streamingAgentId
    ? "HERMES WORKING"
    : hermesReady
      ? "HERMES ONLINE"
      : `HERMES OFFLINE · ${readyDetail.toUpperCase()}`;

  const agentsLabel = hermesReady
    ? `${activeCount} AGENT${activeCount === 1 ? "" : "S"} ACTIVE`
    : `${enabled} AGENT${enabled === 1 ? "" : "S"} STANDBY`;

  const providerLabel = usingLocal
    ? providerLive
      ? "OLLAMA LIVE"
      : ollama.state === "error"
        ? "OLLAMA UNREACHABLE"
        : "OLLAMA NOT CONNECTED"
    : providerLive
      ? "OPENROUTER LIVE"
      : openrouter.state === "error"
        ? "OPENROUTER ERROR"
        : settings.apiKey
          ? "OPENROUTER NOT VERIFIED"
          : "OPENROUTER NOT CONNECTED";

  // A saved handle is not a live Telegram connection — say so plainly.
  const telegramLabel = settings.telegramVerified
    ? "TELEGRAM CONNECTED"
    : settings.telegramConfigured
      ? "TELEGRAM CONFIGURED"
      : "TELEGRAM NOT CONFIGURED";

  return (
    <div className="flex w-full flex-wrap items-center gap-1.5 sm:gap-2 xl:w-auto xl:justify-end">
      <button type="button" onClick={() => !hermesReady && setPage("settings")}>
        <Pill
          tone={streamingAgentId ? "cyan" : hermesReady ? "ok" : "warn"}
          pulse={hermesReady}
          label={hermesLabel}
        />
      </button>

      <Pill tone={hermesReady ? "ok" : "off"} label={agentsLabel} />

      <button type="button" onClick={() => setPage("settings")}>
        <Pill tone={providerLive ? "ok" : "warn"} pulse={providerLive} label={providerLabel} />
      </button>

      <button type="button" onClick={() => setPage("settings")} className="min-w-0 max-w-full">
        <Pill
          tone={model ? "ok" : "warn"}
          label={model ? model.name.toUpperCase().slice(0, 26) : "NO MODEL SELECTED"}
        />
      </button>

      <button type="button" onClick={() => setPage("settings")}>
        <Pill
          tone={settings.telegramVerified ? "ok" : settings.telegramConfigured ? "cyan" : "off"}
          pulse={settings.telegramVerified}
          label={telegramLabel}
        />
      </button>
    </div>
  );
}

function Pill({
  tone,
  label,
  pulse,
}: {
  tone: "ok" | "warn" | "off" | "cyan";
  label: string;
  pulse?: boolean;
}) {
  return (
    <div className="flex max-w-full items-center gap-1.5 rounded-full border border-cyan/20 bg-[#0a141e]/80 px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] text-white/90 sm:gap-2 sm:px-3.5 sm:py-1.5 sm:text-[11px] sm:tracking-[0.14em]">
      <StatusDot tone={tone} pulse={pulse} />
      <span className="truncate">{label}</span>
    </div>
  );
}
