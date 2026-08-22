import { FileText, Search, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { PrimaryButton, TextInput, Toggle } from "../components/ui/Primitives";
import { useApp } from "../store/AppContext";
import { bytes, compact, relTime } from "../utils/format";
import { backendConfigured, searchKnowledge } from "../services/backend";

interface SearchResult {
  document_id: string;
  title: string;
  snippet: string;
  rank: number;
}

export function Knowledge() {
  const { docs, addDocs, removeDoc, toggleDoc, settings, pushToast } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const included = docs.filter((d) => d.includeInContext).length;
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const doSearch = async () => {
    if (!searchQuery.trim() || !settings.clientId) return;
    setSearching(true);
    try {
      const results = await searchKnowledge(settings.clientId, searchQuery.trim());
      setSearchResults(results);
    } catch {
      pushToast({ title: "Search failed", detail: "Could not reach backend", tone: "warn" });
    }
    setSearching(false);
  };

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    void addDocs(Array.from(list));
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.28em] text-cyan">CONTEXT</div>
          <h1 className="font-display text-4xl tracking-[0.08em] text-white">KNOWLEDGE</h1>
          <p className="mt-2 text-sm text-muted">
            {docs.length === 0
              ? "Upload text documents to give your agents real context."
              : `${included} of ${docs.length} documents are attached to every request.`}
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <PrimaryButton onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> Upload documents
          </PrimaryButton>
        </div>
      </div>

      <div
        className="mb-3 rounded-xl border border-dashed border-cyan/20 px-4 py-6 text-center text-sm text-muted"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
      >
        Drop any file type here. Text formats (txt, md, csv, json, yaml, code and more) are read in the browser and
        injected into the system prompt, so every upload teaches your agents. Binary files such as PDF, DOCX and
        images are stored and wait for backend parsing.
      </div>

      {backendConfigured && settings.clientId && (
        <div className="mb-3 flex gap-2">
          <TextInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void doSearch()}
            placeholder="Search indexed documents…"
            className="flex-1"
          />
          <PrimaryButton onClick={() => void doSearch()} disabled={searching || !searchQuery.trim()}>
            <Search size={14} /> {searching ? "Searching…" : "Search"}
          </PrimaryButton>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="mb-3 rounded-xl border border-cyan/15 bg-[#071018] p-3">
          <div className="mb-2 text-[10px] tracking-[0.16em] text-cyan">SEARCH RESULTS</div>
          {searchResults.map((r) => (
            <div key={r.document_id} className="mb-2 rounded-lg border border-cyan/10 px-3 py-2 last:mb-0">
              <div className="truncate text-sm text-white">{r.title}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-white/70">{r.snippet}</div>
            </div>
          ))}
        </div>
      )}

      <div className="panel scroll-thin min-h-0 flex-1 overflow-auto">
        {docs.length === 0 ? (
          <div className="flex h-full items-center justify-center p-10 text-sm text-muted">No documents yet.</div>
        ) : (
          docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 border-b border-cyan/10 px-4 py-3 last:border-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan/15 text-cyan">
                <FileText size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-white">{doc.name}</div>
              <div className="text-[11px] text-muted">
                {doc.type} · {bytes(doc.bytes)} ·{" "}
                {doc.chars ? `${compact(doc.chars)} chars indexed` : "no text extracted"} · {relTime(doc.addedAt)}
                {doc.source && doc.source !== "upload" ? ` · attached in ${doc.source.toUpperCase()} chat` : ""}
              </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden text-[10px] tracking-wider text-muted sm:block">IN CONTEXT</span>
                <Toggle
                  checked={doc.includeInContext}
                  onChange={() => toggleDoc(doc.id)}
                  label={`Include ${doc.name}`}
                />
                <button
                  type="button"
                  onClick={() => removeDoc(doc.id)}
                  className="text-dim hover:text-danger"
                  aria-label="Remove document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
