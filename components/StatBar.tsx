"use client";

import type { StatKey } from "@/lib/types";
import { STAT_LABELS } from "@/lib/types";

interface Props {
  stat: StatKey;
  score: number; // 0..100
  xp: number;
}

export function StatBar({ stat, score, xp }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 font-mono w-32 shrink-0">
        {STAT_LABELS[stat]}
      </span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500 font-mono w-16 text-right">
        {score}/100
      </span>
      <span className="text-xs text-zinc-600 font-mono w-16 text-right">
        {xp} XP
      </span>
    </div>
  );
}
