import { AlertTriangle, CircuitBoard, Pin, PinOff, Server, Sparkles } from "lucide-react";
import { useState } from "react";
import { ModelPicker } from "../models/ModelPicker";
import { Modal, StatusDot } from "../ui/Primitives";
import { useApp, useMetrics } from "../../store/AppContext";
import { compact, money, priceLabel, relTime, seconds } from "../../utils/format";
import { cn } from "../../utils/cn";

export function ModelRouter() {
  const { settings, updateSettings, catalog, openrouter, ollama, modelById, setPage, activeModelIssue, sync } =
    useApp();
  const metrics = useMetrics();
  const [pickerOpen, setPickerOpen] = useState(false);

  const active = modelById(settings.defaultModel);
  const pinned = settings.routerModels.map((id) => modelById(id)).filter(Boolean);

  const togglePin = (id: string) => {
    const next = settings.routerModels.includes(id)
      ? settings.routerModels.filter((m) => m !== id)
      : [...settings.routerModels, id].slice(-6);
    updateSettings({ routerModels: next });
  };

  return (
    <div className="panel flex h-full min-h-[280px] flex-col p-3.5">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <CircuitBoard size={14} className="text-cyan" />
          <span className="font-display text-[15px] tracking-[0.18em] text-white">MODEL ROUTER</span>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="text-[10px] tracking-[0.16em] text-muted hover:text-cyan"
        >
          BROWSE {catalog.length || ""}
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="rounded-xl border border-cyan/20 bg-cyan/[0.06] px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] tracking-[0.18em] text-cyan">ACTIVE MODEL</span>
            <button type="button" onClick={() => setPickerOpen(true)} className="text-[10px] text-muted hover:text-white">
              change
            </button>
          </div>
          {active ? (
            <>
              <div className="mt-1 truncate text-[13px] text-white">{active.name}</div>
              <div className="truncate text-[10px] text-muted">
                {active.source === "ollama" ? "Local · Ollama" : priceLabel(active.promptPerM, active.completionPerM)}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="mt-1 text-[13px] text-warn hover:underline"
            >
              No model selected — choose one
            </button>
          )}
        </div>

        {pinned.map((model) => {
          if (!model) return null;
          const isActive = model.id === settings.defaultModel;
          return (
            <div
              key={model.id}
              className="flex items-center gap-2.5 rounded-xl border border-cyan/10 bg-[#0a141e] px-3 py-2"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan/15 text-cyan">
                {model.source === "ollama" ? <Server size={13} /> : <Sparkles size={13} />}
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ defaultModel: model.id })}
                className="min-w-0 flex-1 text-left"
              >
                <div className={cn("truncate text-[12px]", isActive ? "text-cyan" : "text-white")}>{model.name}</div>
                <div className="truncate text-[10px] text-muted">{model.free ? "Free" : "Paid"}</div>
              </button>
              <button
                type="button"
                onClick={() => togglePin(model.id)}
                className="text-dim hover:text-white"
                aria-label="Unpin model"
              >
                <PinOff size={12} />
              </button>
            </div>
          );
        })}

        {pinned.length === 0 && (
          <p className="px-1 py-1 text-[11px] leading-relaxed text-muted">
            Pin models from the browser to switch routes in one click.
          </p>
        )}
      </div>

      {activeModelIssue && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="mt-2 flex w-full items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-2 text-left text-[11px] leading-snug text-danger"
        >
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          {activeModelIssue}
        </button>
      )}

      <div className="mt-3 space-y-1.5 px-1">
        <Light
          label="Catalog"
          state={sync.lastError ? "error" : sync.lastSyncedAt ? "connected" : "idle"}
          detail={sync.lastSyncedAt ? `verified ${relTime(sync.lastSyncedAt)}` : "not verified"}
          onClick={() => setPage("settings")}
        />
        <Light
          label="OpenRouter"
          state={openrouter.state}
          detail={openrouter.detail}
          onClick={() => setPage("settings")}
        />
        <Light label="Ollama" state={ollama.state} detail={ollama.detail} onClick={() => setPage("settings")} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="TOKENS" value={metrics.tokens ? compact(metrics.tokens) : "—"} />
        <Stat label="SPEND" value={metrics.hasData ? money(metrics.cost) : "—"} />
        <Stat label="AVG" value={metrics.avgLatency ? seconds(metrics.avgLatency) : "—"} />
      </div>

      <Modal open={pickerOpen} title="MODEL CATALOG" onClose={() => setPickerOpen(false)} wide>
        <p className="mb-3 text-xs text-muted">
          Live from the OpenRouter catalog plus any local Ollama models. Click to activate, pin for quick routing.
        </p>
        <ModelPicker
          value={settings.defaultModel}
          onChange={(id) => {
            updateSettings({ defaultModel: id });
            if (!settings.routerModels.includes(id)) togglePin(id);
          }}
          height={420}
        />
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
          <Pin size={12} /> Selecting a model pins it to the router.
        </div>
      </Modal>
    </div>
  );
}

function Light({
  label,
  state,
  detail,
  onClick,
}: {
  label: string;
  state: "idle" | "checking" | "connected" | "error";
  detail: string;
  onClick: () => void;
}) {
  const tone = state === "connected" ? "ok" : state === "error" ? "warn" : state === "checking" ? "cyan" : "off";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg border border-cyan/10 bg-[#071018] px-2.5 py-1.5 text-left hover:border-cyan/25"
    >
      <StatusDot tone={tone} pulse={state === "connected"} />
      <span className="text-[11px] text-white">{label}</span>
      <span className="min-w-0 flex-1 truncate text-right text-[10px] text-muted">{detail}</span>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cyan/10 bg-[#071018] px-2 py-2">
      <div className="text-[9px] tracking-[0.14em] text-muted">{label}</div>
      <div className="font-display text-lg leading-tight text-white">{value}</div>
    </div>
  );
}
