import { useState } from "react";
import { Check, Loader2, Plug, Server } from "lucide-react";
import { GhostButton, PrimaryButton } from "../ui/Primitives";
import { backend, toClientPayload, type ClientRecord } from "../../services/backend";
import { useApp } from "../../store/AppContext";
import { cn } from "../../utils/cn";

type Probe = { state: "idle" | "busy" | "ok" | "error"; detail: string };

const idle: Probe = { state: "idle", detail: "" };

export function BackendPanel() {
  const { settings, pushToast } = useApp();
  const [health, setHealth] = useState<Probe>(idle);
  const [client, setClient] = useState<Probe>(idle);
  const [record, setRecord] = useState<ClientRecord | null>(null);

  const checkHealth = async () => {
    setHealth({ state: "busy", detail: "" });
    try {
      const res = await backend.health();
      setHealth({ state: "ok", detail: res.status ? String(res.status) : "healthy" });
    } catch (err) {
      setHealth({ state: "error", detail: err instanceof Error ? err.message : "Unreachable" });
    }
  };

  const registerClient = async () => {
    setClient({ state: "busy", detail: "" });
    try {
      const created = await backend.createClient(
        toClientPayload({
          business: settings.business,
          operator: settings.operator,
          telegramHandle: settings.telegramHandle,
        }),
      );
      setRecord(created);
      setClient({ state: "ok", detail: `Client #${created.id}` });
      pushToast({ title: "Client created", detail: `ID ${created.id}`, tone: "ok" });
    } catch (err) {
      setClient({ state: "error", detail: err instanceof Error ? err.message : "Request failed" });
    }
  };

  const reloadClient = async () => {
    if (!record) return;
    setClient({ state: "busy", detail: "" });
    try {
      const fetched = await backend.getClient(record.id);
      setRecord(fetched);
      setClient({ state: "ok", detail: `Reloaded #${fetched.id}` });
    } catch (err) {
      setClient({ state: "error", detail: err instanceof Error ? err.message : "Request failed" });
    }
  };

  return (
    <section className="panel space-y-4 p-5 xl:col-span-2">
      <div className="flex flex-wrap items-center gap-3">
        <Server size={16} className="text-cyan" />
        <h2 className="font-display text-lg tracking-[0.16em] text-white">MERQATO BACKEND</h2>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] tracking-[0.16em]",
            backend.configured
              ? "border-cyan/30 bg-cyan/10 text-cyan"
              : "border-white/20 bg-white/5 text-white/70",
          )}
        >
          {backend.configured ? "CONFIGURED" : "NOT CONFIGURED"}
        </span>
      </div>

      {!backend.configured ? (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-white/80">
            No backend is configured, so the app runs fully in the browser against OpenRouter and Ollama. That is the
            supported default — nothing is degraded.
          </p>
          <p className="text-[11px] leading-relaxed text-white/60">
            To attach the FastAPI service, set{" "}
            <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-[10px] text-cyan">VITE_API_BASE_URL</code>{" "}
            in a <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-[10px]">.env</code> file and rebuild,
            e.g.{" "}
            <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-[10px]">
              VITE_API_BASE_URL=http://localhost:8000
            </code>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-cyan/10 bg-[#071018] px-3 py-2 text-sm">
            <span className="text-white/70">Base URL: </span>
            <span className="font-mono text-[12px] text-cyan">{backend.baseUrl}</span>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <Route
              method="GET"
              path="/health"
              probe={health}
              action={
                <GhostButton onClick={() => void checkHealth()} disabled={health.state === "busy"}>
                  {health.state === "busy" ? <Loader2 size={13} className="animate-spin" /> : <Plug size={13} />}
                  Check
                </GhostButton>
              }
            />
            <Route
              method="POST"
              path="/api/clients"
              probe={client}
              action={
                <div className="flex gap-2">
                  <PrimaryButton
                    onClick={() => void registerClient()}
                    disabled={client.state === "busy" || !settings.business.name.trim()}
                  >
                    {client.state === "busy" ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Register
                  </PrimaryButton>
                  {record && (
                    <GhostButton onClick={() => void reloadClient()} disabled={client.state === "busy"}>
                      Reload
                    </GhostButton>
                  )}
                </div>
              }
            />
          </div>

          {record && (
            <div className="rounded-lg border border-cyan/10 bg-[#071018] p-3">
              <div className="mb-1 text-[10px] tracking-[0.16em] text-white/70">
                GET /api/clients/{String(record.id)}
              </div>
              <pre className="scroll-thin max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-white/85">
                {JSON.stringify(record, null, 2)}
              </pre>
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-white/60">
            Only the three routes the backend implements today are wired up. Inference still runs directly from the
            browser; no other endpoints are assumed to exist.
          </p>
        </>
      )}
    </section>
  );
}

function Route({
  method,
  path,
  probe,
  action,
}: {
  method: string;
  path: string;
  probe: Probe;
  action: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-cyan/10 bg-[#071018] p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded border border-cyan/25 px-1.5 py-0.5 font-mono text-[10px] text-cyan">{method}</span>
        <span className="font-mono text-[12px] text-white">{path}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {action}
        {probe.state !== "idle" && (
          <span
            className={cn(
              "text-[11px]",
              probe.state === "ok" ? "text-ok" : probe.state === "error" ? "text-danger" : "text-white/60",
            )}
          >
            {probe.state === "busy" ? "Calling…" : probe.detail}
          </span>
        )}
      </div>
    </div>
  );
}
