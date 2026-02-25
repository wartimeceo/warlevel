// ============================================================
// WARLEVEL — Core TypeScript Types
// ============================================================

export type StatKey =
  | "MENTAL"
  | "PHYSICAL"
  | "DISCIPLINE"
  | "CREATION"
  | "SOCIAL_DOMINANCE"
  | "VISION_PRO"
  | "EXECUTION"
  | "VNS_RITUAL";

export const ALL_STATS: StatKey[] = [
  "MENTAL",
  "PHYSICAL",
  "DISCIPLINE",
  "CREATION",
  "SOCIAL_DOMINANCE",
  "VISION_PRO",
  "EXECUTION",
  "VNS_RITUAL",
];

export const STAT_LABELS: Record<StatKey, string> = {
  MENTAL: "Mental",
  PHYSICAL: "Physique",
  DISCIPLINE: "Discipline",
  CREATION: "Création",
  SOCIAL_DOMINANCE: "Dominance Sociale",
  VISION_PRO: "Vision Pro",
  EXECUTION: "Exécution",
  VNS_RITUAL: "Rituel VNS",
};

export type AutoMode = "NORMAL" | "SALVAGE" | "RECOVERY" | "BRUTAL";

export type QuestType =
  | "TRAINING"
  | "SHUTDOWN"
  | "DAILY"
  | "SURPRISE"
  | "RECOVERY"
  | "SOVEREIGNTY"
  | "EXECUTION"
  | "PUNISHMENT"
  | "BOSS"
  | "WEEKLY";

export type QuestStatus = "TODO" | "DONE" | "FAILED" | "SKIPPED" | "EXPIRED";

export type RiskLevel = "LOW" | "MED" | "HIGH";

export type Rarity = "COMMON" | "RARE" | "EPIC";

export type IncidentType =
  | "UNPLANNED"
  | "MISS"
  | "OVERLOAD"
  | "LOW_ENERGY"
  | "DERAIL"
  | "SOCIAL_FRICTION"
  | "BUSINESS_FIRE";

export type ImpactedWindow =
  | "TRAINING"
  | "DAY"
  | "SHUTDOWN"
  | "SLEEP"
  | "CONTENT"
  | "WORK";

export type ChosenResponse = "ADAPT" | "PUSH" | "RECOVER" | "RESCHEDULE";

export type SuggestionType =
  | "NEW_TEMPLATE"
  | "SIMPLIFY_UX"
  | "AUTOMATION"
  | "RULE_TWEAK"
  | "NEW_TRIGGER"
  | "NEW_ARTIFACT";

export type SuggestionStatus = "PROPOSED" | "ACCEPTED" | "REJECTED";

export type SuggestionSource =
  | "DATA_PATTERN"
  | "UX_FRICTION"
  | "MISSES"
  | "INCIDENTS";

// ---- Database Tables ----

export interface Profile {
  id: "profile";
  createdAt: number;
  timezone: string;
  wakeTime: string;
  trainingWindowStart: string;
  trainingWindowEnd: string;
  shutdownTime: string;
  bedDeadline: string;
  signatureLine: string;
  language: string;
  difficultyMode: "Normal" | "Brutal";
  schemaVersion: number;
}

export interface Progression {
  id: "progression";
  globalXP: number;
  levelIndex: number;
  streakDays: number;
  corruption: number;
  mutationCount: number;
  graceTokensRemaining: number;
  graceTokensResetMonth: string;
  lastActiveDate: string;
}

export interface Stats {
  id: "stats";
  MENTAL_score: number;
  MENTAL_xp: number;
  PHYSICAL_score: number;
  PHYSICAL_xp: number;
  DISCIPLINE_score: number;
  DISCIPLINE_xp: number;
  CREATION_score: number;
  CREATION_xp: number;
  SOCIAL_DOMINANCE_score: number;
  SOCIAL_DOMINANCE_xp: number;
  VISION_PRO_score: number;
  VISION_PRO_xp: number;
  EXECUTION_score: number;
  EXECUTION_xp: number;
  VNS_RITUAL_score: number;
  VNS_RITUAL_xp: number;
  blockingTags: Record<string, string>;
  updatedAt: number;
}

