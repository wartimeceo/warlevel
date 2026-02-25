"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { StatBar } from "@/components/StatBar";
import { getDB } from "@/lib/db/schema";
import { exportJSON, downloadJSON } from "@/lib/export/exportJSON";
import { importJSON } from "@/lib/export/importJSON";
import { initDB } from "@/lib/db";
import { ALL_STATS } from "@/lib/types";
import { SCHEMA_VERSION } from "@/lib/types";
import type { Profile, Stats } from "@/lib/types";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function loadData() {
    const db = getDB();
    const [p, s] = await Promise.all([
      db.profile.get("profile"),
      db.stats.get("stats"),
    ]);
    setProfile(p ?? null);
    setStats(s ?? null);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveProfile() {
    if (!profile) return;
    setSaving(true);
    const db = getDB();
    await db.profile.put(profile);
    setSaving(false);
    showToast("Paramètres sauvegardés.");
  }

  async function handleExport() {
    const data = await exportJSON();
    downloadJSON(data);
    showToast("Export téléchargé.");
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const text = await file.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setImportError("Fichier JSON invalide.");
      return;
    }

    const result = await importJSON(parsed);
    if (result.success) {
      showToast("Import réussi. Rechargez la page.");
      await loadData();
    } else {
      setImportError(result.error);
    }

    // Reset input
    e.target.value = "";
  }

  async function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 5000);
      return;
    }
    const db = getDB();
    await db.transaction(
      "rw",
      [db.profile, db.progression, db.stats, db.daily_logs, db.day_state, db.incidents, db.quests, db.loot, db.evolution_suggestions, db.notifications_queue],
      async () => {
        await db.daily_logs.clear();
        await db.day_state.clear();
        await db.incidents.clear();
        await db.quests.clear();
        await db.loot.clear();
        await db.evolution_suggestions.clear();
        await db.notifications_queue.clear();
        await db.profile.clear();
        await db.progression.clear();
        await db.stats.clear();
      }
    );
    // Re-seed
    await initDB();
    await loadData();
    setConfirmReset(false);
    showToast("Données réinitialisées.");
  }

  const updateProfile = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 border border-zinc-700 text-white text-xs font-mono px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <div>
          <h1 className="text-lg font-mono font-bold text-white tracking-widest">
            PARAMÈTRES
          </h1>
          <p className="text-xs text-zinc-600 mt-1">
            Schema v{SCHEMA_VERSION}
          </p>
        </div>

        {/* Time settings */}
        {profile && (
          <div className="space-y-4">
            <p className="text-xs font-mono text-zinc-500 tracking-widest">HORAIRES</p>

            {[
              { label: "RÉVEIL", key: "wakeTime" as keyof Profile },
              { label: "DÉBUT TRAINING", key: "trainingWindowStart" as keyof Profile },
              { label: "FIN TRAINING", key: "trainingWindowEnd" as keyof Profile },
              { label: "SHUTDOWN", key: "shutdownTime" as keyof Profile },
              { label: "LIMITE SOMMEIL", key: "bedDeadline" as keyof Profile },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-xs font-mono text-zinc-400">{label}</label>
                <input
                  type="time"
                  value={profile[key] as string}
                  onChange={(e) => updateProfile(key, e.target.value as Profile[typeof key])}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-white font-mono focus:outline-none focus:border-zinc-600"
                />
              </div>
            ))}

            {/* Difficulty */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-zinc-400">MODE</label>
              <select
                value={profile.difficultyMode}
                onChange={(e) =>
                  updateProfile("difficultyMode", e.target.value as "Normal" | "Brutal")
                }
                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-white font-mono focus:outline-none"
              >
                <option value="Normal">Normal</option>
                <option value="Brutal">Brutal</option>
              </select>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-mono rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "SAUVEGARDE..." : "SAUVEGARDER"}
            </button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="space-y-3">
            <p className="text-xs font-mono text-zinc-500 tracking-widest">STATS</p>
            {ALL_STATS.map((stat) => (
              <StatBar
                key={stat}
                stat={stat}
                score={(stats as unknown as Record<string, number>)[`${stat}_score`] ?? 0}
                xp={(stats as unknown as Record<string, number>)[`${stat}_xp`] ?? 0}
              />
            ))}
          </div>
        )}

        {/* Export / Import */}
        <div className="space-y-3">
          <p className="text-xs font-mono text-zinc-500 tracking-widest">DONNÉES</p>

          <button
            onClick={handleExport}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm font-mono rounded-lg transition-colors"
          >
            EXPORTER JSON
          </button>

          <label className="block w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm font-mono rounded-lg transition-colors text-center cursor-pointer">
            IMPORTER JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          {/* CSV export — Phase 2 stub */}
          <button
            disabled
            className="w-full py-2.5 bg-zinc-950 border border-zinc-900 text-zinc-700 text-sm font-mono rounded-lg cursor-not-allowed"
            title="Phase 2 — non disponible"
          >
            EXPORTER CSV (Phase 2)
          </button>

          {importError && (
            <p className="text-red-500 text-xs font-mono">{importError}</p>
          )}
        </div>

        {/* Reset */}
        <div className="space-y-3">
          <p className="text-xs font-mono text-zinc-500 tracking-widest">DANGER</p>
          <button
            onClick={handleReset}
            className={`w-full py-2.5 border font-mono text-sm rounded-lg transition-colors ${
              confirmReset
                ? "bg-red-900 border-red-700 text-red-300"
                : "bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-red-900 hover:text-red-600"
            }`}
          >
            {confirmReset
              ? "CONFIRMER RESET (5s)"
              : "RÉINITIALISER LES DONNÉES"}
          </button>
          {confirmReset && (
            <p className="text-xs text-zinc-600 font-mono text-center">
              Cliquer une deuxième fois pour confirmer.
            </p>
          )}
        </div>

        {/* Signature */}
        <p className="text-xs text-zinc-700 italic text-center pb-4">
          {profile?.signatureLine ?? "Je sais donc je suis."}
        </p>
      </div>

      <Navigation />
    </div>
  );
}
