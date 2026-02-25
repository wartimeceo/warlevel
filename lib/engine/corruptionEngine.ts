import { getDB } from "../db/schema";

// ============================================================
// WARLEVEL — Corruption Engine (locked deltas from spec)
// ============================================================

export type CorruptionTrigger =
  | "MISS_TRAINING"       // +8
  | "MISS_SHUTDOWN"       // +5
  | "FAILED_QUEST"        // +4
  | "SKIPPED_QUEST"       // +3
  | "BOSS_FAILED"         // +15
  | "TRAINING_DONE"       // -10
  | "SHUTDOWN_DONE"       // -6
  | "RECOVERY_DONE";      // -12

const CORRUPTION_DELTAS: Record<CorruptionTrigger, number> = {
  MISS_TRAINING: 8,
  MISS_SHUTDOWN: 5,
  FAILED_QUEST: 4,
  SKIPPED_QUEST: 3,
  BOSS_FAILED: 15,
  TRAINING_DONE: -10,
  SHUTDOWN_DONE: -6,
  RECOVERY_DONE: -12,
};

export async function applyCorruptionTrigger(trigger: CorruptionTrigger): Promise<number> {
  const db = getDB();
  const progression = await db.progression.get("progression");
  if (!progression) return 0;

  const delta = CORRUPTION_DELTAS[trigger];
  const newCorruption = Math.max(0, Math.min(100, progression.corruption + delta));
  await db.progression.update("progression", { corruption: newCorruption });
  return newCorruption;
}

export async function getCorruption(): Promise<number> {
  const db = getDB();
  const p = await db.progression.get("progression");
  return p?.corruption ?? 0;
}
