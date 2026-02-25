import { getDB } from "../db/schema";

// ============================================================
// WARLEVEL — Level Engine (locked conditions from spec)
// ============================================================

// Streak requirements mapped to level
const STREAK_REQUIREMENTS: Record<number, number> = {
  2: 7, 3: 7, 4: 14, 5: 14, 6: 21, 7: 21, 8: 21, 9: 30, 10: 30,
};

export async function checkAndApplyLevelUp(): Promise<boolean> {
  const db = getDB();
  const progression = await db.progression.get("progression");
  if (!progression) return false;

  const nextLevel = progression.levelIndex + 1;
  if (nextLevel > 10) return false;

  const nextLevelData = await db.catalogs_levels.get(nextLevel);
  if (!nextLevelData) return false;

  // Condition 1: globalXP >= threshold
  if (progression.globalXP < nextLevelData.xpThreshold) return false;

  // Condition 2: corruption < 70
  if (progression.corruption >= 70) return false;

  // Condition 3: boss quest in last 7 days OR streak met
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentBoss = await db.quests
    .where("type")
    .equals("BOSS")
    .filter(
      (q) =>
        q.status === "DONE" &&
        q.completedAt !== null &&
        q.completedAt >= sevenDaysAgo
    )
    .first();

  const requiredStreak = STREAK_REQUIREMENTS[nextLevel] ?? 7;
  const hasQualified = !!recentBoss || progression.streakDays >= requiredStreak;
  if (!hasQualified) return false;

  await db.progression.update("progression", { levelIndex: nextLevel });
  return true;
}

export async function getCurrentLevel(): Promise<{
  levelIndex: number;
  nameJP: string;
  nameFR: string;
  arcJP: string;
  arcFR: string;
  xpThreshold: number;
  nextThreshold: number | null;
  globalXP: number;
}> {
  const db = getDB();
  const progression = await db.progression.get("progression");
  const levelIndex = progression?.levelIndex ?? 1;
  const globalXP = progression?.globalXP ?? 0;

  const levelData = await db.catalogs_levels.get(levelIndex);
  const nextLevelData = await db.catalogs_levels.get(levelIndex + 1);

  return {
    levelIndex,
    nameJP: levelData?.nameJP ?? "目覚め",
    nameFR: levelData?.nameFR ?? "Éveil",
    arcJP: levelData?.arcJP ?? "覚醒",
    arcFR: levelData?.arcFR ?? "Éveil",
    xpThreshold: levelData?.xpThreshold ?? 0,
    nextThreshold: nextLevelData?.xpThreshold ?? null,
    globalXP,
  };
}
