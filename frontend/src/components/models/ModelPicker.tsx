import { Check, Search, Server, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../../store/AppContext";
import type { CatalogModel } from "../../types";
import { compact, priceLabel, relTime } from "../../utils/format";
import { cn } from "../../utils/cn";

type Tab = "all" | "free" | "paid" | "local";

export function ModelPicker({
  value,
  onChange,
  height = 380,
}: {
  value: string;
  onChange: (id: string) => void;
  height?: number;
}) {
  const { catalog, catalogLoading, catalogError, refreshCatalog, sync, catalogStale } = useApp();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((m) => {
      if (tab === "free" && (!m.free || m.source === "ollama")) return false;
      if (tab === "paid" && m.free) return false;
      if (tab === "local" && m.source !== "ollama") return false;
      if (q && !(`${m.name} ${m.id}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [catalog, tab, query]);

  const counts = useMemo(
    () => ({
      all: catalog.length,
      free: catalog.filter((m) => m.free && m.source !== "ollama").length,
      paid: catalog.filter((m) => !m.free).length,
      local: catalog.filter((m) => m.source === "ollama").length,
    }),
    [catalog],
  );

  return (
    <div className="flex max-h-[60dvh] flex-col" style={{ height }}>
      <div className="mb-2 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-cyan/15 bg-[#071018] px-3">
          <Search size={14} className="text-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search models"
            className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-dim"
          />
        </div>
        <button
          type="button"
          onClick={() => void refreshCatalog()}
          className="rounded-lg border border-cyan/15 px-3 py-2 text-xs text-muted hover:border-cyan/35 hover:text-white"
        >
          {catalogLoading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="mb-2 flex gap-1.5">
        {(["all", "free", "paid", "local"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-[11px] capitalize transition",
              tab === t
                ? "border-cyan/40 bg-cyan/10 text-white"
                : "border-cyan/12 text-muted hover:border-cyan/30 hover:text-white",
            )}
          >
            {t} <span className="text-dim">{counts[t]}</span>
          </button>
        ))}
      </div>

      {catalogError && (
        <div className="mb-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {catalogError}
        </div>
      )}

      <div className="mb-2 flex items-center gap-1.5 px-0.5 text-[10px] text-dim">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            catalogLoading ? "bg-cyan" : catalogStale ? "bg-warn" : "bg-ok",
          )}
        />
        {catalogLoading
          ? "Fetching live catalog from openrouter.ai…"
          : sync.lastSyncedAt
            ? `Live catalog verified ${relTime(sync.lastSyncedAt)}`
            : "Not yet verified"}
      </div>

      <div className="scroll-thin min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {catalogLoading && catalog.length === 0 && (
          <div className="p-6 text-center text-sm text-muted">Loading live model catalog…</div>
        )}
        {!catalogLoading && list.length === 0 && (
          <div className="p-6 text-center text-sm text-muted">No models match.</div>
        )}
        {list.map((m) => (
          <ModelRow key={m.id} model={m} selected={m.id === value} onSelect={() => onChange(m.id)} />
        ))}
      </div>
    </div>
  );
}

function ModelRow({
  model,
  selected,
  onSelect,
}: {
  model: CatalogModel;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition",
        selected ? "border-cyan/45 bg-cyan/10" : "border-cyan/10 hover:border-cyan/30 hover:bg-white/[0.03]",
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
          model.source === "ollama" ? "border-mint/30 text-mint" : "border-cyan/20 text-cyan",
        )}
      >
        {model.source === "ollama" ? <Server size={13} /> : <Sparkles size={13} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-white">{model.name}</div>
        <div className="truncate text-[10px] text-muted">
          {model.id}
          {model.contextLength ? ` · ${compact(model.contextLength)} ctx` : ""}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={cn("text-[10px]", model.free ? "text-ok" : "text-muted")}>
          {model.source === "ollama" ? "Local" : priceLabel(model.promptPerM, model.completionPerM)}
        </div>
      </div>
      {selected && <Check size={14} className="shrink-0 text-cyan" />}
    </button>
  );
}
