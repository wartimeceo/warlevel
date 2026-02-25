import { getDB } from "../db/schema";
import type { Quest, QuestTemplate, DailyLog, StatKey } from "../types";
import { SeededRandom, hashDate, generateId } from "../utils/deterministic";
import { getCurrentTime, getTodayDate, getPreviousDate, isOlderThan48h } from "../utils/dates";
import { computeAutoMode } from "./autoMode";
import { calculateQuestXP, calculateStatXPAllocation } from "./xpEngine";
import { generateSalvageQuests } from "./salvagePlanner";

// ============================================================
// WARLEVEL — Quest Generation Engine (deterministic, locked)
// ============================================================

const QUEST_PRIORITY: Record<string, number> = {
  TRAINING: 0,
  BOSS: 1,
  SOVEREIGNTY: 2,
  EXECUTION: 3,
  DAILY: 4,
  SURPRISE: 5,
  RECOVERY: 6,
  PUNISHMENT: 7,
  WEEKLY: 8,
  SHUTDOWN: 9,
};

function makeQuestFromTemplate(template: QuestTemplate, date: string): Quest {
  const xpReward = calculateQuestXP(template.difficulty, template.risk, false);
  return {
    id: generateId(),
    dateAssigned: date,
    title: template.titleFR,
    type: template.type,
    primaryStat: template.primaryStat,
    difficulty: template.difficulty,
    durationMin: template.durationMin,
    risk: template.risk,
    xpReward,
    statXPReward: calculateStatXPAllocation(template),
    status: "TODO",
    createdBy: "SYSTEM",
    relatedIncidentId: null,
    createdAt: Date.now(),
    completedAt: null,
  };
}

function inferFailureTag(dailyLog: DailyLog | undefined): string | null {
  if (!dailyLog) return null;
  const text = `${dailyLog.friction} ${dailyLog.avoided ?? ""}`.toLowerCase();
  if (text.includes("admin") || text.includes("mail")) return "avoidance_admin";
  if (text.includes("chef") || text.includes("réunion") || text.includes("reunion")) return "small_chiefs";
  if (text.includes("distract") || text.includes("téléphone") || text.includes("telephone")) return "distraction";
  if (text.includes("énergie") || text.includes("energie") || text.includes("fatigue")) return "energy_leak";
  if (text.includes("peur") || text.includes("social")) return "social_fear";
  if (text.includes("confort") || text.includes("facile") || text.includes("confortable")) return "comfort_loop";
  if (text.includes("pens") || text.includes("analyse") || text.includes("trop réfléchi")) return "overthinking";
  return null;
}

async function expireOldQuests(): Promise<void> {
  const db = getDB();
  const todos = await db.quests.where("status").equals("TODO").toArray();
  const toExpire = todos.filter((q) => isOlderThan48h(q.createdAt));
  for (const q of toExpire) {
    await db.quests.update(q.id, { status: "EXPIRED" });
  }
}

async function refreshTop3(date: string): Promise<void> {
  const db = getDB();
  const autoMode = await computeAutoMode(date);
  const quests = await db.quests
    .where("dateAssigned")
    .equals(date)
    .filter((q) => q.status === "TODO")
    .toArray();

  const sorted = [...quests].sort(
    (a, b) => (QUEST_PRIORITY[a.type] ?? 5) - (QUEST_PRIORITY[b.type] ?? 5)
  );
  const top3 = sorted.slice(0, 3).map((q) => q.id);

  await db.day_state.update(date, {
    top3QuestIds: top3,
    autoMode,
    updatedAt: Date.now(),
  });
}

