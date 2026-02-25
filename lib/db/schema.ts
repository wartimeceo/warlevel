import Dexie, { Table } from "dexie";
import type {
  Profile,
  Progression,
  Stats,
  DailyLog,
  DayState,
  Incident,
  Quest,
  Trigger,
  Rule,
  NotificationItem,
  Loot,
  LevelCatalog,
  ArtifactCatalog,
  PerkCatalog,
  QuestTemplate,
  MicroQuestCatalog,
  BossTemplate,
  EvolutionSuggestion,
} from "../types";

export class WarLevelDB extends Dexie {
  profile!: Table<Profile, string>;
  progression!: Table<Progression, string>;
  stats!: Table<Stats, string>;
  daily_logs!: Table<DailyLog, string>;
  day_state!: Table<DayState, string>;
  incidents!: Table<Incident, string>;
  quests!: Table<Quest, string>;
  triggers!: Table<Trigger, string>;
  rules_engine!: Table<Rule, string>;
  notifications_queue!: Table<NotificationItem, string>;
  loot!: Table<Loot, string>;
  catalogs_levels!: Table<LevelCatalog, number>;
  catalogs_artifacts!: Table<ArtifactCatalog, string>;
  catalogs_perks!: Table<PerkCatalog, string>;
  catalogs_quest_templates!: Table<QuestTemplate, string>;
  catalogs_micro_quests!: Table<MicroQuestCatalog, string>;
  catalogs_boss_templates!: Table<BossTemplate, string>;
  evolution_suggestions!: Table<EvolutionSuggestion, string>;

  constructor() {
    super("WarLevelDB");
    this.version(1).stores({
      profile: "id",
      progression: "id",
      stats: "id",
      daily_logs: "id, date",
      day_state: "date",
      incidents: "id, dateTime",
      quests: "id, dateAssigned, status, type",
      triggers: "id, ifTag",
      rules_engine: "id, priority",
      notifications_queue: "id, delivered",
      loot: "id, date, lootType",
      catalogs_levels: "levelIndex",
      catalogs_artifacts: "id",
      catalogs_perks: "id",
      catalogs_quest_templates: "id, type",
      catalogs_micro_quests: "id",
      catalogs_boss_templates: "id",
      evolution_suggestions: "id, status",
    });
  }
}

let _db: WarLevelDB | null = null;

export function getDB(): WarLevelDB {
  if (typeof window === "undefined") {
    throw new Error("Dexie cannot be used server-side");
  }
  if (!_db) {
    _db = new WarLevelDB();
  }
  return _db;
}

// WarLevelDB is already exported as a class above
