"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { AutoModeBadge } from "@/components/AutoModeBadge";
import { CorruptionBar } from "@/components/CorruptionBar";
import { LevelDisplay } from "@/components/LevelDisplay";
import { QuestCard } from "@/components/QuestCard";
import { QuickPingModal } from "@/components/QuickPingModal";
import { useInit, useTop3Quests, useProgression } from "@/lib/hooks/useDB";
import { applyQuestDone, applyQuestFailed, applyQuestSkipped } from "@/lib/engine/xpEngine";
import { applyCorruptionTrigger } from "@/lib/engine/corruptionEngine";
import { checkAndApplyLevelUp, getCurrentLevel } from "@/lib/engine/levelEngine";
import { getDB } from "@/lib/db/schema";
import { getTodayDate, getCurrentTime } from "@/lib/utils/dates";
import { generateDailyQuests } from "@/lib/engine/questGeneration";
import { useGraceToken } from "@/lib/engine/graceTokens";
import { useEffect } from "react";

export default function HomePage() {
  const { ready, error } = useInit();
  const today = getTodayDate();
  const { top3, dayState, loading, refresh } = useTop3Quests(today);
  const { progression, refresh: refreshProgression } = useProgression();
  const [levelData, setLevelData] = useState<Awaited<ReturnType<typeof getCurrentLevel>> | null>(null);
  const [quickPingOpen, setQuickPingOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [graceTokens, setGraceTokens] = useState(2);
  const router = useRouter();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refreshAll = useCallback(async () => {
    await refresh();
    await refreshProgression();
    const level = await getCurrentLevel();
    setLevelData(level);
    const p = await getDB().progression.get("progression");
    setGraceTokens(p?.graceTokensRemaining ?? 2);
  }, [refresh, refreshProgression]);

  useEffect(() => {
    if (ready) refreshAll();
  }, [ready, refreshAll]);

  async function handleDone(questId: string) {
    await applyQuestDone(questId);
    const didLevelUp = await checkAndApplyLevelUp();
    if (didLevelUp) showToast("LEVEL UP !");
    await refreshAll();
    showToast("Quête terminée. +XP");
  }

  async function handleFail(questId: string) {
    await applyQuestFailed(questId);
    await applyCorruptionTrigger("FAILED_QUEST");
    await refreshAll();
    showToast("Quête échouée.");
  }

  async function handleSkip(questId: string) {
    await applyQuestSkipped(questId);
    await applyCorruptionTrigger("SKIPPED_QUEST");
    await refreshAll();
    showToast("Quête ignorée.");
  }

  async function handleTrainingDone() {
    const db = getDB();
    await db.day_state.update(today, { trainingDone: true, updatedAt: Date.now() });
    await applyCorruptionTrigger("TRAINING_DONE");
    await refreshAll();
    showToast("Entraînement validé. -10 corruption");
  }

  async function handleShutdown() {
    const db = getDB();
    await db.day_state.update(today, { shutdownDone: true, updatedAt: Date.now() });
    await applyCorruptionTrigger("SHUTDOWN_DONE");
    await refreshAll();
    showToast("Shutdown validé.");
  }

  async function handleUseGraceToken() {
    const used = await useGraceToken(today);
    if (used) {
      await refreshAll();
      showToast("Token de grâce utilisé. Streak préservé.");
    } else {
      showToast("Aucun token disponible ce mois.");
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-600 font-mono text-sm animate-pulse">INITIALISATION...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-red-500 font-mono text-sm text-center">{error}</div>
      </div>
    );
  }

  const autoMode = dayState?.autoMode ?? "NORMAL";
  const streak = progression?.streakDays ?? 0;
  const corruption = progression?.corruption ?? 0;

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 border border-zinc-700 text-white text-xs font-mono px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          {levelData ? (
            <LevelDisplay
              levelIndex={levelData.levelIndex}
              nameJP={levelData.nameJP}
              nameFR={levelData.nameFR}
              arcJP={levelData.arcJP}
              arcFR={levelData.arcFR}
              globalXP={levelData.globalXP}
              xpThreshold={levelData.xpThreshold}
              nextThreshold={levelData.nextThreshold}
            />
          ) : (
            <div className="text-zinc-700 font-mono text-sm">L1 目覚め</div>
          )}
          <AutoModeBadge mode={autoMode} />
        </div>

        {/* Stats row */}
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <div className="text-xl font-bold text-white font-mono">{streak}</div>
            <div className="text-xs text-zinc-600">STREAK</div>
          </div>
          <div className="flex-1">
            <CorruptionBar value={corruption} />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-400 font-mono">{graceTokens}</div>
            <div className="text-xs text-zinc-600">GRÂCE</div>
          </div>
        </div>

        {/* Signature */}
        <p className="text-xs text-zinc-600 italic text-center">
          Je sais donc je suis.
        </p>

        {/* Top 3 Quests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-zinc-500 tracking-widest">TOP 3</span>
            {autoMode === "SALVAGE" && (
              <span className="text-xs font-mono text-orange-400">MODE SALVAGE</span>
            )}
          </div>

          {loading ? (
            <div className="text-zinc-700 font-mono text-sm py-8 text-center animate-pulse">
              CHARGEMENT...
            </div>
          ) : top3.length === 0 ? (
            <div className="bg-zinc-900 rounded-lg p-6 text-center space-y-2">
              <p className="text-zinc-500 text-sm">Aucune quête active.</p>
              <button
                onClick={async () => {
                  await generateDailyQuests(today);
                  await refreshAll();
                }}
                className="text-xs font-mono text-blue-400 hover:text-blue-300"
              >
                Générer les quêtes →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {top3.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onDone={quest.status === "TODO" ? handleDone : undefined}
                  onFail={quest.status === "TODO" ? handleFail : undefined}
                  onSkip={quest.status === "TODO" ? handleSkip : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => router.push("/scan")}
            className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm font-mono font-bold text-zinc-300 transition-colors"
          >
            ◈ SCAN
          </button>
          <button
            onClick={handleTrainingDone}
            className={`py-3 rounded-lg text-sm font-mono font-bold transition-colors border ${
              dayState?.trainingDone
                ? "bg-emerald-950 border-emerald-800 text-emerald-500"
                : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300"
            }`}
          >
            {dayState?.trainingDone ? "✓ TRAINING" : "TRAINING"}
          </button>
          <button
            onClick={handleShutdown}
            className={`py-3 rounded-lg text-sm font-mono font-bold transition-colors border ${
              dayState?.shutdownDone
                ? "bg-purple-950 border-purple-800 text-purple-400"
                : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300"
            }`}
          >
            {dayState?.shutdownDone ? "✓ SHUTDOWN" : "SHUTDOWN"}
          </button>
          <button
            onClick={() => router.push("/incident")}
            className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm font-mono font-bold text-zinc-300 transition-colors"
          >
            ⚡ INCIDENT
          </button>
        </div>

        {/* Quick Ping + Grace */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setQuickPingOpen(true)}
            className="py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-mono font-bold text-zinc-400 transition-colors"
          >
            QUICK PING
          </button>
          <button
            onClick={handleUseGraceToken}
            disabled={graceTokens === 0}
            className="py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-mono font-bold text-yellow-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            TOKEN GRÂCE ({graceTokens})
          </button>
        </div>

        {/* SALVAGE warning */}
        {autoMode === "SALVAGE" && (
          <div className="bg-orange-950 border border-orange-800 rounded-lg p-3">
            <p className="text-xs font-mono text-orange-400">
              MODE SALVAGE actif. Entraînement manqué après 10:30.
              Plan de récupération en cours.
            </p>
          </div>
        )}

        {/* BRUTAL warning */}
        {autoMode === "BRUTAL" && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-3">
            <p className="text-xs font-mono text-red-400">
              MODE BRUTAL. 2 jours consécutifs sans entraînement. Pas d'excuse.
            </p>
          </div>
        )}

        {/* RECOVERY info */}
        {autoMode === "RECOVERY" && (
          <div className="bg-yellow-950 border border-yellow-800 rounded-lg p-3">
            <p className="text-xs font-mono text-yellow-400">
              MODE RECOVERY. Énergie basse ou corruption haute. Priorité: récupérer.
            </p>
          </div>
        )}
      </div>

      <QuickPingModal
        open={quickPingOpen}
        onClose={() => setQuickPingOpen(false)}
        onCreated={async () => {
          await refreshAll();
        }}
      />

      <Navigation />
    </div>
  );
}
