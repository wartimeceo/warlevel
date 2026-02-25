import { z } from "zod";
import { getDB } from "../db/schema";
import type { ExportSchema } from "../types";
import { SCHEMA_VERSION } from "../types";

// ============================================================
// WARLEVEL — Import JSON (validate + restore)
// ============================================================

// Zod schemas for validation
const ProfileSchema = z.object({
  id: z.literal("profile"),
  createdAt: z.number(),
  timezone: z.string(),
  wakeTime: z.string(),
  trainingWindowStart: z.string(),
  trainingWindowEnd: z.string(),
  shutdownTime: z.string(),
  bedDeadline: z.string(),
  signatureLine: z.string(),
  language: z.string(),
  difficultyMode: z.enum(["Normal", "Brutal"]),
  schemaVersion: z.number(),
});

const ProgressionSchema = z.object({
  id: z.literal("progression"),
  globalXP: z.number(),
  levelIndex: z.number().min(1).max(10),
  streakDays: z.number().min(0),
  corruption: z.number().min(0).max(100),
  mutationCount: z.number(),
  graceTokensRemaining: z.number().min(0).max(2),
  graceTokensResetMonth: z.string(),
  lastActiveDate: z.string(),
});

const DailyLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  energy: z.number().min(1).max(5),
  focus: z.number().min(1).max(5),
  chaos: z.number().min(1).max(5),
  friction: z.string(),
  avoided: z.string().optional(),
  proud: z.string().optional(),
  intention: z.string().optional(),
  createdAt: z.number(),
});

const QuestSchema = z.object({
  id: z.string(),
  dateAssigned: z.string(),
  title: z.string(),
  type: z.enum(["TRAINING", "SHUTDOWN", "DAILY", "SURPRISE", "RECOVERY", "SOVEREIGNTY", "EXECUTION", "PUNISHMENT", "BOSS", "WEEKLY"]),
  primaryStat: z.enum(["MENTAL", "PHYSICAL", "DISCIPLINE", "CREATION", "SOCIAL_DOMINANCE", "VISION_PRO", "EXECUTION", "VNS_RITUAL"]),
  difficulty: z.number().min(1).max(5),
  durationMin: z.number(),
  risk: z.enum(["LOW", "MED", "HIGH"]),
  xpReward: z.number(),
  statXPReward: z.record(z.number()),
  status: z.enum(["TODO", "DONE", "FAILED", "SKIPPED", "EXPIRED"]),
  createdBy: z.enum(["SYSTEM", "SEED"]),
  relatedIncidentId: z.string().nullable(),
  createdAt: z.number(),
  completedAt: z.number().nullable(),
});

const ExportSchema = z.object({
  schemaVersion: z.number(),
  exportedAt: z.number(),
  profile: ProfileSchema.optional(),
  progression: ProgressionSchema.optional(),
  stats: z.record(z.unknown()).optional(),
  daily_logs: z.array(DailyLogSchema).default([]),
  day_state: z.array(z.record(z.unknown())).default([]),
  incidents: z.array(z.record(z.unknown())).default([]),
  quests: z.array(QuestSchema).default([]),
  triggers: z.array(z.record(z.unknown())).default([]),
  rules_engine: z.array(z.record(z.unknown())).default([]),
  notifications_queue: z.array(z.record(z.unknown())).default([]),
  loot: z.array(z.record(z.unknown())).default([]),
  evolution_suggestions: z.array(z.record(z.unknown())).default([]),
});

export type ImportResult =
  | { success: true }
  | { success: false; error: string };

export async function importJSON(rawData: unknown): Promise<ImportResult> {
  // Validate
  const parsed = ExportSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: `Validation échouée: ${parsed.error.message.slice(0, 200)}`,
    };
  }

  const data = parsed.data;

  // Version check
  if (data.schemaVersion > SCHEMA_VERSION) {
    return {
      success: false,
      error: `Version du schéma incompatible: ${data.schemaVersion} > ${SCHEMA_VERSION}. Mettez à jour l'application.`,
    };
  }

  // Migrate if needed (v1 is current, no migration needed yet)
  // TODO Phase 2: add migration logic here when schemaVersion increments

  const db = getDB();

  // Restore all tables
  await db.transaction(
    "rw",
    [
      db.profile,
      db.progression,
      db.stats,
      db.daily_logs,
      db.day_state,
      db.incidents,
      db.quests,
      db.triggers,
      db.rules_engine,
      db.notifications_queue,
      db.loot,
      db.evolution_suggestions,
    ],
    async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data.profile) await db.profile.put(data.profile as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data.progression) await db.progression.put(data.progression as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data.stats) await db.stats.put(data.stats as any);

      if (data.daily_logs.length) {
        await db.daily_logs.clear();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.daily_logs.bulkPut(data.daily_logs as any[]);
      }
      if (data.day_state.length) {
        await db.day_state.clear();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.day_state.bulkPut(data.day_state as any[]);
      }
      if (data.incidents.length) {
        await db.incidents.clear();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.incidents.bulkPut(data.incidents as any[]);
      }
      if (data.quests.length) {
        await db.quests.clear();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.quests.bulkPut(data.quests as any[]);
      }
      if (data.evolution_suggestions.length) {
        await db.evolution_suggestions.clear();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.evolution_suggestions.bulkPut(data.evolution_suggestions as any[]);
      }
    }
  );

  return { success: true };
}
