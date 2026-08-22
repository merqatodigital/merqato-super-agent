import { AlertTriangle, ArrowDown, ArrowUp, Check, Clock, Minus, Plus, RefreshCw } from "lucide-react";
import { GhostButton, SelectInput, Toggle } from "../ui/Primitives";
import { CHANGE_LABEL } from "../../services/catalog";
import { useApp } from "../../store/AppContext";
import type { CatalogChange } from "../../types";
import { relTime } from "../../utils/format";
import { cn } from "../../utils/cn";

const ICON: Record<CatalogChange["kind"], typeof Plus> = {
  added: Plus,
  removed: Minus,
  became_free: Check,
  became_paid: AlertTriangle,
  price_up: ArrowUp,
  price_down: ArrowDown,
};

const TONE: Record<string, string> = {
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  info: "text-cyan",
};

function stamp(ts: number | null) {
  if (!ts) return "never";
  return new Date(ts).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CatalogSync() {
  const {
    sync,
    settings,
    updateSettings,
    refreshCatalog,
    catalogLoading,
    catalogStale,
    activeModelIssue,
    catalog,
    freeModels,
    setPage,
  } = useApp();

  const diff = sync.lastDiff;
  const nextDue = sync.lastSyncedAt ? sync.lastSyncedAt + settings.syncIntervalHours * 3600_000 : null;
  const freeCount = freeModels.filter((m) => m.source === "openrouter").length;

  return (
    <section className="panel space-y-4 p-5 xl:col-span-2">
      <div className="flex flex-wrap items-center gap-3">
        <RefreshCw size={16} className={cn("text-cyan", catalogLoading && "animate-spin")} />
        <h2 className="font-display text-lg tracking-[0.16em] text-white">CATALOG FRESHNESS</h2>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] tracking-[0.16em]",
            catalogLoading
              ? "border-cyan/40 bg-cyan/10 text-cyan"
              : sync.lastError
                ? "border-danger/40 bg-danger/10 text-danger"
                : catalogStale
                  ? "border-warn/40 bg-warn/10 text-warn"
                  : "border-ok/40 bg-ok/10 text-ok",
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              catalogLoading ? "bg-cyan" : sync.lastError ? "bg-danger" : catalogStale ? "bg-warn" : "bg-ok animate-live",
            )}
          />
          {catalogLoading ? "SYNCING" : sync.lastError ? "SYNC FAILED" : catalogStale ? "STALE" : "UP TO DATE"}
        </span>
        <GhostButton className="ml-auto" onClick={() => void refreshCatalog()} disabled={catalogLoading}>
          <RefreshCw size={13} className={cn(catalogLoading && "animate-spin")} /> Sync now
        </GhostButton>
      </div>

      {activeModelIssue && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertTriangle size={14} />
          {activeModelIssue}
          <button type="button" className="ml-auto underline" onClick={() => setPage("settings")}>
            Choose another
          </button>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Cell label="LAST VERIFIED" value={stamp(sync.lastSyncedAt)} sub={sync.lastSyncedAt ? relTime(sync.lastSyncedAt) : "run a sync"} />
        <Cell
          label="NEXT AUTO SYNC"
          value={nextDue ? stamp(nextDue) : "on next load"}
          sub={settings.autoSyncModels ? `every ${settings.syncIntervalHours}h` : "auto sync off"}
        />
        <Cell label="MODELS RETURNED" value={String(catalog.length)} sub={`${freeCount} free on OpenRouter`} />
        <Cell label="SOURCE" value="GET /api/v1/models" sub="openrouter.ai — live, uncached" />
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-cyan/10 bg-[#071018] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Toggle
            checked={settings.autoSyncModels}
            onChange={(v) => updateSettings({ autoSyncModels: v })}
            label="Auto sync catalog"
          />
          <span className="text-sm text-white">Auto-verify catalog</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-dim" />
          <SelectInput
            value={String(settings.syncIntervalHours)}
            onChange={(e) => updateSettings({ syncIntervalHours: Number(e.target.value) })}
            className="w-36 py-1.5 text-xs"
          >
            <option value="6">Every 6 hours</option>
            <option value="12">Every 12 hours</option>
            <option value="24">Every 24 hours</option>
            <option value="72">Every 3 days</option>
          </SelectInput>
        </div>
        <p className="min-w-0 basis-full text-[11px] leading-relaxed text-muted sm:flex-1 sm:basis-auto">
          Checked on load, on tab focus, and every 10 minutes against the interval above.
        </p>
      </div>

      {sync.lastError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          Last attempt {relTime(sync.lastAttemptAt ?? Date.now())} failed: {sync.lastError}. Showing the previous
          verified list.
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center gap-2 text-[10px] tracking-[0.16em] text-muted">
          CHANGES SINCE PREVIOUS SYNC
          {diff && !diff.baseline && (
            <span className="text-dim">
              {diff.prevCount} → {diff.nextCount} models
            </span>
          )}
        </div>

        {!diff && <p className="text-sm text-muted">No sync recorded yet.</p>}

        {diff?.baseline && (
          <p className="text-sm text-muted">
            Baseline captured — {diff.nextCount} models recorded. The next sync will list every addition, removal and
            free-tier change against this.
          </p>
        )}

        {diff && !diff.baseline && diff.changes.length === 0 && (
          <p className="inline-flex items-center gap-2 text-sm text-ok">
            <Check size={14} /> Identical to the previous sync — no models added, removed or repriced.
          </p>
        )}

        {diff && diff.changes.length > 0 && (
          <div className="scroll-thin max-h-64 space-y-1 overflow-y-auto pr-1">
            {diff.changes.map((change) => {
              const meta = CHANGE_LABEL[change.kind];
              const Icon = ICON[change.kind];
              return (
                <div
                  key={`${change.kind}-${change.id}`}
                  className="flex items-center gap-3 rounded-lg border border-cyan/10 bg-[#071018] px-3 py-2"
                >
                  <Icon size={13} className={TONE[meta.tone]} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-white">{change.name}</div>
                    <div className="truncate text-[10px] text-muted">{change.id}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={cn("text-[10px] tracking-[0.14em]", TONE[meta.tone])}>{meta.text}</div>
                    <div className="text-[10px] text-muted">{change.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="border-t border-cyan/10 pt-3 text-[11px] leading-relaxed text-muted">
        Free status is derived from the live pricing fields returned by OpenRouter, not a hardcoded list — a model
        counts as free only while its prompt and completion price are both zero. Free variants still carry per-day
        request caps, so a working free model can still return HTTP 429; that error is surfaced verbatim in the chat.
      </p>
    </section>
  );
}

function Cell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-cyan/10 bg-[#071018] px-3 py-2">
      <div className="text-[9px] tracking-[0.16em] text-muted">{label}</div>
      <div className="truncate text-sm text-white">{value}</div>
      <div className="truncate text-[10px] text-dim">{sub}</div>
    </div>
  );
}
