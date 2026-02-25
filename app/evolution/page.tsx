"use client";

import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useEvolutionSuggestions } from "@/lib/hooks/useDB";
import { acceptSuggestion, rejectSuggestion, runEvolutionObserver } from "@/lib/engine/evolutionObserver";
import type { EvolutionSuggestion } from "@/lib/types";

const IMPACT_COLORS: Record<string, string> = {
  LOW: "text-zinc-500",
  MED: "text-yellow-500",
  HIGH: "text-red-500",
};

const STATUS_STYLES: Record<string, string> = {
  PROPOSED: "border-zinc-700 bg-zinc-900",
  ACCEPTED: "border-emerald-800 bg-emerald-950 opacity-60",
  REJECTED: "border-zinc-900 bg-zinc-950 opacity-30",
};

function SuggestionCard({
  s,
  onAccept,
  onReject,
}: {
  s: EvolutionSuggestion;
  onAccept: () => void;
  onReject: () => void;
}) {
  const style = STATUS_STYLES[s.status] ?? STATUS_STYLES.PROPOSED;
  const impactColor = IMPACT_COLORS[s.impact] ?? "text-zinc-500";

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${style}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono text-zinc-500">{s.source}</span>
            <span className={`text-xs font-mono font-bold ${impactColor}`}>
              {s.impact}
            </span>
            <span className="text-xs font-mono text-zinc-600">P{s.priority}</span>
          </div>
          <p className="text-xs text-zinc-400 italic">{s.detectedPattern}</p>
        </div>
        <span className="text-xs font-mono text-zinc-600 shrink-0">{s.status}</span>
      </div>

      <div className="bg-zinc-800 rounded p-3">
        <p className="text-xs font-mono text-zinc-500 mb-1">{s.suggestionType}</p>
        <p className="text-sm text-zinc-200">{s.suggestionText}</p>
      </div>

      {s.status === "PROPOSED" && (
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="flex-1 py-2 bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-800 text-emerald-400 text-xs font-mono font-bold rounded transition-colors"
          >
            ACCEPTER
          </button>
          <button
            onClick={onReject}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-500 text-xs font-mono rounded transition-colors"
          >
            REJETER
          </button>
        </div>
      )}

      <p className="text-xs text-zinc-700 font-mono">
        {new Date(s.createdAt).toLocaleDateString("fr-FR")}
      </p>
    </div>
  );
}

export default function EvolutionPage() {
  const { suggestions, refresh } = useEvolutionSuggestions();

  useEffect(() => {
    // Run observer when page opens
    runEvolutionObserver().then(refresh);
  }, []);

  async function handleAccept(id: string) {
    await acceptSuggestion(id);
    await refresh();
  }

  async function handleReject(id: string) {
    await rejectSuggestion(id);
    await refresh();
  }

  const proposed = suggestions.filter((s) => s.status === "PROPOSED");
  const others = suggestions.filter((s) => s.status !== "PROPOSED");

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
        <div>
          <h1 className="text-lg font-mono font-bold text-white tracking-widest">
            ÉVOLUTION
          </h1>
          <p className="text-xs text-zinc-600 mt-1">
            Observateur passif. Suggestions uniquement.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <p className="text-xs font-mono text-zinc-500">
            L'observateur détecte des patterns et suggère des améliorations.
            Accepter une suggestion ne modifie rien automatiquement.
            C'est une note pour développement futur (Phase 2).
          </p>
        </div>

        {proposed.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-mono text-zinc-500 tracking-widest">
              PROPOSÉES ({proposed.length})
            </p>
            {proposed.map((s) => (
              <SuggestionCard
                key={s.id}
                s={s}
                onAccept={() => handleAccept(s.id)}
                onReject={() => handleReject(s.id)}
              />
            ))}
          </div>
        )}

        {proposed.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center">
            <p className="text-zinc-500 text-sm font-mono">
              Aucune suggestion pour l'instant.
            </p>
            <p className="text-zinc-700 text-xs font-mono mt-1">
              L'observateur analyse les patterns sur plusieurs jours.
            </p>
          </div>
        )}

        {others.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-mono text-zinc-600 tracking-widest">
              HISTORIQUE ({others.length})
            </p>
            {others.map((s) => (
              <SuggestionCard
                key={s.id}
                s={s}
                onAccept={() => handleAccept(s.id)}
                onReject={() => handleReject(s.id)}
              />
            ))}
          </div>
        )}
      </div>
      <Navigation />
    </div>
  );
}