export interface DailyLog {
  id: string;
  date: string;
  energy: number;
  focus: number;
  chaos: number;
  friction: string;
  avoided?: string;
  proud?: string;
  intention?: string;
  createdAt: number;
}

export interface DayState {
  date: string;
  checkinDone: boolean;
  trainingDone: boolean;
  shutdownDone: boolean;
  contentDone: boolean;
  keyFailureTag: string | null;
  autoMode: AutoMode;
  top3QuestIds: string[];
  updatedAt: number;
}

export interface Incident {
  id: string;
  dateTime: number;
  type: IncidentType;
  summary: string;
  severity: number;
  impactedWindow: ImpactedWindow;
  chosenResponse: ChosenResponse;
  createdAt: number;
}

export interface Quest {
  id: string;
  dateAssigned: string;
  title: string;
  type: QuestType;
  primaryStat: StatKey;
  difficulty: number;
  durationMin: number;
  risk: RiskLevel;
  xpReward: number;
  statXPReward: Record<string, number>;
  status: QuestStatus;
  createdBy: "SYSTEM" | "SEED";
  relatedIncidentId: string | null;
  createdAt: number;
  completedAt: number | null;
}

export interface Trigger {
  id: string;
  name: string;
  ifTag: string;
  thenQuestTemplateId: string;
  enabled: boolean;
}

export interface Rule {
  id: string;
  name: string;
  condition: unknown;
  action: unknown;
  priority: number;
  enabled: boolean;
}

export interface NotificationItem {
  id: string;
  dateTime: number;
  kind: "REMINDER" | "WARNING" | "BOSS" | "LOOT" | "INCIDENT";
  message: string;
  delivered: boolean;
}

export interface Loot {
  id: string;
  date: string;
  lootType: "PERK" | "ARTIFACT";
  catalogId: string;
  active: boolean;
  createdAt: number;
  expiresAt: number | null;
}

export interface LevelCatalog {
  levelIndex: number;
  arcJP: string;
  arcFR: string;
  nameJP: string;
  nameFR: string;
  unlockTextFR: string;
  xpThreshold: number;
}

export interface ArtifactCatalog {
  id: string;
  nameJP: string;
  nameFR: string;
  ruleTextFR: string;
  durationDays: 3 | 5 | 7;
  linkedStat: StatKey;
  rarity: Rarity;
}

export interface PerkCatalog {
  id: string;
  nameFR: string;
  descFR: string;
  rarity: Rarity;
}

export interface QuestTemplate {
  id: string;
  titleFR: string;
  type: QuestType;
  primaryStat: StatKey;
  difficulty: number;
  durationMin: number;
  risk: RiskLevel;
  failureTags: string[];
}

export interface MicroQuestCatalog {
  id: string;
  titleFR: string;
  primaryStat: StatKey;
  durationMin: number;
  failureTags: string[];
}

export interface BossTemplate {
  id: string;
  titleFR: string;
  primaryStat: StatKey;
  difficulty: number;
  durationMin: number;
  risk: RiskLevel;
  xpReward: number;
  statXPReward: Record<string, number>;
}

export interface EvolutionSuggestion {
  id: string;
  dateTime: number;
  source: SuggestionSource;
  detectedPattern: string;
  suggestionType: SuggestionType;
  suggestionText: string;
  impact: "LOW" | "MED" | "HIGH";
  priority: number;
  status: SuggestionStatus;
  createdAt: number;
}

// ---- Export schema ----

export interface ExportSchema {
  schemaVersion: number;
  exportedAt: number;
  profile: Profile | undefined;
  progression: Progression | undefined;
  stats: Stats | undefined;
  daily_logs: DailyLog[];
  day_state: DayState[];
  incidents: Incident[];
  quests: Quest[];
  triggers: Trigger[];
  rules_engine: Rule[];
  notifications_queue: NotificationItem[];
  loot: Loot[];
  evolution_suggestions: EvolutionSuggestion[];
}

export const SCHEMA_VERSION = 1;

export const FAILURE_TAGS = [
  "avoidance_admin",
  "small_chiefs",
  "overthinking",
  "energy_leak",
  "distraction",
  "social_fear",
  "comfort_loop",
] as const;

export type FailureTag = (typeof FAILURE_TAGS)[number];
