import { FileText, X } from "lucide-react";
import { bytes } from "../../utils/format";

/** Pending files shown above a composer before the turn is sent. */
export function AttachBar({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (index: number) => void;
}) {
  if (files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-1 pb-2">
      {files.map((file, i) => (
        <span
          key={`${file.name}-${i}`}
          className="flex max-w-full items-center gap-1.5 rounded-lg border border-cyan/20 bg-cyan/[0.07] py-1 pl-2 pr-1 text-[11px] text-white/90"
        >
          <FileText size={11} className="shrink-0 text-cyan" />
          <span className="max-w-[150px] truncate sm:max-w-[220px]">{file.name}</span>
          <span className="shrink-0 text-[10px] text-white/50">{bytes(file.size)}</span>
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label={`Remove ${file.name}`}
            className="shrink-0 rounded p-0.5 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X size={11} />
          </button>
        </span>
      ))}
    </div>
  );
}

/** Attachments recorded on a sent message. */
export function AttachmentList({
  items,
}: {
  items: { id: string; name: string; bytes: number; readable: boolean }[];
}) {
  if (!items.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((a) => (
        <span
          key={a.id}
          title={a.readable ? "Text extracted and added to Knowledge" : "Stored — needs backend parsing"}
          className="flex max-w-full items-center gap-1.5 rounded-md border border-white/15 bg-black/25 px-1.5 py-0.5 text-[10px] text-white/80"
        >
          <FileText size={10} className={a.readable ? "shrink-0 text-cyan" : "shrink-0 text-warn"} />
          <span className="max-w-[150px] truncate">{a.name}</span>
          <span className="shrink-0 text-white/45">{bytes(a.bytes)}</span>
        </span>
      ))}
    </div>
  );
}
