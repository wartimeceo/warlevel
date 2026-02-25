"use client";

import type { AutoMode } from "@/lib/types";

const MODE_CONFIG: Record<
  AutoMode,
  { label: string; color: string; bg: string }
> = {
  NORMAL: { label: "NORMAL", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
  SALVAGE: { label: "SALVAGE", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" },
  RECOVERY: { label: "RECOVERY", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
  BRUTAL: { label: "BRUTAL", color: "text-red-500", bg: "bg-red-500/10 border-red-500/30" },
};

export function AutoModeBadge({ mode }: { mode: AutoMode }) {
  const cfg = MODE_CONFIG[mode];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono font-bold tracking-widest ${cfg.color} ${cfg.bg}`}
    >
      {cfg.label}
    </span>
  );
}
