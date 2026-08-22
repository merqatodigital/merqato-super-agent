import { ClipboardList } from "lucide-react";
import { AgentAvatar } from "../icons/AgentMark";
import { useApp } from "../../store/AppContext";
import { relTime } from "../../utils/format";
import { cn } from "../../utils/cn";

export function ActivityFeed() {
  const { activity, agents, setPage } = useApp();
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  return (
    <section className="panel flex w-full flex-col p-3.5 lg:w-[320px] lg:shrink-0">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <ClipboardList size={14} className="text-cyan" />
          <span className="font-display text-[15px] tracking-[0.18em] text-white">ACTIVITY</span>
        </div>
        {activity.length > 0 && (
          <button type="button" onClick={() => setPage("tasks")} className="text-[10px] tracking-[0.16em] text-muted hover:text-cyan">
            VIEW ALL
          </button>
        )}
      </div>

      {activity.length === 0 ? (
        <p className="px-1 py-4 text-xs leading-relaxed text-muted">
          Agent events land here as soon as your first mission runs.
        </p>
      ) : (
        <div className="scroll-thin max-h-[220px] space-y-1 overflow-y-auto">
          {activity.slice(0, 12).map((item) => {
            const agent = agentMap[item.agentId];
            return (
              <div key={item.id} className="flex items-start gap-2.5 rounded-lg px-1 py-1.5">
                <AgentAvatar icon={agent?.icon ?? "bot"} size={26} active />
                <div className="min-w-0 flex-1 text-[12px] leading-snug">
                  <span className="font-medium tracking-wide text-white">{agent?.name ?? "SYSTEM"}</span>{" "}
                  <span
                    className={cn(
                      item.tone === "warn" ? "text-warn" : item.tone === "ok" ? "text-white/70" : "text-white/70",
                    )}
                  >
                    {item.message}
                  </span>
                </div>
                <div className="shrink-0 text-[10px] text-muted">{relTime(item.ts)}</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
