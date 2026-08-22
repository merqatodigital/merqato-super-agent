import { AlertTriangle, Paperclip, Send, Square, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AttachBar, AttachmentList } from "./AttachBar";
import { AgentAvatar } from "../icons/AgentMark";
import { GhostButton, StatusDot } from "../ui/Primitives";
import { useApp } from "../../store/AppContext";
import { money, seconds } from "../../utils/format";
import { cn } from "../../utils/cn";

export function Console({ agentId }: { agentId: string }) {
  const {
    agents,
    messages,
    sendMessage,
    stopStream,
    streamingAgentId,
    clearConversation,
    modelForAgent,
    modelById,
    settings,
    openrouter,
    setPage,
    hermesReady,
    readyDetail,
  } = useApp();

  const agent = agents.find((a) => a.id === agentId);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const thread = useMemo(() => messages.filter((m) => m.agentId === agentId), [messages, agentId]);
  const streaming = streamingAgentId === agentId;
  const modelId = agent ? modelForAgent(agent) : "";
  const model = modelById(modelId);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [thread.length, thread[thread.length - 1]?.content]);

  if (!agent) return null;

  const blocked = !modelId || (model?.source !== "ollama" && !settings.apiKey);

  const submit = () => {
    const value = text.trim();
    if ((!value && files.length === 0) || streaming) return;
    const payload = files;
    setText("");
    setFiles([]);
    void sendMessage(agentId, value, payload.length ? { files: payload } : undefined);
  };

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  return (
    <div
      className={cn("panel relative flex h-full min-h-0 flex-col", dragging && "border-cyan/50")}
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragging) setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        addFiles(e.dataTransfer.files);
      }}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cyan/50 bg-[#04070c]/85">
          <Upload size={22} className="text-cyan" />
          <p className="text-sm text-white">Drop files to share with {agent.name}</p>
          <p className="text-[11px] text-white/60">Any file type · text is indexed into Knowledge</p>
        </div>
      )}
      <header className="flex items-center gap-3 border-b border-cyan/10 px-3 py-3 sm:px-4">
        <AgentAvatar icon={agent.icon} size={34} active={agent.enabled} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="font-display text-lg tracking-[0.14em] text-white">{agent.name}</span>
            <StatusDot
              tone={streaming ? "cyan" : !agent.enabled ? "off" : hermesReady ? "ok" : "warn"}
              pulse={streaming}
            />
            <span className="text-[10px] tracking-[0.16em] text-white/70">
              {streaming
                ? "GENERATING"
                : !agent.enabled
                  ? "DISABLED"
                  : hermesReady
                    ? "READY"
                    : readyDetail.toUpperCase()}
            </span>
          </div>
          <div className="truncate text-[11px] text-muted">{model ? model.name : "No model selected"}</div>
        </div>
        {thread.length > 0 && (
          <GhostButton
            onClick={() => clearConversation(agentId)}
            aria-label="Clear conversation"
            className="shrink-0 px-2 sm:px-3"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Clear</span>
          </GhostButton>
        )}
      </header>

      <div ref={scroller} className="scroll-thin min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
        {thread.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <AgentAvatar icon={agent.icon} size={52} active />
            <p className="mt-2 text-sm text-white">Talk to {agent.name}</p>
            <p className="max-w-sm text-xs leading-relaxed text-muted">
              Messages run against your selected model. Business context, standing memory and any documents you
              flagged are sent with every request.
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-white/55">
              <Paperclip size={11} /> Attach or drop files of any type to work on them together
            </p>
          </div>
        )}

        {thread.map((m) => (
          <div key={m.id} className={cn("flex gap-3", m.role === "user" && "justify-end")}>
            {m.role === "assistant" && <AgentAvatar icon={agent.icon} size={28} active />}
            <div
              className={cn(
                "max-w-[88%] rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[78%]",
                m.role === "user"
                  ? "border-cyan/25 bg-cyan/10 text-white"
                  : m.error
                    ? "border-danger/30 bg-danger/10 text-danger"
                    : "border-cyan/10 bg-[#071018] text-white/90",
              )}
            >
              {m.error && (
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium">
                  <AlertTriangle size={12} /> Request failed
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">
                {m.content || (m.pending ? "" : "")}
                {m.pending && <Caret />}
              </div>
              {m.attachments?.length ? <AttachmentList items={m.attachments} /> : null}
              {!m.pending && m.role === "assistant" && !m.error && (m.tokens || m.latencyMs) && (
                <div className="mt-2 flex flex-wrap gap-3 border-t border-cyan/10 pt-1.5 text-[10px] text-muted">
                  {m.tokens ? <span>{m.tokens} tokens</span> : null}
                  {m.latencyMs ? <span>{seconds(m.latencyMs)}</span> : null}
                  {m.cost ? <span>{money(m.cost, 4)}</span> : null}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {blocked && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-[11px] text-warn">
          <AlertTriangle size={13} />
          {!settings.apiKey && model?.source !== "ollama"
            ? "Add your OpenRouter API key to start running missions."
            : "Select a model to start."}
          <button type="button" onClick={() => setPage("settings")} className="ml-auto underline">
            Open settings
          </button>
        </div>
      )}

      {openrouter.state === "error" && (
        <div className="mx-4 mb-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[11px] text-danger">
          OpenRouter: {openrouter.detail}
        </div>
      )}

      <div className="border-t border-cyan/10 p-3">
        <AttachBar files={files} onRemove={(i) => setFiles((prev) => prev.filter((_, x) => x !== i))} />
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title="Attach files — any type"
            aria-label="Attach files"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-cyan/20 text-white/75 transition hover:border-cyan/45 hover:text-cyan"
          >
            <Paperclip size={15} />
          </button>
          <textarea
            value={text}
            rows={1}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            onPaste={(e) => {
              const pasted = Array.from(e.clipboardData.files ?? []);
              if (pasted.length) {
                e.preventDefault();
                setFiles((prev) => [...prev, ...pasted]);
              }
            }}
            placeholder={files.length ? "Add a note (optional)…" : `Message ${agent.name}…`}
            className="scroll-thin max-h-32 min-h-[42px] min-w-0 flex-1 resize-none rounded-lg border border-cyan/15 bg-[#071018] px-3 py-2.5 text-sm outline-none placeholder:text-dim focus:border-cyan/40"
          />
          {streaming ? (
            <button
              type="button"
              onClick={stopStream}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-danger/40 text-danger hover:bg-danger/10"
              aria-label="Stop generating"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={(!text.trim() && files.length === 0) || blocked}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-cyan text-[#042226] transition hover:bg-cyan-bright disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Caret() {
  return <span className="ml-0.5 inline-block h-3.5 w-[7px] translate-y-[1px] animate-pulse bg-cyan" />;
}
