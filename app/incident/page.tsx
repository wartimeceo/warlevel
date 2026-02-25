"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { getDB } from "@/lib/db/schema";
import { generateId } from "@/lib/utils/deterministic";
import { getTodayDate } from "@/lib/utils/dates";
import { addIncidentQuest } from "@/lib/engine/questGeneration";
import { updateDayStateAutoMode } from "@/lib/engine/autoMode";
import type { IncidentType, ImpactedWindow, ChosenResponse } from "@/lib/types";

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: "UNPLANNED", label: "Non planifié" },
  { value: "MISS", label: "Raté" },
  { value: "OVERLOAD", label: "Surcharge" },
  { value: "LOW_ENERGY", label: "Énergie basse" },
  { value: "DERAIL", label: "Déraillement" },
  { value: "SOCIAL_FRICTION", label: "Friction sociale" },
  { value: "BUSINESS_FIRE", label: "Urgence business" },
];

const IMPACTED_WINDOWS: { value: ImpactedWindow; label: string }[] = [
  { value: "TRAINING", label: "Entraînement" },
  { value: "DAY", label: "Journée" },
  { value: "SHUTDOWN", label: "Shutdown" },
  { value: "SLEEP", label: "Sommeil" },
  { value: "CONTENT", label: "Contenu" },
  { value: "WORK", label: "Travail" },
];

const RESPONSES: { value: ChosenResponse; label: string }[] = [
  { value: "ADAPT", label: "S'adapter" },
  { value: "PUSH", label: "Pousser quand même" },
  { value: "RECOVER", label: "Récupérer" },
  { value: "RESCHEDULE", label: "Reprogrammer" },
];

export default function IncidentPage() {
  const router = useRouter();
  const today = getTodayDate();

  const [type, setType] = useState<IncidentType>("UNPLANNED");
  const [summary, setSummary] = useState("");
  const [severity, setSeverity] = useState(2);
  const [impactedWindow, setImpactedWindow] = useState<ImpactedWindow>("DAY");
  const [chosenResponse, setChosenResponse] = useState<ChosenResponse>("ADAPT");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) {
      setError("Résumé requis.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const db = getDB();
      const id = generateId();
      const now = Date.now();

      await db.incidents.add({
        id,
        dateTime: now,
        type,
        summary: summary.trim(),
        severity,
        impactedWindow,
        chosenResponse,
        createdAt: now,
      });

      // Infer failure tag from type
      const tagMap: Partial<Record<IncidentType, string>> = {
        SOCIAL_FRICTION: "small_chiefs",
        LOW_ENERGY: "energy_leak",
        DERAIL: "distraction",
        MISS: "avoidance_admin",
        BUSINESS_FIRE: "overthinking",
        OVERLOAD: "energy_leak",
      };
      const failureTag = tagMap[type] ?? "distraction";

      await addIncidentQuest(today, id, failureTag);
      await updateDayStateAutoMode(today);

      setDone(true);
      setTimeout(() => router.push("/home"), 2000);
    } catch (err) {
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-2xl">⚡</div>
          <p className="text-yellow-400 font-mono text-sm">INCIDENT ENREGISTRÉ.</p>
          <p className="text-zinc-600 font-mono text-xs">Micro-quête générée.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="mb-6">
          <h1 className="text-lg font-mono font-bold text-white tracking-widest">
            INCIDENT
          </h1>
          <p className="text-xs text-zinc-600 mt-1">Capture immédiate.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              TYPE
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INCIDENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`py-2 px-3 rounded text-xs font-mono text-left transition-colors ${
                    type === t.value
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              RÉSUMÉ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Ce qui s'est passé."
              maxLength={200}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                SÉVÉRITÉ
              </label>
              <span className="text-sm font-mono font-bold text-white">{severity}/5</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSeverity(v)}
                  className={`flex-1 h-10 rounded text-sm font-mono font-bold transition-colors ${
                    severity >= v
                      ? v >= 4 ? "bg-red-700 text-white" : "bg-orange-700 text-white"
                      : "bg-zinc-800 text-zinc-600 hover:bg-zinc-700"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Impacted window */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              IMPACT SUR
            </label>
            <div className="grid grid-cols-3 gap-2">
              {IMPACTED_WINDOWS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setImpactedWindow(w.value)}
                  className={`py-2 px-2 rounded text-xs font-mono transition-colors ${
                    impactedWindow === w.value
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Response */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              RÉPONSE
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RESPONSES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setChosenResponse(r.value)}
                  className={`py-2 px-3 rounded text-xs font-mono transition-colors ${
                    chosenResponse === r.value
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-mono">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-white hover:bg-zinc-100 text-zinc-950 font-mono font-bold text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "ENREGISTREMENT..." : "ENREGISTRER L'INCIDENT"}
          </button>
        </form>
      </div>
      <Navigation />
    </div>
  );
}
