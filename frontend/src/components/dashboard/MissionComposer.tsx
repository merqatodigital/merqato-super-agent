import { ChevronDown, Paperclip, Send, ShieldCheck, Square, Terminal } from "lucide-react";
import { useRef, useState } from "react";
import { AttachBar } from "../chat/AttachBar";
import { useApp } from "../../store/AppContext";
import { cn } from "../../utils/cn";

export function MissionComposer() {
  const { agents, sendMessage, streamingAgentId, stopStream, settings, modelById, setPage } = useApp();
  const [value, setValue] = useState("");
  const [agentId, setAgentId] = useState("hermes");
  const [requireApproval, setRequireApproval] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const enabled = agents.filter((a) => a.enabled);
  const target = enabled.find((a) => a.id === agentId) ?? enabled[0];
  const model = modelById(target ? target.model || settings.defaultModel : "");
  const streaming = streamingAgentId !== null;
  const blocked = !settings.defaultModel && !target?.model;

  const submit = () => {
    const prompt = value.trim();
    if ((!prompt && files.length === 0) || streaming || !target) return;
    const payload = files;
    setValue("");
    setFiles([]);
    void sendMessage(target.id, prompt, { requireApproval, files: payload });
  };

  return (
    <div className="relative">
      {menuOpen && (
        <div className="absolute bottom-[60px] left-2 z-20 w-64 rounded-xl border border-cyan/15 bg-[#0b141e] p-2 shadow-xl">
          <div className="px-2 py-1 text-[10px] tracking-[0.16em] text-muted">DISPATCH TO</div>
          {enabled.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setAgentId(a.id);
                setMenuOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs",
                agentId === a.id ? "bg-cyan/10 text-cyan" : "text-white/80 hover:bg-white/5",
              )}
            >
              <span>{a.name}</span>
              <span className="text-[10px] text-muted">{a.role}</span>
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-cyan/15 bg-[#0a141e] p-1.5">
      <AttachBar files={files} onRemove={(i) => setFiles((prev) => prev.filter((_, x) => x !== i))} />
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="hidden h-9 w-9 items-center justify-center text-cyan sm:flex">
          <Terminal size={16} />
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Attach files — any type"
          aria-label="Attach files"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/5 hover:text-cyan"
        >
          <Paperclip size={15} />
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 max-w-[92px] shrink-0 items-center gap-1 truncate rounded-lg border border-cyan/12 px-2 text-[11px] text-white/85 hover:border-cyan/30 sm:max-w-none sm:px-2.5"
        >
          {target?.name ?? "NO AGENT"}
          <ChevronDown size={12} className="text-dim" />
        </button>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={blocked ? "Select a model in Settings to begin" : "Give your agents a mission"}
          className="h-9 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-dim"
        />
        <button
          type="button"
          onClick={() => setRequireApproval((v) => !v)}
          title="Hold this mission for approval"
          className={cn(
            "hidden h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] transition sm:flex",
            requireApproval
              ? "border-warn/40 bg-warn/10 text-warn"
              : "border-cyan/12 text-muted hover:border-cyan/30 hover:text-white",
          )}
        >
          <ShieldCheck size={13} />
          Approval
        </button>
        <span className="hidden max-w-[140px] truncate px-1 text-[10px] text-dim xl:block">
          {model ? model.name : "no model"}
        </span>
        {streaming ? (
          <button
            type="button"
            onClick={stopStream}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-danger/40 text-danger hover:bg-danger/10"
            aria-label="Stop"
          >
            <Square size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={blocked ? () => setPage("settings") : submit}
            disabled={!blocked && !value.trim() && files.length === 0}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan text-[#042226] transition hover:bg-cyan-bright disabled:opacity-40"
            aria-label="Send mission"
          >
            <Send size={15} />
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
