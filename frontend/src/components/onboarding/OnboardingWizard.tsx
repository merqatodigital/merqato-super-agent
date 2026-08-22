import { useState } from "react";
import { Check, Cloud, ExternalLink, FileText, HardDrive, Loader2, Upload } from "lucide-react";
import { LogoMark } from "../icons/AgentMark";
import { ModelPicker } from "../models/ModelPicker";
import { Field, GhostButton, PrimaryButton, SelectInput, TextArea, TextInput } from "../ui/Primitives";
import { useApp } from "../../store/AppContext";
import { backend, toClientPayload } from "../../services/backend";
import { bytes } from "../../utils/format";
import { cn } from "../../utils/cn";

const STEPS = ["Welcome", "Business", "Provider", "Model", "Documents", "Telegram"];

export function OnboardingWizard() {
  const {
    settings,
    updateSettings,
    testOpenRouter,
    refreshCatalog,
    openrouter,
    ollama,
    testOllama,
    keyInfo,
    docs,
    addDocs,
    modelById,
  } = useApp();

  const [step, setStep] = useState(0);
  const [keyDraft, setKeyDraft] = useState(settings.apiKey);
  const [busy, setBusy] = useState(false);

  const provider = settings.provider;
  const setProvider = (next: "ollama" | "openrouter") => updateSettings({ provider: next });
  const model = modelById(settings.defaultModel);

  const test = async () => {
    setBusy(true);
    updateSettings({ apiKey: keyDraft.trim() });
    const ok = await testOpenRouter(keyDraft.trim());
    if (ok) await refreshCatalog();
    setBusy(false);
  };

  const probeLocal = async () => {
    setBusy(true);
    await testOllama();
    setBusy(false);
  };

  const providerReady = provider === "ollama" ? ollama.state === "connected" : openrouter.state === "connected";

  // An OpenRouter key is required only when OpenRouter is the chosen provider.
  // Ollama users continue without one.
  const canNext =
    step === 1
      ? settings.business.name.trim().length > 1
      : step === 2
        ? provider === "ollama" || openrouter.state === "connected"
        : step === 3
          ? Boolean(settings.defaultModel)
          : true;

  const blockedReason =
    step === 1 && settings.business.name.trim().length <= 1
      ? "Enter a business name to continue."
      : step === 2 && provider === "openrouter" && openrouter.state !== "connected"
        ? "Verify your OpenRouter API key to continue, or switch to Ollama Local."
        : step === 3 && !settings.defaultModel
          ? "Select a model to continue."
          : "";

  // Runs once. Afterwards the wizard is never shown again — Settings holds the record.
  const finish = async () => {
    updateSettings({ onboardingComplete: true, onboardingCompletedAt: Date.now() });
    if (backend.configured) {
      try {
        const created = await backend.createClient(
          toClientPayload({
            business: settings.business,
            operator: settings.operator,
            telegramHandle: settings.telegramHandle,
          }),
        );
        updateSettings({ clientId: String(created.id) });
      } catch {
        // Non-fatal: backend registration failed, frontend still works standalone
      }
    }
  };

  return (
    <div className="radial-vignette grid-bg flex min-h-full items-center justify-center overflow-y-auto p-4 md:p-8">
      <div className="panel my-auto w-full max-w-3xl overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-cyan/10 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <div className="font-display text-lg tracking-[0.18em] text-white">MERQATO SETUP</div>
              <div className="text-[10px] tracking-[0.22em] text-cyan">CUSTOMER ONBOARDING</div>
            </div>
          </div>
          <GhostButton onClick={finish}>Skip</GhostButton>
        </header>

        <div className="flex gap-1 px-4 pt-4 sm:px-6">
          {STEPS.map((label, i) => (
            <button key={label} type="button" onClick={() => setStep(i)} className="flex-1">
              <div className={cn("h-1 rounded-full", i <= step ? "bg-cyan" : "bg-[#163042]")} />
              <div
                className={cn(
                  "mt-2 hidden text-[10px] tracking-[0.14em] md:block",
                  i === step ? "text-cyan" : i < step ? "text-white/75" : "text-white/50",
                )}
              >
                {label}
              </div>
            </button>
          ))}
        </div>

        <div className="min-h-[340px] px-4 py-5 sm:min-h-[380px] sm:px-6 sm:py-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-4xl tracking-[0.08em] text-white">Bring Hermes online</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-white/80">
                Six short steps: describe the business, choose an inference provider, pick a model from the live
                catalogue, attach documents and add a Telegram handle.
              </p>
              <div className="grid max-w-2xl gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-cyan/15 bg-[#071018] p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <HardDrive size={13} className="text-cyan" />
                    <span className="text-[11px] tracking-[0.14em] text-white">OLLAMA LOCAL</span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-white/70">
                    Runs models on your own machine. No API key and no per-token cost.
                  </p>
                </div>
                <div className="rounded-lg border border-cyan/15 bg-[#071018] p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Cloud size={13} className="text-cyan" />
                    <span className="text-[11px] tracking-[0.14em] text-white">OPENROUTER</span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-white/70">
                    Hosted catalogue with free and paid models. Requires an API key.
                  </p>
                </div>
              </div>
              <p className="max-w-2xl text-[12px] leading-relaxed text-white/60">
                Pick either one — you can add the other later in Settings. Nothing is simulated: the Super Agent only
                reports as online once its provider actually responds.
              </p>
              <Field label="Your name">
                <TextInput
                  value={settings.operator.name}
                  onChange={(e) => updateSettings({ operator: { ...settings.operator, name: e.target.value } })}
                  placeholder="Alex Moore"
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Business name">
                <TextInput
                  value={settings.business.name}
                  onChange={(e) => updateSettings({ business: { ...settings.business, name: e.target.value } })}
                />
              </Field>
              <Field label="Industry">
                <SelectInput
                  value={settings.business.industry}
                  onChange={(e) => updateSettings({ business: { ...settings.business, industry: e.target.value } })}
                >
                  <option value="">Select…</option>
                  {["Hospitality", "SaaS", "Finance", "Retail", "Healthcare", "Logistics", "Other"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Company size">
                <SelectInput
                  value={settings.business.size}
                  onChange={(e) => updateSettings({ business: { ...settings.business, size: e.target.value } })}
                >
                  <option value="">Select…</option>
                  {["1-10", "11-50", "51-200", "201-1000", "1000+"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Website">
                <TextInput
                  value={settings.business.website}
                  onChange={(e) => updateSettings({ business: { ...settings.business, website: e.target.value } })}
                />
              </Field>
              <Field label="Company email">
                <TextInput
                  type="email"
                  value={settings.business.email}
                  onChange={(e) => updateSettings({ business: { ...settings.business, email: e.target.value } })}
                  placeholder="hello@company.com"
                />
              </Field>
              <Field label="Company phone">
                <TextInput
                  type="tel"
                  value={settings.business.phone}
                  onChange={(e) => updateSettings({ business: { ...settings.business, phone: e.target.value } })}
                  placeholder="+44 20 7946 0000"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="What should Hermes operate?">
                  <TextArea
                    rows={3}
                    value={settings.business.description}
                    onChange={(e) =>
                      updateSettings({ business: { ...settings.business, description: e.target.value } })
                    }
                  />
                </Field>
                <p className="mt-2 text-[11px] leading-relaxed text-white/60">
                  Only the essentials here. Address, tax ID, timezone and contact details can be completed any time in
                  Settings → Company Profile.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-white/80">
                Choose how your agents run. An OpenRouter API key is required only if you pick OpenRouter — Ollama
                users can continue without one.
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setProvider("ollama")}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    provider === "ollama" ? "border-cyan/45 bg-cyan/[0.07]" : "border-cyan/12 hover:border-cyan/30",
                  )}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <HardDrive size={15} className="text-cyan" />
                    <span className="font-display tracking-[0.14em] text-white">OLLAMA LOCAL</span>
                    <span className="ml-auto rounded-full border border-ok/40 bg-ok/10 px-2 py-0.5 text-[9px] tracking-wider text-ok">
                      FREE · PRIVATE
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-white/75">
                    Runs on your hardware. No API key, no per-token cost, nothing leaves the machine.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider("openrouter")}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    provider === "openrouter" ? "border-cyan/45 bg-cyan/[0.07]" : "border-cyan/12 hover:border-cyan/30",
                  )}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <Cloud size={15} className="text-cyan" />
                    <span className="font-display tracking-[0.14em] text-white">OPENROUTER</span>
                    <span className="ml-auto rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-[9px] tracking-wider text-cyan">
                      FREE + PAID
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-white/75">
                    Hundreds of hosted models, including free tiers. Needs an API key.
                  </p>
                </button>
              </div>

              {provider === "ollama" ? (
                <div className="space-y-3 rounded-xl border border-cyan/10 bg-[#071018] p-4">
                  <Field label="Ollama base URL">
                    <TextInput
                      value={settings.ollamaUrl}
                      onChange={(e) => updateSettings({ ollamaUrl: e.target.value })}
                      placeholder="http://localhost:11434"
                    />
                  </Field>
                  <div className="flex flex-wrap items-center gap-3">
                    <PrimaryButton onClick={() => void probeLocal()} disabled={busy}>
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Detect local models
                    </PrimaryButton>
                    <a
                      href="https://ollama.com/download"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted hover:text-cyan"
                    >
                      Install Ollama <ExternalLink size={12} />
                    </a>
                  </div>
                  {ollama.state === "connected" && (
                    <div className="flex items-center gap-2 rounded-lg border border-ok/30 bg-ok/10 px-3 py-2 text-sm text-ok">
                      <span className="h-2 w-2 animate-live rounded-full bg-ok" />
                      {ollama.detail} detected.
                    </div>
                  )}
                  {ollama.state === "error" && (
                    <div className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-[12px] leading-relaxed text-warn">
                      {ollama.detail}. Start it with{" "}
                      <code className="rounded bg-black/40 px-1 font-mono text-[11px]">OLLAMA_ORIGINS=* ollama serve</code>{" "}
                      and pull a model, e.g.{" "}
                      <code className="rounded bg-black/40 px-1 font-mono text-[11px]">ollama pull llama3.1:8b</code>.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-cyan/10 bg-[#071018] p-4">
                  <Field label="API key">
                    <TextInput
                      type="password"
                      value={keyDraft}
                      onChange={(e) => setKeyDraft(e.target.value)}
                      placeholder="sk-or-v1-…"
                      className="font-mono"
                    />
                  </Field>
                  <div className="flex flex-wrap items-center gap-3">
                    <PrimaryButton onClick={() => void test()} disabled={busy || !keyDraft.trim()}>
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Verify key
                    </PrimaryButton>
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted hover:text-cyan"
                    >
                      Create a key <ExternalLink size={12} />
                    </a>
                  </div>
                  {openrouter.state === "connected" && (
                    <div className="flex items-center gap-2 rounded-lg border border-ok/30 bg-ok/10 px-3 py-2 text-sm text-ok">
                      <span className="h-2 w-2 animate-live rounded-full bg-ok" />
                      Connected — {keyInfo?.label}. Live catalogue loaded.
                    </div>
                  )}
                  {openrouter.state === "error" && (
                    <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                      {openrouter.detail}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-3 text-sm text-muted">
                Choose the model your Super Agent runs on. Free models cost nothing; paid pricing is shown per million
                tokens.
              </p>
              <ModelPicker
                value={settings.defaultModel}
                onChange={(id) =>
                  updateSettings({
                    defaultModel: id,
                    routerModels: settings.routerModels.includes(id)
                      ? settings.routerModels
                      : [...settings.routerModels, id].slice(-6),
                  })
                }
                height={320}
              />
            </div>
          )}

          {step === 4 && (
            <div>
              <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-cyan/25 px-4 py-10 text-muted hover:border-cyan/50 hover:text-white">
                <Upload size={18} />
                Upload playbooks, policies and brand docs
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void addDocs(Array.from(e.target.files ?? []));
                    e.target.value = "";
                  }}
                />
              </label>
              <div className="mt-4 space-y-2">
                {docs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-cyan/10 px-3 py-2 text-sm">
                    <FileText size={14} className="text-cyan" />
                    <span className="min-w-0 flex-1 truncate text-white">{doc.name}</span>
                    <span className="text-muted">{bytes(doc.bytes)}</span>
                  </div>
                ))}
                {docs.length === 0 && <p className="text-xs text-muted">Optional — you can add these later.</p>}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-white/80">
                Optional. Save the Telegram bot handle operators will use on mobile — the mobile dashboard deep-links
                to it. Saving the handle does not connect the account; the Hermes backend verifies the bot token when
                it is available.
              </p>
              <Field label="Bot handle">
                <TextInput
                  value={settings.telegramHandle}
                  onChange={(e) => updateSettings({ telegramHandle: e.target.value })}
                  placeholder="@your_bot"
                />
              </Field>
              <GhostButton
                disabled={!settings.telegramHandle.trim()}
                onClick={() => updateSettings({ telegramConfigured: Boolean(settings.telegramHandle.trim()) })}
              >
                Save handle
              </GhostButton>
              {settings.telegramConfigured && (
                <div className="inline-flex items-center gap-2 text-sm text-cyan">
                  <Check size={14} /> Handle saved — not verified yet
                </div>
              )}
              <div className="rounded-lg border border-cyan/10 bg-[#071018] p-3 text-sm">
                <div className="mb-1 text-[10px] tracking-[0.16em] text-white/70">READY TO LAUNCH</div>
                <ul className="space-y-1 text-white/85">
                  <li>Business: {settings.business.name || "not set"}</li>
                  <li>
                    Provider: {provider === "ollama" ? "Ollama Local" : "OpenRouter"} —{" "}
                    <span className={providerReady ? "text-ok" : "text-warn"}>
                      {providerReady ? "connected" : "not connected"}
                    </span>
                  </li>
                  <li>Model: {model ? model.name : "not selected"}</li>
                  <li>Documents: {docs.length}</li>
                  <li>
                    Telegram:{" "}
                    {settings.telegramVerified
                      ? "connected"
                      : settings.telegramConfigured
                        ? `${settings.telegramHandle} — configured, not verified`
                        : "not configured"}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-cyan/10 px-4 py-4 sm:px-6">
          <GhostButton disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Back
          </GhostButton>
          {blockedReason && (
            <span className="order-last w-full text-[11px] leading-relaxed text-warn sm:order-none sm:w-auto sm:flex-1 sm:text-center">
              {blockedReason}
            </span>
          )}
          {step < STEPS.length - 1 ? (
            <PrimaryButton disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Continue
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={finish}>Launch Agent OS</PrimaryButton>
          )}
        </footer>
      </div>
    </div>
  );
}
