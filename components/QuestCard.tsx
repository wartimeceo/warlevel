"use client";

import type { Quest } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  TRAINING: "text-blue-400",
  SHUTDOWN: "text-purple-400",
  DAILY: "text-zinc-400",
  SURPRISE: "text-yellow-400",
  RECOVERY: "text-emerald-400",
  SOVEREIGNTY: "text-orange-400",
  EXECUTION: "text-red-400",
  PUNISHMENT: "text-red-600",
  BOSS: "text-red-500",
  WEEKLY: "text-indigo-400",
};

const RISK_COLORS: Record<string, string> = {
  LOW: "text-emerald-600",
  MED: "text-yellow-600",
  HIGH: "text-red-600",
};

const STATUS_STYLES: Record<string, string> = {
  TODO: "border-zinc-800 bg-zinc-900",
  DONE: "border-emerald-800 bg-emerald-950 opacity-60",
  FAILED: "border-red-900 bg-red-950 opacity-60",
  SKIPPED: "border-zinc-800 bg-zinc-950 opacity-40",
  EXPIRED: "border-zinc-900 bg-zinc-950 opacity-30",
};

interface Props {
  quest: Quest;
  onDone?: (id: string) => void;
  onFail?: (id: string) => void;
  onSkip?: (id: string) => void;
  compact?: boolean;
}

export function QuestCard({ quest, onDone, onFail, onSkip, compact = false }: Props) {
  const typeColor = TYPE_COLORS[quest.type] ?? "text-zinc-400";
  const riskColor = RISK_COLORS[quest.risk] ?? "text-zinc-500";
  const statusStyle = STATUS_STYLES[quest.status] ?? STATUS_STYLES.TODO;

  const isDone = quest.status !== "TODO";

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${statusStyle}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-mono font-bold ${typeColor}`}>
              {quest.type}
            </span>
            <span className={`text-xs font-mono ${riskColor}`}>
              {quest.risk}
            </span>
            <span className="text-xs text-zinc-600 font-mono">
              {quest.durationMin}min
            </span>
            <span className="text-xs text-zinc-600 font-mono">
              ★{quest.difficulty}
            </span>
          </div>
          <p className="text-sm text-white font-medium leading-snug">
            {quest.title}
          </p>
          {!compact && (
            <p className="text-xs text-zinc-500 mt-1 font-mono">
              +{quest.xpReward} XP · {quest.primaryStat}
            </p>
          )}
        </div>

        {/* Status badge */}
        {quest.status !== "TODO" && (
          <span className="text-xs font-mono text-zinc-500 shrink-0">
            {quest.status}
          </span>
        )}
      </div>

      {/* Actions */}
      {quest.status === "TODO" && (onDone || onFail || onSkip) && (
        <div className="flex gap-2 pt-1">
          {onDone && (
            <button
              onClick={() => onDone(quest.id)}
              className="flex-1 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white text-xs font-mono font-bold transition-colors"
            >
              DONE
            </button>
          )}
          {onFail && (
            <button
              onClick={() => onFail(quest.id)}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-red-900 active:bg-red-950 text-zinc-400 hover:text-red-400 text-xs font-mono transition-colors"
            >
              FAIL
            </button>
          )}
          {onSkip && (
            <button
              onClick={() => onSkip(quest.id)}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-500 text-xs font-mono transition-colors"
            >
              SKIP
            </button>
          )}
        </div>
      )}
    </div>
  );
}
