import { AlertTriangle, Check, ExternalLink, Eye, EyeOff, KeyRound, Loader2, RefreshCw, Server } from "lucide-react";
import { useState } from "react";
import { ModelPicker } from "../components/models/ModelPicker";
import { CatalogSync } from "../components/settings/CatalogSync";
import { BackendPanel } from "../components/settings/BackendPanel";
import { ProfilePanel } from "../components/settings/ProfilePanel";
import { Field, GhostButton, PrimaryButton, TextInput } from "../components/ui/Primitives";
import { useApp } from "../store/AppContext";
import { money } from "../utils/format";
import { cn } from "../utils/cn";

export function Settings() {
  const {
    settings,
    updateSettings,
    openrouter,
    ollama,
    keyInfo,
    testOpenRouter,
    testOllama,
    refreshCatalog,
    catalog,
    catalogLoading,
    modelById,
    resetWorkspace,
    pushToast,
    freeModels,
    paidModels,
    specialistCount,
    botAllowance,
    setUpgradeOpen,
    downgradePlan,
  } = useApp();

  const [keyDraft, setKeyDraft] = useState(settings.apiKey);
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = modelById(settings.defaultModel);

  const saveAndTest = async () => {
    setBusy(true);
    const trimmed = keyDraft.trim();
    updateSettings({ apiKey: trimmed });
    const ok = await testOpenRouter(trimmed);
    if (ok) {
      await refreshCatalog();
      pushToast({ title: "OpenRouter connected", detail: "Live model catalog loaded", tone: "ok" });
    }
    setBusy(false);
  };

  return (
    <div className="scroll-thin h-full overflow-y-auto pr-1">
      <div className="mb-5">
        <div className="text-[11px] tracking-[0.28em] text-cyan">CONTROL PLANE</div>
        <h1 className="font-display text-4xl tracking-[0.08em] text-white">SETTINGS</h1>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {/* OPENROUTER */}
        <section className="panel space-y-4 p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <KeyRound size={16} className="text-cyan" />
            <h2 className="font-display text-lg tracking-[0.16em] text-white">OPENROUTER API KEY</h2>
            <ConnBadge state={openrouter.state} detail={openrouter.detail} />
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs text-muted hover:text-cyan"
            >
              Get a key <ExternalLink size={12} />
            </a>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <TextInput
                type={reveal ? "text" : "password"}
                value={keyDraft}
                spellCheck={false}
                autoComplete="off"
                onChange={(e) => setKeyDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void saveAndTest()}
                placeholder="sk-or-v1-…"
                className="pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-dim hover:text-white"
                aria-label={reveal ? "Hide key" : "Show key"}
              >
                {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <PrimaryButton onClick={() => void saveAndTest()} disabled={busy || !keyDraft.trim()}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save & test
            </PrimaryButton>
            {settings.apiKey && (
              <GhostButton
                onClick={() => {
                  setKeyDraft("");
                  updateSettings({ apiKey: "" });
                  void testOpenRouter("");
                }}
              >
                Clear
              </GhostButton>
            )}
          </div>

          <p className="text-[11px] leading-relaxed text-muted">
            The key is stored in this browser only and sent directly to openrouter.ai. When the FastAPI/Hermes backend
            is connected, move the key server-side and the UI will read status from your API instead.
          </p>

          {keyInfo && (
            <div className="grid gap-2 sm:grid-cols-4">
              <Stat label="KEY LABEL" value={keyInfo.label} />
              <Stat label="CREDITS USED" value={money(keyInfo.usage)} />
              <Stat
                label="LIMIT"
                value={keyInfo.limit === null ? "Unlimited" : money(keyInfo.limit)}
              />
              <Stat
                label="REMAINING"
                value={keyInfo.limitRemaining === null ? "—" : money(keyInfo.limitRemaining)}
              />
            </div>
          )}

          {openrouter.state === "error" && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertTriangle size={14} /> {openrouter.detail}
            </div>
          )}
        </section>

        <CatalogSync />

        {/* MODEL CATALOG */}
        <section className="panel space-y-3 p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg tracking-[0.16em] text-white">MODEL SELECTION</h2>
            <span className="rounded-full border border-cyan/20 px-2 py-0.5 text-[10px] tracking-wider text-muted">
              {catalog.length} TOTAL
            </span>
            <span className="rounded-full border border-ok/25 px-2 py-0.5 text-[10px] tracking-wider text-ok">
              {freeModels.length} FREE
            </span>
            <span className="rounded-full border border-cyan/20 px-2 py-0.5 text-[10px] tracking-wider text-cyan">
              {paidModels.length} PAID
            </span>
            <GhostButton className="ml-auto" onClick={() => void refreshCatalog()}>
              <RefreshCw size={13} className={cn(catalogLoading && "animate-spin")} /> Refresh catalog
            </GhostButton>
          </div>

          <div className="rounded-lg border border-cyan/15 bg-[#071018] px-3 py-2 text-sm">
            <span className="text-muted">Active model: </span>
            <span className={active ? "text-cyan" : "text-warn"}>
              {active ? `${active.name} (${active.id})` : "none selected"}
            </span>
          </div>

          <ModelPicker value={settings.defaultModel} onChange={(id) => updateSettings({ defaultModel: id })} height={340} />
        </section>

        {/* OLLAMA */}
        <section className="panel space-y-4 p-5">
          <div className="flex items-center gap-3">
            <Server size={16} className="text-cyan" />
            <h2 className="font-display text-lg tracking-[0.16em] text-white">OLLAMA LOCAL</h2>
            <ConnBadge state={ollama.state} detail={ollama.detail} />
          </div>
          <Field label="Base URL">
            <TextInput
              value={settings.ollamaUrl}
              onChange={(e) => updateSettings({ ollamaUrl: e.target.value })}
              placeholder="http://localhost:11434"
            />
          </Field>
          <GhostButton onClick={() => void testOllama()}>Test local runtime</GhostButton>
          <p className="text-[11px] leading-relaxed text-muted">
            Ollama must allow this origin. Start it with
            <code className="mx-1 rounded bg-black/40 px-1 py-0.5 font-mono text-[10px]">OLLAMA_ORIGINS=*</code>
            to permit browser requests.
          </p>
        </section>

        {/* TELEGRAM */}
        <section className="panel space-y-4 p-5">
          <h2 className="font-display text-lg tracking-[0.16em] text-white">TELEGRAM</h2>
          <Field label="Bot handle">
            <TextInput
              value={settings.telegramHandle}
              onChange={(e) => updateSettings({ telegramHandle: e.target.value })}
              placeholder="@your_bot"
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <PrimaryButton
              onClick={() => updateSettings({ telegramConfigured: Boolean(settings.telegramHandle.trim()) })}
              disabled={!settings.telegramHandle.trim()}
            >
              Save handle
            </PrimaryButton>
            {settings.telegramConfigured && (
              <GhostButton
                onClick={() => updateSettings({ telegramConfigured: false, telegramVerified: false })}
              >
                Clear
              </GhostButton>
            )}
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] tracking-[0.16em]",
                settings.telegramVerified
                  ? "border-ok/40 bg-ok/10 text-ok"
                  : settings.telegramConfigured
                    ? "border-cyan/30 bg-cyan/10 text-cyan"
                    : "border-white/20 bg-white/5 text-white/70",
              )}
            >
              {settings.telegramVerified
                ? "CONNECTED"
                : settings.telegramConfigured
                  ? "CONFIGURED · NOT VERIFIED"
                  : "NOT CONFIGURED"}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted">
            Saving stores the handle locally so the mobile view can deep-link to it. That is not a live connection —
            the account is only reported as connected once the Hermes backend verifies the bot token.
          </p>
        </section>

        <ProfilePanel />

        <section className="panel space-y-3 p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg tracking-[0.16em] text-white">PLAN</h2>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] tracking-[0.16em]",
                settings.plan === "pro"
                  ? "border-cyan/40 bg-cyan/10 text-cyan"
                  : "border-white/20 bg-white/5 text-muted",
              )}
            >
              {settings.plan === "pro" ? "PRO" : "STARTER"}
            </span>
            <span className="text-sm text-muted">
              {specialistCount} of {botAllowance} specialist bots in use
            </span>
            <div className="ml-auto flex gap-2">
              {settings.plan === "free" ? (
                <PrimaryButton onClick={() => setUpgradeOpen(true)}>Unlock specialist bots</PrimaryButton>
              ) : (
                <GhostButton onClick={downgradePlan}>Switch to Starter</GhostButton>
              )}
            </div>
          </div>
        </section>

        <BackendPanel />

        <section className="panel space-y-3 p-5 xl:col-span-2">
          <h2 className="font-display text-lg tracking-[0.16em] text-white">WORKSPACE</h2>
          <p className="text-[11px] leading-relaxed text-white/60">
            Setup finished
            {settings.onboardingCompletedAt
              ? ` on ${new Date(settings.onboardingCompletedAt).toLocaleDateString([], {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                })}`
              : ""}
            . Everything captured during onboarding now lives on this page — edit it here rather than repeating the
            wizard. Erasing resets the workspace and starts setup from scratch.
          </p>
          <div className="flex flex-wrap gap-2">
            <GhostButton
              className="border-danger/30 text-danger hover:border-danger/50"
              onClick={() => {
                resetWorkspace();
                setKeyDraft("");
                pushToast({ title: "Workspace cleared", tone: "warn" });
              }}
            >
              Erase all local data
            </GhostButton>
          </div>
        </section>
      </div>
    </div>
  );
}

function ConnBadge({ state, detail }: { state: "idle" | "checking" | "connected" | "error"; detail: string }) {
  const map = {
    connected: { text: "CONNECTED", cls: "border-ok/40 bg-ok/10 text-ok", dot: "bg-ok" },
    checking: { text: "CHECKING", cls: "border-cyan/40 bg-cyan/10 text-cyan", dot: "bg-cyan" },
    error: { text: "ERROR", cls: "border-danger/40 bg-danger/10 text-danger", dot: "bg-danger" },
    idle: { text: "NOT CONNECTED", cls: "border-white/15 bg-white/5 text-muted", dot: "bg-dim" },
  }[state];

  return (
    <span
      className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] tracking-[0.16em]", map.cls)}
      title={detail}
    >
      <span className={cn("h-2 w-2 rounded-full", map.dot, state === "connected" && "animate-live")} />
      {map.text}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cyan/10 bg-[#071018] px-3 py-2">
      <div className="text-[9px] tracking-[0.16em] text-muted">{label}</div>
      <div className="truncate text-sm text-white">{value}</div>
    </div>
  );
}
