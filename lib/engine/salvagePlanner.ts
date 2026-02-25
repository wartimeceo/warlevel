import { getDB } from "../db/schema";
import type { Quest, QuestTemplate } from "../types";
import { SeededRandom, hashDate, generateId } from "../utils/deterministic";
import { calculateQuestXP, calculateStatXPAllocation } from "./xpEngine";

// ============================================================
// WARLEVEL — Salvage Planner (locked structure from spec)
// ============================================================

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

export async function generateSalvageQuests(
  date: string,
  trainingMissed: boolean
): Promise<Quest[]> {
  const db = getDB();
  const rng = new SeededRandom(hashDate(date) + 999);
  const templates = await db.catalogs_quest_templates.toArray();

  const salvageQuests: Quest[] = [];

  // 1. RECOVERY quest (10–20 min)
  const recoveryTemplates = templates.filter(
    (t) => t.type === "RECOVERY" && t.durationMin >= 10 && t.durationMin <= 20
  );
  const recoveryTemplate = rng.pickOrNull(recoveryTemplates);
  if (recoveryTemplate) salvageQuests.push(makeQuestFromTemplate(recoveryTemplate, date));

  // 2. EXECUTION quest (10–20 min)
  const executionTemplates = templates.filter(
    (t) =>
      (t.type === "EXECUTION" || t.type === "DAILY") &&
      t.durationMin >= 10 &&
      t.durationMin <= 20
  );
  const executionTemplate = rng.pickOrNull(executionTemplates);
  if (executionTemplate) salvageQuests.push(makeQuestFromTemplate(executionTemplate, date));

  // 3. VNS_RITUAL or SOCIAL_DOMINANCE quest (10–20 min)
  const vnsOrSocial = templates.filter(
    (t) =>
      (t.primaryStat === "VNS_RITUAL" || t.primaryStat === "SOCIAL_DOMINANCE") &&
      t.durationMin >= 10 &&
      t.durationMin <= 20
  );
  const thirdTemplate = rng.pickOrNull(vnsOrSocial);
  if (thirdTemplate) salvageQuests.push(makeQuestFromTemplate(thirdTemplate, date));

  // 4. If training missed, add TRAINING replacement and remove lowest priority
  if (trainingMissed && salvageQuests.length >= 3) {
    const microTraining: Quest = {
      id: generateId(),
      dateAssigned: date,
      title: "Micro Training 12 min",
      type: "TRAINING",
      primaryStat: "PHYSICAL",
      difficulty: 2,
      durationMin: 12,
      risk: "MED",
      xpReward: calculateQuestXP(2, "MED", false),
      statXPReward: { PHYSICAL: 24, DISCIPLINE: 10 },
      status: "TODO",
      createdBy: "SYSTEM",
      relatedIncidentId: null,
      createdAt: Date.now(),
      completedAt: null,
    };
    // Remove last to keep max 3 (spec: add training, remove one to keep <=7 total but top3 = these)
    salvageQuests.pop();
    salvageQuests.unshift(microTraining);
  }

  return salvageQuests;
}
