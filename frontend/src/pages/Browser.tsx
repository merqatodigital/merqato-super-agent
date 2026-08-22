import { Globe, Plug, ShieldAlert } from "lucide-react";
import { GhostButton } from "../components/ui/Primitives";
import { useApp } from "../store/AppContext";

export function Browser() {
  const { setPage } = useApp();

  return (
    <div className="scroll-thin h-full overflow-y-auto pr-1">
      <div className="mb-5">
        <div className="text-[11px] tracking-[0.28em] text-cyan">REMOTE SURFACE</div>
        <h1 className="font-display text-4xl tracking-[0.08em] text-white">BROWSER</h1>
      </div>

      <section className="panel flex flex-col items-start gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan/20 text-cyan">
          <Globe size={20} />
        </div>
        <div>
          <h2 className="text-lg text-white">Browser automation requires the Hermes backend</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Driving a real browser — navigation, DOM extraction, form submission and screenshots — cannot run from a
            browser tab. This panel stays intentionally empty rather than showing simulated sessions.
          </p>
        </div>

        <div className="grid w-full gap-2 sm:grid-cols-2">
          <Step
            icon={Plug}
            title="Expose the endpoint"
            body="Add POST /browser/sessions and GET /browser/sessions/{id} to your FastAPI service."
          />
          <Step
            icon={ShieldAlert}
            title="Gate risky steps"
            body="Route credential entry and purchases through Approvals before execution."
          />
        </div>

        <div className="flex gap-2">
          <GhostButton onClick={() => setPage("settings")}>Open settings</GhostButton>
          <GhostButton onClick={() => setPage("super-agent")}>Back to Super Agent</GhostButton>
        </div>

        <p className="text-[11px] text-dim">
          Wire it up in <code className="rounded bg-black/40 px-1 py-0.5 font-mono">src/services/api.ts</code> — the
          rest of the UI already reads from that single service.
        </p>
      </section>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Globe;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-cyan/10 bg-[#071018] p-4">
      <div className="mb-2 flex items-center gap-2 text-cyan">
        <Icon size={14} />
        <span className="text-[11px] tracking-[0.16em]">{title.toUpperCase()}</span>
      </div>
      <p className="text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
