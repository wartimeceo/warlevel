import { getDB } from "./schema";
import {
  SEED_LEVELS,
  SEED_QUEST_TEMPLATES,
  SEED_MICRO_QUESTS,
  SEED_ARTIFACTS,
  SEED_PERKS,
  SEED_BOSS_TEMPLATES,
  SEED_RULES,
  SEED_TRIGGERS,
  makeDefaultProfile,
  makeDefaultProgression,
  makeDefaultStats,
} from "./seed";

let initialized = false;

export async function initDB(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const db = getDB();

  // Check if already seeded
  const profileCount = await db.profile.count();
  if (profileCount > 0) return;

  // Seed all catalog tables and default records in one transaction
  await db.transaction(
    "rw",
    [
      db.profile,
      db.progression,
      db.stats,
      db.catalogs_levels,
      db.catalogs_artifacts,
      db.catalogs_perks,
      db.catalogs_quest_templates,
      db.catalogs_micro_quests,
      db.catalogs_boss_templates,
      db.rules_engine,
      db.triggers,
    ],
    async () => {
      await db.profile.put(makeDefaultProfile());
      await db.progression.put(makeDefaultProgression());
      await db.stats.put(makeDefaultStats());
      await db.catalogs_levels.bulkPut(SEED_LEVELS);
      await db.catalogs_artifacts.bulkPut(SEED_ARTIFACTS);
      await db.catalogs_perks.bulkPut(SEED_PERKS);
      await db.catalogs_quest_templates.bulkPut(SEED_QUEST_TEMPLATES);
      await db.catalogs_micro_quests.bulkPut(SEED_MICRO_QUESTS);
      await db.catalogs_boss_templates.bulkPut(SEED_BOSS_TEMPLATES);
      await db.rules_engine.bulkPut(SEED_RULES);
      await db.triggers.bulkPut(SEED_TRIGGERS);
    }
  );
}

export { getDB };
export * from "./schema";
