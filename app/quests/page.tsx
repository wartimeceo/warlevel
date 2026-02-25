"use client";

import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { QuestCard } from "@/components/QuestCard";
import { applyQuestDone, applyQuestFailed, applyQuestSkipped } from "@/lib/engine/xpEngine";
import { applyCorruptionTrigger } from "@/lib/engine/corruptionEngine";
import { getTodayQuests, getExpiredQuests } from "@/lib/engine/questGeneration";
import { getTodayDate } from "@/lib/utils/dates";
import type { Quest } from "@/lib/types";

export default function QuestsPage() {
  const today = getTodayDate();
  const [visible, setVisible] = useState<Quest[]>([]);
  const [expired, setExpired] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showGraveyard, setShowGraveyard] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [v, e] = await Promise.all([
      getTodayQuests(today),
      getExpiredQuests(),
    ]);
    setVisible(v.slice(0, 7)); // cap at 7
    setExpired(e);
    setLoading(false);
  }, [today]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleDone(questId: string) {
    await applyQuestDone(questId);
    await loadAll();
    showToast("+XP");
  }

  async function handleFail(questId: string) {
    await applyQuestFailed(questId);
    await applyCorruptionTrigger("FAILED_QUEST");
    await loadAll();
  }

  async function handleSkip(questId: string) {
    await applyQuestSkipped(questId);
    await applyCorruptionTrigger("SKIPPED_QUEST");
    await loadAll();
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 border border-zinc-700 text-white text-xs font-mono px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-mono font-bold text-white tracking-widest">
            QUÊTES
          </h1>
          <span className="text-xs font-mono text-zinc-600">{today}</span>
        </div>

        {/* Visible quests */}
        <div>
          <p className="text-xs font-mono text-zinc-500 tracking-widest mb-3">
            ACTIVES ({visible.filter((q) => q.status === "TODO").length}/{visible.length})
          </p>
          {loading ? (
            <div className="text-zinc-700 font-mono text-sm text-center py-6 animate-pulse">
              CHARGEMENT...
            </div>
          ) : visible.length === 0 ? (
            <div className="bg-zinc-900 rounded-lg p-6 text-center">
              <p className="text-zinc-500 text-sm">Aucune quête pour aujourd'hui.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visible.map((q) => (
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

        {/* Graveyard */}
        {expired.length > 0 && (
          <div>
            <button
              onClick={() => setShowGraveyard(!showGraveyard)}
              className="text-xs font-mono text-zinc-600 hover:text-zinc-400 tracking-widest flex items-center gap-2"
            >
              CIMETIÈRE ({expired.length})
              <span>{showGraveyard ? "▲" : "▼"}</span>
            </button>
            {showGraveyard && (
              <div className="mt-3 space-y-2 opacity-40">
                {expired.slice(0, 10).map((q) => (
                  <QuestCard key={q.id} quest={q} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
