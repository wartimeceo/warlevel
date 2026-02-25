"use client";

interface Props {
  levelIndex: number;
  nameJP: string;
  nameFR: string;
  arcJP: string;
  arcFR: string;
  globalXP: number;
  xpThreshold: number;
  nextThreshold: number | null;
}

export function LevelDisplay({
  levelIndex,
  nameJP,
  nameFR,
  arcJP,
  arcFR,
  globalXP,
  xpThreshold,
  nextThreshold,
}: Props) {
  const progress = nextThreshold
    ? Math.min(
        100,
        ((globalXP - xpThreshold) / (nextThreshold - xpThreshold)) * 100
      )
    : 100;

  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-white font-mono">L{levelIndex}</span>
        <span className="text-lg font-bold text-white">{nameJP}</span>
        <span className="text-sm text-zinc-400">{nameFR}</span>
      </div>
      <div className="text-xs text-zinc-600 font-mono">
        {arcJP} — {arcFR}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-zinc-500 font-mono whitespace-nowrap">
          {globalXP} XP
          {nextThreshold && ` / ${nextThreshold}`}
        </span>
      </div>
    </div>
  );
}
