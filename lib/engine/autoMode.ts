import { getDB } from "../db/schema";
import type { AutoMode } from "../types";
import { getCurrentTime, getPreviousDate } from "../utils/dates";

// ============================================================
// WARLEVEL — AutoMode State Machine (deterministic, locked)
// ============================================================

export async function computeAutoMode(date: string): Promise<AutoMode> {
  const db = getDB();
  const currentTime = getCurrentTime();
  const dayState = await db.day_state.get(date);
  const dailyLog = await db.daily_logs.where("date").equals(date).first();
  const progression = await db.progression.get("progression");

  // Rule: corruption >= 70 -> RECOVERY (forced, highest priority)
  if (progression && progression.corruption >= 70) return "RECOVERY";

  // Rule: time > 10:30 AND training not done -> SALVAGE
  if (currentTime > "10:30" && !dayState?.trainingDone) return "SALVAGE";

  // Rule: energy <= 2 in today's log -> RECOVERY
  if (dailyLog && dailyLog.energy <= 2) return "RECOVERY";

  // Rule: any incident severity >= 4 in last 12h -> RECOVERY
  const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
  const severeIncident = await db.incidents
    .where("dateTime")
    .above(twelveHoursAgo)
    .filter((i) => i.severity >= 4)
    .first();
  if (severeIncident) return "RECOVERY";

  // Rule: 2 consecutive missed trainings AND >= 3 quests skipped -> BRUTAL
  const yesterday = getPreviousDate(date);
  const dayBefore = getPreviousDate(yesterday);
  const ydState = await db.day_state.get(yesterday);
  const dbState = await db.day_state.get(dayBefore);

  if (ydState && !ydState.trainingDone && dbState && !dbState.trainingDone) {
    // Count skipped quests yesterday
    const yesterdaySkipped = await db.quests
      .where("dateAssigned")
      .equals(yesterday)
      .filter((q) => q.status === "SKIPPED")
      .count();
    if (yesterdaySkipped >= 3) return "BRUTAL";
  }

  return "NORMAL";
}

export async function updateDayStateAutoMode(date: string): Promise<AutoMode> {
  const db = getDB();
  const mode = await computeAutoMode(date);
  const existing = await db.day_state.get(date);
  if (existing) {
    await db.day_state.update(date, { autoMode: mode, updatedAt: Date.now() });
  } else {
    await db.day_state.put({
      date,
      checkinDone: false,
      trainingDone: false,
      shutdownDone: false,
      contentDone: false,
      keyFailureTag: null,
      autoMode: mode,
      top3QuestIds: [],
      updatedAt: Date.now(),
    });
  }
  return mode;
}
