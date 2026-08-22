import { Lock, Plus } from "lucide-react";
import { LockedBotCard } from "../components/billing/UpgradeModal";
import { useState } from "react";
import { AgentCard } from "../components/dashboard/AgentCard";
import { Console } from "../components/chat/Console";
import { AgentAvatar } from "../components/icons/AgentMark";
import { GhostButton, PrimaryButton, Toggle } from "../components/ui/Primitives";
import { useApp } from "../store/AppContext";
import { cn } from "../utils/cn";

export function Bots() {
  const { agents, openDrawer, setPage, updateAgent, canAddBot, setUpgradeOpen, settings, botAllowance, specialistCount } =
    useApp();
  const addBot = () => (canAddBot ? openDrawer("bot-create") : setUpgradeOpen(true));
  const superAgent = agents.find((a) => a.kind === "super-agent");
  const bots = agents.filter((a) => a.kind === "specialist");
  const [chatWith, setChatWith] = useState<string | null>(null);
  const active = bots.find((b) => b.id === chatWith);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.28em] text-cyan">FLEET</div>
          <h1 className="font-display text-4xl tracking-[0.08em] text-white">BOTS</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            One Super Agent is always primary. Specialist bots are a Pro feature, each with its own model and prompt.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] tracking-[0.16em]",
              settings.plan === "pro" ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-white/20 bg-white/5 text-muted",
            )}
          >
            {settings.plan === "pro" ? `PRO · ${specialistCount}/${botAllowance} BOTS` : "STARTER PLAN"}
          </span>
          <PrimaryButton onClick={addBot}>
            {canAddBot ? <Plus size={14} /> : <Lock size={14} />}
            {canAddBot ? "Add specialist" : "Unlock specialists"}
          </PrimaryButton>
        </div>
      </div>

      {superAgent && (
        <section className="panel mb-3 flex flex-wrap items-center gap-4 p-4">
          <AgentAvatar icon={superAgent.icon} size={48} active={superAgent.enabled} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl tracking-[0.14em] text-white">{superAgent.name}</h2>
              <span className="rounded-full border border-cyan/25 px-2 py-0.5 text-[10px] tracking-[0.14em] text-cyan">
                SUPER AGENT
              </span>
            </div>
            <p className="line-clamp-1 text-sm text-muted">{superAgent.systemPrompt.split("\n")[0]}</p>
          </div>
          <GhostButton onClick={() => setPage("super-agent")}>Open console</GhostButton>
        </section>
      )}

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pr-1">
        {active ? (
          <div className="flex h-full min-h-[420px] flex-col gap-2">
            <button
              type="button"
              onClick={() => setChatWith(null)}
              className="self-start text-xs text-muted hover:text-cyan"
            >
              ← Back to fleet
            </button>
            <div className="min-h-0 flex-1">
              <Console agentId={active.id} />
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {bots.map((bot) => (
              <div key={bot.id} className={cn("relative")}>
                <AgentCard agent={bot} onClick={() => setChatWith(bot.id)} />
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openDrawer("agent", { agentId: bot.id })}
                    className="text-[10px] tracking-wider text-muted hover:text-cyan"
                  >
                    EDIT
                  </button>
                  <Toggle checked={bot.enabled} onChange={(v) => updateAgent(bot.id, { enabled: v })} />
                </div>
              </div>
            ))}
            {canAddBot ? (
              <button
                type="button"
                onClick={addBot}
                className="flex min-h-[210px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-cyan/20 text-muted transition hover:border-cyan/40 hover:text-white"
              >
                <Plus size={18} />
                <span className="text-sm">Add specialist bot</span>
              </button>
            ) : (
              <LockedBotCard onClick={() => setUpgradeOpen(true)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
