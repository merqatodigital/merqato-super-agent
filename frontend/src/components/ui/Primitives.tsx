import { X } from "lucide-react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "../../utils/cn";

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[18px] w-[34px] shrink-0 rounded-full transition-colors",
        checked ? "bg-cyan" : "bg-[#1b2c38]",
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow transition-all",
          checked ? "left-[18px]" : "left-[2px]",
        )}
      />
    </button>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-[4px] w-full overflow-hidden rounded-full bg-[#163042]", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-teal to-cyan"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, boxShadow: "0 0 8px rgba(46,230,214,0.55)" }}
      />
    </div>
  );
}

export function StatusDot({
  tone = "ok",
  pulse = false,
}: {
  tone?: "ok" | "warn" | "off" | "cyan";
  pulse?: boolean;
}) {
  const color =
    tone === "ok" ? "bg-ok" : tone === "warn" ? "bg-warn" : tone === "cyan" ? "bg-cyan" : "bg-dim";
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", color, pulse && "animate-live")} />;
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-cyan/20 bg-[#0a141e]/80 px-3.5 py-1.5 text-[11px] font-medium tracking-[0.14em] text-white/90">
      {children}
    </div>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-cyan/20 bg-white/[0.04] px-3 py-1.5 text-xs tracking-wide text-white/90 transition hover:border-cyan/45 hover:bg-white/[0.08] hover:text-white disabled:opacity-45",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-cyan px-4 py-2 text-sm font-medium text-[#042226] transition hover:bg-cyan-bright disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Drawer({
  open,
  title,
  onClose,
  children,
  width = 420,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button className="absolute inset-0 bg-black/50" aria-label="Close drawer" onClick={onClose} />
      <aside
        className="relative flex h-full flex-col border-l border-cyan/15 bg-[#0a121c] shadow-[-20px_0_60px_rgba(0,0,0,0.45)] animate-fade-up"
        style={{ width: `min(100vw, ${width}px)` }}
      >
        <header className="flex items-center justify-between gap-3 border-b border-cyan/10 px-4 py-4 sm:px-5">
          <h3 className="min-w-0 truncate font-display text-xl tracking-[0.14em] text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
      </aside>
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/60" aria-label="Close modal" onClick={onClose} />
      <div
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-2xl border border-cyan/15 bg-[#0b131d] p-4 shadow-2xl animate-fade-up sm:p-6",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
      >
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <h3 className="min-w-0 truncate font-display text-xl tracking-[0.12em] text-white sm:text-2xl">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-muted hover:bg-white/5 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-cyan/20 bg-[#071018] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-cyan/50",
        props.className,
      )}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full resize-none rounded-lg border border-cyan/20 bg-[#071018] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-cyan/50",
        props.className,
      )}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-lg border border-cyan/15 bg-[#071018] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan/40",
        props.className,
      )}
    />
  );
}
