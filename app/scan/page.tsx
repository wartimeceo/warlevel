"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { getDB } from "@/lib/db/schema";
import { generateId } from "@/lib/utils/deterministic";
import { getTodayDate } from "@/lib/utils/dates";
import { generateDailyQuests } from "@/lib/engine/questGeneration";
import { updateDayStateAutoMode } from "@/lib/engine/autoMode";

// ============================================================
// DAILY SCAN — 15 seconds, mobile screen
// ============================================================

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
          {label}
        </label>
        <span className="text-sm font-mono font-bold text-white">{value}/5</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`flex-1 h-10 rounded text-sm font-mono font-bold transition-colors ${
              value >= v
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-600 hover:bg-zinc-700"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ScanPage() {
  const router = useRouter();
  const today = getTodayDate();

  const [energy, setEnergy] = useState(3);
  const [focus, setFocus] = useState(3);
  const [chaos, setChaos] = useState(2);
  const [friction, setFriction] = useState("");
  const [avoided, setAvoided] = useState("");
  const [proud, setProud] = useState("");
  const [intention, setIntention] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!friction.trim()) {
      setError("Le champ friction est requis.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const db = getDB();
      const id = generateId();
      const now = Date.now();

      await db.daily_logs.put({
        id,
        date: today,
        energy,
        focus,
        chaos,
        friction: friction.trim(),
        avoided: avoided.trim() || undefined,
        proud: proud.trim() || undefined,
        intention: intention.trim() || undefined,
        createdAt: now,
      });

      // Update day_state: checkinDone = true
      const existing = await db.day_state.get(today);
      if (existing) {
        // Infer failure tag from friction
        await db.day_state.update(today, {
          checkinDone: true,
          keyFailureTag: inferTagFromFriction(friction + " " + avoided),
          updatedAt: now,
        });
      } else {
        await db.day_state.put({
          date: today,
          checkinDone: true,
          trainingDone: false,
          shutdownDone: false,
          contentDone: false,
          keyFailureTag: inferTagFromFriction(friction + " " + avoided),
          autoMode: "NORMAL",
          top3QuestIds: [],
          updatedAt: now,
        });
      }

      // Recompute autoMode and regenerate quests
      await updateDayStateAutoMode(today);
      await generateDailyQuests(today);

      setDone(true);
      setTimeout(() => router.push("/home"), 1500);
    } catch (err) {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  function inferTagFromFriction(text: string): string | null {
    const t = text.toLowerCase();
    if (t.includes("admin") || t.includes("mail")) return "avoidance_admin";
    if (t.includes("chef") || t.includes("réunion")) return "small_chiefs";
    if (t.includes("distract") || t.includes("téléphone")) return "distraction";
    if (t.includes("énergie") || t.includes("fatigue")) return "energy_leak";
    if (t.includes("peur") || t.includes("social")) return "social_fear";
    if (t.includes("confort") || t.includes("facile")) return "comfort_loop";
    if (t.includes("pens") || t.includes("analyse")) return "overthinking";
    return null;
  }

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-2xl">◈</div>
          <p className="text-emerald-400 font-mono text-sm">SCAN ENREGISTRÉ.</p>
          <p className="text-zinc-600 font-mono text-xs">Quêtes mises à jour.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-mono font-bold text-white tracking-widest">
            SCAN QUOTIDIEN
          </h1>
          <p className="text-xs text-zinc-600 mt-1">
            {today} — Réponds en 15 secondes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Energy */}
          <RatingRow label="ÉNERGIE" value={energy} onChange={setEnergy} />

          {/* Focus */}
          <RatingRow label="FOCUS" value={focus} onChange={setFocus} />

          {/* Chaos */}
          <RatingRow label="CHAOS" value={chaos} onChange={setChaos} />

          <div className="border-t border-zinc-800 pt-4" />

          {/* Friction — required */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              FRICTION <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={friction}
              onChange={(e) => setFriction(e.target.value)}
              placeholder="Ce qui frotte aujourd'hui."
              maxLength={120}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>

          {/* Avoided — optional */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              ÉVITÉ
            </label>
            <input
              type="text"
              value={avoided}
              onChange={(e) => setAvoided(e.target.value)}
              placeholder="Ce que tu as esquivé."
              maxLength={120}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>

          {/* Proud — optional */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              FIER DE
            </label>
            <input
              type="text"
              value={proud}
              onChange={(e) => setProud(e.target.value)}
              placeholder="Une chose bien faite."
              maxLength={120}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>

          {/* Intention — optional */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              INTENTION
            </label>
            <input
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="Ce qui compte ce soir."
              maxLength={120}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-950 font-mono font-bold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "ENREGISTREMENT..." : "VALIDER LE SCAN"}
          </button>
        </form>
      </div>
      <Navigation />
    </div>
  );
}
