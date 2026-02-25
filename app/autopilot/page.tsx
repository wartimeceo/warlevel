"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { AutoModeBadge } from "@/components/AutoModeBadge";
import { QuestCard } from "@/components/QuestCard";
import { useTop3Quests, useProgression } from "@/lib/hooks/useDB";
import { applyQuestDone, applyQuestFailed, applyQuestSkipped } from "@/lib/engine/xpEngine";
import { applyCorruptionTrigger } from "@/lib/engine/corruptionEngine";
import { generateSalvageQuests } from "@/lib/engine/salvagePlanner";
import { getDB } from "@/lib/db/schema";
import { getTodayDate } from "@/lib/utils/dates";
import type { Quest, AutoMode } from "@/lib/types";

export default function AutopilotPage() {
  const today = getTodayDate();
  const { top3, dayState, loading, refresh } = useTop3Quests(today);
  const { progression, refresh: refreshProg } = useProgression();
  const [toast, setToast] = useState<string | null>(null);

  const autoMode: AutoMode = dayState?.autoMode ?? "NORMAL";

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleDone(questId: string) {
    await applyQuestDone(questId);
    await refresh();
    await refreshProg();
    showToast("+XP");
  }

  async function handleFail(questId: string) {
    await applyQuestFailed(questId);
    await applyCorruptionTrigger("FAILED_QUEST");
    await refresh();
    showToast("Échoué.");
  }

  async function handleSkip(questId: string) {
    await applyQuestSkipped(questId);
    await applyCorruptionTrigger("SKIPPED_QUEST");
    await refresh();
    showToast("Ignoré.");
  }

  async function handleActivateSalvage() {
    const db = getDB();
    const trainingDone = dayState?.trainingDone ?? false;
    const salvageQuests = await generateSalvageQuests(today, !trainingDone);
    await db.quests.bulkAdd(salvageQuests);
    const top3Ids = salvageQuests.slice(0, 3).map((q) => q.id);
    await db.day_state.update(today, {
      autoMode: "SALVAGE",
      top3QuestIds: top3Ids,
      updatedAt: Date.now(),
    });
    await refresh();
    showToast("Plan SALVAGE activé.");
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 border border-zinc-700 text-white text-xs font-mono px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-mono font-bold text-white tracking-widest">
            AUTOPILOT
          </h1>
          <AutoModeBadge mode={autoMode} />
        </div>

        {/* Mode info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-1">
          <p className="text-xs font-mono text-zinc-500">CORRUPTION</p>
          <p className="text-2xl font-mono font-bold text-white">
            {progression?.corruption ?? 0}
            <span className="text-zinc-600 text-sm">/100</span>
          </p>
          <p className="text-xs font-mono text-zinc-500">
            STREAK{" "}
            <span className="text-white">{progression?.streakDays ?? 0} jours</span>
          </p>
        </div>

        {/* Salvage button */}
        {autoMode !== "SALVAGE" && (
          <button
            onClick={handleActivateSalvage}
            className="w-full py-3 bg-orange-900/30 hover:bg-orange-900/50 border border-orange-800 text-orange-400 font-mono font-bold text-sm rounded-lg transition-colors"
          >
            ACTIVER MODE SALVAGE
          </button>
        )}

        {/* Top 3 */}
        <div>
          <p className="text-xs font-mono text-zinc-500 tracking-widest mb-3">
            TOP 3 — {today}
          </p>
          {loading ? (
            <div className="text-zinc-700 font-mono text-sm text-center py-6 animate-pulse">
              CHARGEMENT...
            </div>
          ) : top3.length === 0 ? (
            <div className="bg-zinc-900 rounded-lg p-6 text-center">
              <p className="text-zinc-500 text-sm">Aucune quête active.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {top3.map((q) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  onDone={q.status === "TODO" ? handleDone : undefined}
                  onFail={q.status === "TODO" ? handleFail : undefined}
                  onSkip={q.status === "TODO" ? handleSkip : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
}
