import { ShieldCheck } from "lucide-react";
import { AgentAvatar } from "../components/icons/AgentMark";
import { GhostButton, PrimaryButton } from "../components/ui/Primitives";
import { useApp } from "../store/AppContext";
import { relTime } from "../utils/format";

export function Approvals() {
  const { runs, agents, approveRun, rejectRun, openDrawer } = useApp();
  const pending = runs.filter((r) => r.status === "pending_approval");
  const resolved = runs.filter((r) => r.status === "rejected" || (r.requiresApproval && r.status === "completed"));
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  return (
    <div className="scroll-thin h-full overflow-y-auto pr-1">
      <div className="mb-5">
        <div className="text-[11px] tracking-[0.28em] text-cyan">HUMAN GATE</div>
        <h1 className="font-display text-4xl tracking-[0.08em] text-white">APPROVALS</h1>
      </div>

      <div className="space-y-3">
        {pending.length === 0 && (
          <div className="panel flex flex-col items-center gap-2 p-8 text-center">
            <ShieldCheck size={22} className="text-dim" />
            <p className="text-sm text-white">Nothing waiting</p>
            <p className="max-w-md text-xs leading-relaxed text-muted">
              Toggle “Approval” in the mission composer to hold a mission here. Nothing is sent to the model until
              you approve it.
            </p>
          </div>
        )}
        {pending.map((run) => {
          const agent = agentMap[run.agentId];
          return (
            <article key={run.id} className="panel p-4">
              <div className="flex flex-wrap items-start gap-3">
                {agent && <AgentAvatar icon={agent.icon} size={36} active />}
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    className="text-left text-sm text-white hover:text-cyan"
                    onClick={() => openDrawer("run", { runId: run.id })}
                  >
                    {run.title}
                  </button>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{run.prompt}</p>
                  <div className="mt-2 text-[11px] text-dim">
                    {agent?.name} · {run.model} · {relTime(run.createdAt)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <GhostButton onClick={() => rejectRun(run.id)}>Reject</GhostButton>
                  <PrimaryButton onClick={() => void approveRun(run.id)}>Approve &amp; run</PrimaryButton>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {resolved.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 font-display text-lg tracking-[0.16em] text-white">RESOLVED</h2>
          <div className="space-y-2">
            {resolved.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => openDrawer("run", { runId: run.id })}
                className="flex w-full items-center justify-between rounded-xl border border-cyan/10 px-4 py-3 text-left text-sm hover:border-cyan/30"
              >
                <span className="min-w-0 truncate text-white/80">{run.title}</span>
                <span className={run.status === "rejected" ? "text-muted" : "text-ok"}>
                  {run.status === "rejected" ? "Rejected" : "Approved"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
