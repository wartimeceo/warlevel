import { getDB } from "../db/schema";
import type { Quest, Stats, StatKey } from "../types";

// ============================================================
// WARLEVEL — XP Engine (locked formulas from spec)
// ============================================================

const RISK_BONUS: Record<string, number> = { LOW: 0, MED: 10, HIGH: 25 };

export function calculateQuestXP(
  difficulty: number,
  risk: string,
  completedWithinTime: boolean
): number {
  const base = difficulty * 20;
  const riskBonus = RISK_BONUS[risk] ?? 0;
  const timeBonus = completedWithinTime ? 5 : 0;
  return base + riskBonus + timeBonus;
}

export function calculateStatXPAllocation(
  quest: Pick<Quest, "primaryStat" | "difficulty" | "type">
): Record<string, number> {
  const base = quest.difficulty * 20;
  const result: Record<string, number> = {};

  // Primary stat gets 60% of base
  const primaryAmount = Math.floor(base * 0.6);
  result[quest.primaryStat] = (result[quest.primaryStat] ?? 0) + primaryAmount;

  // DISCIPLINE always gets +10
  result["DISCIPLINE"] = (result["DISCIPLINE"] ?? 0) + 10;

  // MENTAL gets +5 when a SOVEREIGNTY quest is DONE
  if (quest.type === "SOVEREIGNTY") {
    result["MENTAL"] = (result["MENTAL"] ?? 0) + 5;
  }

  return result;
}

export async function applyQuestDone(questId: string): Promise<void> {
  const db = getDB();
  const quest = await db.quests.get(questId);
  if (!quest || quest.status === "DONE") return;

  const now = Date.now();
  const elapsedMin = (now - quest.createdAt) / (1000 * 60);
  const completedWithinTime = elapsedMin <= quest.durationMin + 5; // 5 min grace

  const xp = calculateQuestXP(quest.difficulty, quest.risk, completedWithinTime);
  const statXP = calculateStatXPAllocation(quest);

  await db.quests.update(questId, {
    status: "DONE",
    completedAt: now,
    xpReward: xp,
    statXPReward: statXP,
  });

  // Update global XP
  const progression = await db.progression.get("progression");
  if (progression) {
    await db.progression.update("progression", {
      globalXP: progression.globalXP + xp,
    });
  }

  // Update stats XP and score
  const stats = await db.stats.get("stats");
  if (stats) {
    const updates: Partial<Stats> & { updatedAt: number } = { updatedAt: now };
    for (const [stat, xpAmount] of Object.entries(statXP)) {
      const k = stat as StatKey;
      const xpKey = `${k}_xp` as keyof Stats;
      const scoreKey = `${k}_score` as keyof Stats;
      const currentXP = (stats[xpKey] as number) ?? 0;
      const currentScore = (stats[scoreKey] as number) ?? 0;
      (updates as Record<string, unknown>)[xpKey] = currentXP + xpAmount;
      (updates as Record<string, unknown>)[scoreKey] = Math.min(
        100,
        currentScore + Math.floor(xpAmount / 10)
      );
    }
    await db.stats.update("stats", updates);
  }

  // Update day_state
  const todayDate = quest.dateAssigned;
  const dayState = await db.day_state.get(todayDate);
  if (dayState) {
    const isTraining = quest.type === "TRAINING";
    const isShutdown = quest.type === "SHUTDOWN";
    const isContent =
      quest.type === "EXECUTION" || quest.primaryStat === "CREATION";
    await db.day_state.update(todayDate, {
      trainingDone: isTraining ? true : dayState.trainingDone,
      shutdownDone: isShutdown ? true : dayState.shutdownDone,
      contentDone: isContent ? true : dayState.contentDone,
      updatedAt: now,
    });
  }
}

export async function applyQuestFailed(questId: string): Promise<void> {
  const db = getDB();
  const quest = await db.quests.get(questId);
  if (!quest) return;

  // Failed: grants half statXP only (no globalXP)
  const statXP = calculateStatXPAllocation(quest);
  const halfStatXP: Record<string, number> = {};
  for (const [k, v] of Object.entries(statXP)) {
    halfStatXP[k] = Math.floor(v / 2);
  }

  await db.quests.update(questId, {
    status: "FAILED",
    completedAt: Date.now(),
    statXPReward: halfStatXP,
  });

  // Apply half stat XP
  const stats = await db.stats.get("stats");
  if (stats) {
    const updates: Partial<Stats> & { updatedAt: number } = { updatedAt: Date.now() };
    for (const [stat, xpAmount] of Object.entries(halfStatXP)) {
      const k = stat as StatKey;
      const xpKey = `${k}_xp` as keyof Stats;
      const currentXP = (stats[xpKey] as number) ?? 0;
      (updates as Record<string, unknown>)[xpKey] = currentXP + xpAmount;
    }
    await db.stats.update("stats", updates);
  }
}

export async function applyQuestSkipped(questId: string): Promise<void> {
  const db = getDB();
  await db.quests.update(questId, { status: "SKIPPED", completedAt: Date.now() });
}
