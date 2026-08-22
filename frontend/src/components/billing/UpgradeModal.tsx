import { Bot, Check, Cpu, Lock, Sparkles } from "lucide-react";
import { GhostButton, Modal, PrimaryButton } from "../ui/Primitives";
import { useApp } from "../../store/AppContext";
import { PLAN_LIMITS } from "../../types";
import { cn } from "../../utils/cn";

const STARTER = ["1 Super Agent (HERMES)", "Full model catalog, free and paid", "Knowledge, memory and approvals", "Telegram hand-off"];
const PRO = [
  `Up to ${PLAN_LIMITS.pro.specialistBots} specialist bots`,
  "Per-bot model routing and prompts",
  "Delegation from the Super Agent",
  "Everything in Starter",
];

export function UpgradeModal() {
  const { upgradeOpen, setUpgradeOpen, upgradePlan, settings } = useApp();

  return (
    <Modal open={upgradeOpen} title="SPECIALIST BOTS" onClose={() => setUpgradeOpen(false)} wide>
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Your Super Agent is included on every plan. Specialist bots — separate agents with their own model, prompt and
        workload — are part of Pro.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <PlanCard
          icon={Cpu}
          name="Starter"
          price="Included"
          current={settings.plan === "free"}
          features={STARTER}
        />
        <PlanCard
          icon={Bot}
          name="Pro"
          price="Specialist fleet"
          highlight
          current={settings.plan === "pro"}
          features={PRO}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PrimaryButton onClick={upgradePlan} disabled={settings.plan === "pro"}>
          <Sparkles size={14} />
          {settings.plan === "pro" ? "Pro is active" : "Unlock Pro"}
        </PrimaryButton>
        <GhostButton onClick={() => setUpgradeOpen(false)}>Stay on Starter</GhostButton>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-dim">
        Billing is not wired up in this frontend. “Unlock Pro” flips the local entitlement so the flow can be
        demonstrated — replace it with your checkout and have the backend return the real plan.
      </p>
    </Modal>
  );
}

function PlanCard({
  icon: Icon,
  name,
  price,
  features,
  highlight,
  current,
}: {
  icon: typeof Bot;
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
  current?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        highlight ? "border-cyan/40 bg-cyan/[0.06]" : "border-cyan/12 bg-[#071018]",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon size={15} className="text-cyan" />
        <span className="font-display text-lg tracking-[0.14em] text-white">{name}</span>
        {current && (
          <span className="ml-auto rounded-full border border-ok/40 bg-ok/10 px-2 py-0.5 text-[10px] tracking-wider text-ok">
            CURRENT
          </span>
        )}
      </div>
      <div className="mb-3 text-sm text-white/90">{price}</div>
      <ul className="space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[12px] leading-snug text-white/80">
            <Check size={12} className="mt-0.5 shrink-0 text-cyan" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LockedBotCard({ onClick }: { onClick: () => void }) {
  const { specialistCount, botAllowance, settings } = useApp();
  const atLimit = settings.plan === "pro" && specialistCount >= botAllowance;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[210px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-cyan/25 px-4 text-center transition hover:border-cyan/45"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan/25 text-cyan">
        <Lock size={16} />
      </div>
      <span className="text-sm text-white">{atLimit ? "Bot limit reached" : "Specialist bots — Pro"}</span>
      <span className="max-w-[220px] text-xs leading-relaxed text-muted">
        {atLimit
          ? `You are using all ${botAllowance} bots on your plan.`
          : "Add dedicated agents with their own model and prompt."}
      </span>
      {!atLimit && (
        <span className="mt-1 rounded-full bg-cyan px-3 py-1 text-[11px] font-medium text-[#042226]">Unlock Pro</span>
      )}
    </button>
  );
}