export async function generateDailyQuests(date: string): Promise<void> {
  const db = getDB();
  await expireOldQuests();

  const autoMode = await computeAutoMode(date);
  const dayState = await db.day_state.get(date);
  const dailyLog = await db.daily_logs.where("date").equals(date).first();
  const stats = await db.stats.get("stats");
  const progression = await db.progression.get("progression");
  const templates = await db.catalogs_quest_templates.toArray();

  // Check if quests already generated today
  const existingTodos = await db.quests
    .where("dateAssigned")
    .equals(date)
    .filter((q) => q.status === "TODO" || q.status === "DONE")
    .count();

  if (existingTodos > 0) {
    await refreshTop3(date);
    return;
  }

  const rng = new SeededRandom(hashDate(date));
  const currentTime = getCurrentTime();
  const quests: Quest[] = [];

  // --- SALVAGE MODE ---
  if (autoMode === "SALVAGE") {
    const salvageQuests = await generateSalvageQuests(date, true);
    await db.quests.bulkAdd(salvageQuests);

    const top3 = salvageQuests.slice(0, 3).map((q) => q.id);
    await upsertDayState(db, date, autoMode, top3);
    return;
  }

  // --- STANDARD GENERATION ---

  // 1. TRAINING quest
  const trainingTemplates = templates.filter((t) => t.type === "TRAINING");
  const trainingTemplate = rng.pickOrNull(trainingTemplates);
  if (trainingTemplate) quests.push(makeQuestFromTemplate(trainingTemplate, date));

  // 2. SHUTDOWN quest
  const shutdownTemplates = templates.filter((t) => t.type === "SHUTDOWN");
  const shutdownTemplate = rng.pickOrNull(shutdownTemplates);
  if (shutdownTemplate) quests.push(makeQuestFromTemplate(shutdownTemplate, date));

  // 3. 3 DAILY quests (shuffled for variety)
  const dailyTemplates = rng.shuffle(templates.filter((t) => t.type === "DAILY"));
  const pickedDaily = dailyTemplates.slice(0, 3);
  for (const t of pickedDaily) quests.push(makeQuestFromTemplate(t, date));

  // 4. SURPRISE quest (targets keyFailureTag)
  const keyFailureTag =
    dayState?.keyFailureTag ?? inferFailureTag(dailyLog);
  let surpriseTemplates = keyFailureTag
    ? templates.filter((t) => t.failureTags.includes(keyFailureTag))
    : templates.filter((t) => t.type === "SURPRISE");
  if (surpriseTemplates.length === 0) {
    surpriseTemplates = templates.filter((t) => t.type === "SURPRISE");
  }
  const surpriseTemplate = rng.pickOrNull(surpriseTemplates);
  if (surpriseTemplate) {
    const sq = makeQuestFromTemplate(surpriseTemplate, date);
    sq.type = "SURPRISE";
    quests.push(sq);
  }

  // --- CONDITIONAL ADD-ONS (max 7 visible) ---
  const conditionals: Quest[] = [];

  // No daily_log by 13:00 -> "Scan Now" micro quest
  if (!dailyLog && currentTime > "13:00") {
    conditionals.push({
      id: generateId(),
      dateAssigned: date,
      title: "Scan rapide — 2 min",
      type: "DAILY",
      primaryStat: "MENTAL",
      difficulty: 1,
      durationMin: 2,
      risk: "LOW",
      xpReward: calculateQuestXP(1, "LOW", false),
      statXPReward: { MENTAL: 12, DISCIPLINE: 10 },
      status: "TODO",
      createdBy: "SYSTEM",
      relatedIncidentId: null,
      createdAt: Date.now(),
      completedAt: null,
    });
  }

  // CREATION_score < 50 or no contentDone
  if (stats && (stats.CREATION_score < 50 || !dayState?.contentDone)) {
    const cTemplates = templates.filter(
      (t) => t.type === "EXECUTION" || t.primaryStat === "CREATION"
    );
    const ct = rng.pickOrNull(cTemplates);
    if (ct) conditionals.push(makeQuestFromTemplate(ct, date));
  }

  // SOCIAL_DOMINANCE_score < 50 or keyFailureTag = small_chiefs
  if (
    stats &&
    (stats.SOCIAL_DOMINANCE_score < 50 || keyFailureTag === "small_chiefs")
  ) {
    const sTemplates = templates.filter((t) => t.type === "SOVEREIGNTY");
    const st = rng.pickOrNull(sTemplates);
    if (st) conditionals.push(makeQuestFromTemplate(st, date));
  }

  // Corruption > 35 or energy <= 2
  if (
    progression &&
    (progression.corruption > 35 || (dailyLog && dailyLog.energy <= 2))
  ) {
    const rTemplates = templates.filter((t) => t.type === "RECOVERY");
    const rt = rng.pickOrNull(rTemplates);
    if (rt) conditionals.push(makeQuestFromTemplate(rt, date));
  }

  // 2 consecutive missed trainings -> PUNISHMENT
  const yesterday = getPreviousDate(date);
  const dayBefore = getPreviousDate(yesterday);
  const ydState = await db.day_state.get(yesterday);
  const dbState = await db.day_state.get(dayBefore);
  if (ydState && !ydState.trainingDone && dbState && !dbState.trainingDone) {
    const pTemplates = templates.filter((t) => t.type === "PUNISHMENT");
    const pt = rng.pickOrNull(pTemplates);
    if (pt) conditionals.push(makeQuestFromTemplate(pt, date));
  }

  // BUSINESS_FIRE incident -> VISION_PRO
  const recentBusinessFire = await db.incidents
    .filter(
      (i) =>
        i.type === "BUSINESS_FIRE" &&
        i.dateTime > Date.now() - 24 * 60 * 60 * 1000
    )
    .first();
  if (recentBusinessFire) {
    const vTemplates = templates.filter((t) => t.primaryStat === "VISION_PRO");
    const vt = rng.pickOrNull(vTemplates);
    if (vt) {
      const vq = makeQuestFromTemplate(vt, date);
      vq.title = "Décision Verrouillée — 15 min";
      vq.durationMin = 15;
      conditionals.push(vq);
    }
  }

  // Apply cap of 7
  for (const cq of conditionals) {
    if (quests.length >= 7) break;
    quests.push(cq);
  }

  await db.quests.bulkAdd(quests);

  const sorted = [...quests].sort(
    (a, b) => (QUEST_PRIORITY[a.type] ?? 5) - (QUEST_PRIORITY[b.type] ?? 5)
  );
  const top3 = sorted.slice(0, 3).map((q) => q.id);
  await upsertDayState(db, date, autoMode, top3);
}

