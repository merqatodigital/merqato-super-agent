import { Binoculars, Bot, Code2, Diamond, Leaf } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

function HermesGlyph({
  size = 18,
  className,
  strokeWidth = 1.6,
}: {
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 4v16" />
      <path d="M12 8c-2.2-2.4-5.5-3.2-8-2 1.5 2.8 1.6 5.4 0 8 2.6 0.8 6-0.2 8-2.8" />
      <path d="M12 8c2.2-2.4 5.5-3.2 8-2-1.5 2.8-1.6 5.4 0 8-2.6 0.8-6-0.2-8-2.8" />
      <path d="M9 20h6" />
    </svg>
  );
}

type MarkIcon = (props: { size?: number; className?: string; strokeWidth?: number }) => ReactNode;

const marks: Record<string, MarkIcon> = {
  tala: Leaf,
  nyx: Diamond,
  hermes: HermesGlyph,
  engineer: Code2,
  scout: Binoculars,
  bot: Bot,
};

export function AgentMark({
  icon,
  size = 18,
  className,
}: {
  icon: string;
  size?: number;
  className?: string;
}) {
  const Icon = marks[icon] ?? Bot;
  return <Icon size={size} className={className} strokeWidth={1.6} />;
}

export function AgentAvatar({
  icon,
  size = 40,
  active,
}: {
  icon: string;
  size?: number;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border",
        active ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-white/10 bg-white/5 text-white/70",
      )}
      style={{ width: size, height: size }}
    >
      <AgentMark icon={icon} size={Math.round(size * 0.42)} />
    </div>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="15" stroke="#2ee6d6" strokeWidth="1.4" />
      <rect x="9" y="14" width="3.2" height="9" rx="0.6" fill="#2ee6d6" />
      <rect x="14.4" y="9" width="3.2" height="14" rx="0.6" fill="#7ff6ea" />
      <rect x="19.8" y="12" width="3.2" height="11" rx="0.6" fill="#14c8b8" />
    </svg>
  );
}
