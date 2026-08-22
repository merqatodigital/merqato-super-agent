import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PrimaryButton, SelectInput, TextArea } from "../components/ui/Primitives";
import { useApp } from "../store/AppContext";
import { relTime } from "../utils/format";

export function Memory() {
  const { memory, agents, addMemory, removeMemory } = useApp();
  const [text, setText] = useState("");
  const [target, setTarget] = useState("all");

  return (
    <div className="scroll-thin h-full overflow-y-auto pr-1">
      <div className="mb-5">
        <div className="text-[11px] tracking-[0.28em] text-cyan">STANDING CONTEXT</div>
        <h1 className="font-display text-4xl tracking-[0.08em] text-white">MEMORY</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Facts, preferences and rules written here are prepended to every request for the selected agent.
        </p>
      </div>

      <section className="panel mb-3 space-y-3 p-4">
        <TextArea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Always reply in British English and keep summaries under 120 words."
        />
        <div className="flex flex-wrap items-center gap-2">
          <SelectInput value={target} onChange={(e) => setTarget(e.target.value)} className="w-48">
            <option value="all">All agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </SelectInput>
          <PrimaryButton
            disabled={!text.trim()}
            onClick={() => {
              addMemory(text, target);
              setText("");
            }}
          >
            <Plus size={14} /> Remember
          </PrimaryButton>
        </div>
      </section>

      {memory.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-muted">No memory entries yet.</div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {memory.map((entry) => {
            const agent = agents.find((a) => a.id === entry.agentId);
            return (
              <article key={entry.id} className="panel flex gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-cyan">
                    {agent ? agent.name : "ALL AGENTS"}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-white/85">{entry.content}</p>
                  <div className="mt-2 text-[11px] text-muted">Added {relTime(entry.createdAt)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeMemory(entry.id)}
                  className="h-fit text-dim hover:text-danger"
                  aria-label="Delete memory"
                >
                  <Trash2 size={14} />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
