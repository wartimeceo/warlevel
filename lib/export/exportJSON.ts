import { getDB } from "../db/schema";
import type { ExportSchema } from "../types";
import { SCHEMA_VERSION } from "../types";

// ============================================================
// WARLEVEL — Export JSON (full DB dump)
// ============================================================

export async function exportJSON(): Promise<ExportSchema> {
  const db = getDB();

  const [
    profile,
    progression,
    stats,
    daily_logs,
    day_state,
    incidents,
    quests,
    triggers,
    rules_engine,
    notifications_queue,
    loot,
    evolution_suggestions,
  ] = await Promise.all([
    db.profile.get("profile"),
    db.progression.get("progression"),
    db.stats.get("stats"),
    db.daily_logs.toArray(),
    db.day_state.toArray(),
    db.incidents.toArray(),
    db.quests.toArray(),
    db.triggers.toArray(),
    db.rules_engine.toArray(),
    db.notifications_queue.toArray(),
    db.loot.toArray(),
    db.evolution_suggestions.toArray(),
  ]);

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: Date.now(),
    profile,
    progression,
    stats,
    daily_logs,
    day_state,
    incidents,
    quests,
    triggers,
    rules_engine,
    notifications_queue,
    loot,
    evolution_suggestions,
  };
}

export function downloadJSON(data: ExportSchema): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `warlevel-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
