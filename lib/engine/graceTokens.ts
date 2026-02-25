import { getDB } from "../db/schema";
import { getCurrentMonth } from "../utils/dates";

// ============================================================
// WARLEVEL — Grace Tokens (2/month, locked logic)
// ============================================================

export async function checkAndResetGraceTokens(): Promise<void> {
  const db = getDB();
  const progression = await db.progression.get("progression");
  if (!progression) return;

  const currentMonth = getCurrentMonth();
  if (progression.graceTokensResetMonth !== currentMonth) {
    await db.progression.update("progression", {
      graceTokensRemaining: 2,
      graceTokensResetMonth: currentMonth,
    });
  }
}

export async function useGraceToken(date: string): Promise<boolean> {
  const db = getDB();
  await checkAndResetGraceTokens();

  const progression = await db.progression.get("progression");
  if (!progression || progression.graceTokensRemaining <= 0) return false;

  await db.progression.update("progression", {
    graceTokensRemaining: progression.graceTokensRemaining - 1,
  });

  // Mark streak preserved for the day
  const dayState = await db.day_state.get(date);
  if (dayState) {
    await db.day_state.update(date, {
      updatedAt: Date.now(),
    });
  }

  // Log token use as a notification
  await db.notifications_queue.add({
    id: `grace-token-${Date.now()}`,
    dateTime: Date.now(),
    kind: "WARNING",
    message: `Token de grâce utilisé pour le ${date}. Streak préservé.`,
    delivered: false,
  });

  return true;
}

export async function getGraceTokensRemaining(): Promise<number> {
  const db = getDB();
  await checkAndResetGraceTokens();
  const progression = await db.progression.get("progression");
  return progression?.graceTokensRemaining ?? 0;
}