async function upsertDayState(
  db: ReturnType<typeof getDB>,
  date: string,
  autoMode: import("../types").AutoMode,
  top3: string[]
): Promise<void> {
  const existing = await db.day_state.get(date);
  if (existing) {
    await db.day_state.update(date, {
      top3QuestIds: top3,
      autoMode,
      updatedAt: Date.now(),
    });
  } else {
    await db.day_state.put({
      date,
      checkinDone: false,
      trainingDone: false,
      shutdownDone: false,
      contentDone: false,
      keyFailureTag: null,
      autoMode,
      top3QuestIds: top3,
      updatedAt: Date.now(),
    });
  }
}

export async function addIncidentQuest(
  date: string,
  incidentId: string,
  failureTag: string
): Promise<void> {
  const db = getDB();
  const microQuests = await db.catalogs_micro_quests
    .filter((mq) => mq.failureTags.includes(failureTag))
    .toArray();

  if (microQuests.length === 0) return;

  const rng = new SeededRandom(hashDate(date) + Date.now());
  const template = rng.pick(microQuests);

  const quest: Quest = {
    id: generateId(),
    dateAssigned: date,
    title: template.titleFR,
    type: "RECOVERY",
    primaryStat: template.primaryStat,
    difficulty: 1,
    durationMin: template.durationMin,
    risk: "LOW",
    xpReward: calculateQuestXP(1, "LOW", false),
    statXPReward: calculateStatXPAllocation({ primaryStat: template.primaryStat, difficulty: 1, type: "RECOVERY" }),
    status: "TODO",
    createdBy: "SYSTEM",
    relatedIncidentId: incidentId,
    createdAt: Date.now(),
    completedAt: null,
  };

  await db.quests.add(quest);

  // Update top3 to include this urgent quest
  const dayState = await db.day_state.get(date);
  if (dayState) {
    const autoMode = await computeAutoMode(date);
    const existingTop3 = dayState.top3QuestIds;
    // Insert at beginning, remove last if over 3
    const newTop3 = [quest.id, ...existingTop3].slice(0, 3);
    await db.day_state.update(date, {
      top3QuestIds: newTop3,
      autoMode,
      updatedAt: Date.now(),
    });
  }
}

export async function getTodayQuests(date: string): Promise<Quest[]> {
  const db = getDB();
  const quests = await db.quests
    .where("dateAssigned")
    .equals(date)
    .filter((q) => q.status !== "EXPIRED")
    .toArray();
  return quests.sort(
    (a, b) => (QUEST_PRIORITY[a.type] ?? 5) - (QUEST_PRIORITY[b.type] ?? 5)
  );
}

export async function getExpiredQuests(): Promise<Quest[]> {
  const db = getDB();
  return db.quests.where("status").equals("EXPIRED").toArray();
}
