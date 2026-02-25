"use client";

interface Props {
  value: number; // 0..100
  showLabel?: boolean;
}

export function CorruptionBar({ value, showLabel = true }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped >= 70
      ? "bg-red-600"
      : clamped >= 40
      ? "bg-orange-500"
      : clamped >= 20
      ? "bg-yellow-500"
      : "bg-emerald-600";

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-zinc-500 font-mono">CORRUPTION</span>
          <span
            className={`text-xs font-mono font-bold ${
              clamped >= 70 ? "text-red-500" : "text-zinc-400"
            }`}
          >
            {clamped}/100
          </span>
        </div>
      )}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
