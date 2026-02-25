import type {
  Profile,
  Progression,
  Stats,
  LevelCatalog,
  ArtifactCatalog,
  PerkCatalog,
  QuestTemplate,
  MicroQuestCatalog,
  BossTemplate,
  Rule,
  Trigger,
} from "../types";
import { SCHEMA_VERSION } from "../types";
import { getTodayDate, getCurrentMonth } from "../utils/dates";

// ============================================================
// LEVELS — 10 exact levels from spec
// ============================================================
export const SEED_LEVELS: LevelCatalog[] = [
  { levelIndex: 1, arcJP: "覚醒", arcFR: "Éveil", nameJP: "目覚め", nameFR: "Éveil", unlockTextFR: "Le voyage commence. Chaque action compte.", xpThreshold: 0 },
  { levelIndex: 2, arcJP: "覚醒", arcFR: "Éveil", nameJP: "影歩き", nameFR: "Marcheur de l'ombre", unlockTextFR: "Tu opères dans l'ombre. Invisible mais présent.", xpThreshold: 120 },
  { levelIndex: 3, arcJP: "覚醒", arcFR: "Éveil", nameJP: "規律者", nameFR: "Discipliné", unlockTextFR: "La discipline remplace l'impulsion. Chaque jour tenu.", xpThreshold: 300 },
  { levelIndex: 4, arcJP: "鍛錬", arcFR: "Forge", nameJP: "執行者", nameFR: "Exécuteur", unlockTextFR: "Les intentions deviennent des actes. Sans exception.", xpThreshold: 520 },
  { levelIndex: 5, arcJP: "鍛錬", arcFR: "Forge", nameJP: "支配者", nameFR: "Dominant", unlockTextFR: "Tu contrôles l'environnement. Pas l'inverse.", xpThreshold: 800 },
  { levelIndex: 6, arcJP: "鍛錬", arcFR: "Forge", nameJP: "戦略家", nameFR: "Stratège", unlockTextFR: "Chaque décision est calculée. Chaque mouvement a un but.", xpThreshold: 1150 },
  { levelIndex: 7, arcJP: "支配", arcFR: "Domination", nameJP: "覚醒王", nameFR: "Roi éveillé", unlockTextFR: "L'éveil est total. Tu vois ce que les autres ignorent.", xpThreshold: 1550 },
  { levelIndex: 8, arcJP: "支配", arcFR: "Domination", nameJP: "異端者", nameFR: "Anomalie", unlockTextFR: "Tu es hors norme. Le système standard ne s'applique plus.", xpThreshold: 1950 },
  { levelIndex: 9, arcJP: "支配", arcFR: "Domination", nameJP: "深淵王", nameFR: "Roi de l'abîme", unlockTextFR: "Tu as regardé dans l'abîme. L'abîme a reculé.", xpThreshold: 2400 },
  { levelIndex: 10, arcJP: "支配", arcFR: "Domination", nameJP: "戦神", nameFR: "Dieu de guerre", unlockTextFR: "Stade final. La guerre est ton état naturel.", xpThreshold: 2900 },
];

// ============================================================
// QUEST TEMPLATES — 25 templates
// ============================================================
export const SEED_QUEST_TEMPLATES: QuestTemplate[] = [
  // TRAINING (3)
  { id: "qt-training-combat", titleFR: "Protocole Combat Matinal", type: "TRAINING", primaryStat: "PHYSICAL", difficulty: 3, durationMin: 60, risk: "HIGH", failureTags: ["comfort_loop", "energy_leak"] },
  { id: "qt-training-micro", titleFR: "Micro Combat 30 min", type: "TRAINING", primaryStat: "PHYSICAL", difficulty: 2, durationMin: 30, risk: "MED", failureTags: ["energy_leak"] },
  { id: "qt-training-mental", titleFR: "Formation Mentale Matinale", type: "TRAINING", primaryStat: "MENTAL", difficulty: 3, durationMin: 45, risk: "MED", failureTags: ["distraction", "overthinking"] },
  // SHUTDOWN (2)
  { id: "qt-shutdown-audit", titleFR: "Audit Crépuscule", type: "SHUTDOWN", primaryStat: "DISCIPLINE", difficulty: 2, durationMin: 30, risk: "LOW", failureTags: ["avoidance_admin"] },
  { id: "qt-shutdown-journal", titleFR: "Journal de Clôture", type: "SHUTDOWN", primaryStat: "MENTAL", difficulty: 1, durationMin: 15, risk: "LOW", failureTags: [] },
  // DAILY (8)
  { id: "qt-daily-execution", titleFR: "Bloc Exécution 30 min", type: "DAILY", primaryStat: "EXECUTION", difficulty: 3, durationMin: 30, risk: "MED", failureTags: ["comfort_loop", "distraction"] },
  { id: "qt-daily-deep-work", titleFR: "Travail Profond 45 min", type: "DAILY", primaryStat: "MENTAL", difficulty: 4, durationMin: 45, risk: "HIGH", failureTags: ["overthinking", "distraction"] },
  { id: "qt-daily-creation", titleFR: "Bloc Création", type: "DAILY", primaryStat: "CREATION", difficulty: 3, durationMin: 30, risk: "MED", failureTags: ["comfort_loop"] },
  { id: "qt-daily-vns", titleFR: "Rituel VNS", type: "DAILY", primaryStat: "VNS_RITUAL", difficulty: 2, durationMin: 30, risk: "LOW", failureTags: [] },
  { id: "qt-daily-vision", titleFR: "Vision Pro 20 min", type: "DAILY", primaryStat: "VISION_PRO", difficulty: 3, durationMin: 20, risk: "MED", failureTags: ["overthinking"] },
  { id: "qt-daily-admin", titleFR: "Blitz Admin", type: "DAILY", primaryStat: "DISCIPLINE", difficulty: 2, durationMin: 20, risk: "LOW", failureTags: ["avoidance_admin"] },
  { id: "qt-daily-signal", titleFR: "Signal Contenu", type: "DAILY", primaryStat: "CREATION", difficulty: 2, durationMin: 15, risk: "LOW", failureTags: ["comfort_loop"] },
  { id: "qt-daily-focus", titleFR: "Audit Focus", type: "DAILY", primaryStat: "MENTAL", difficulty: 2, durationMin: 20, risk: "LOW", failureTags: ["distraction"] },
  // SURPRISE (2)
  { id: "qt-surprise-decision", titleFR: "Décision Verrouillée", type: "SURPRISE", primaryStat: "VISION_PRO", difficulty: 4, durationMin: 15, risk: "HIGH", failureTags: ["overthinking"] },
  { id: "qt-surprise-target", titleFR: "Cible du Jour", type: "SURPRISE", primaryStat: "EXECUTION", difficulty: 3, durationMin: 20, risk: "MED", failureTags: ["distraction", "avoidance_admin"] },
  // RECOVERY (3)
  { id: "qt-recovery-active", titleFR: "Récupération Active", type: "RECOVERY", primaryStat: "PHYSICAL", difficulty: 1, durationMin: 15, risk: "LOW", failureTags: ["energy_leak"] },
  { id: "qt-recovery-mental", titleFR: "Reset Mental", type: "RECOVERY", primaryStat: "MENTAL", difficulty: 1, durationMin: 10, risk: "LOW", failureTags: ["overthinking"] },
  { id: "qt-recovery-vns", titleFR: "Protocole Récupération VNS", type: "RECOVERY", primaryStat: "VNS_RITUAL", difficulty: 2, durationMin: 20, risk: "LOW", failureTags: ["energy_leak"] },
  // SOVEREIGNTY (4)
  { id: "qt-sov-territory", titleFR: "Souveraineté Territoire", type: "SOVEREIGNTY", primaryStat: "SOCIAL_DOMINANCE", difficulty: 3, durationMin: 20, risk: "MED", failureTags: ["small_chiefs", "social_fear"] },
  { id: "qt-sov-dominant-call", titleFR: "Appel Dominant", type: "SOVEREIGNTY", primaryStat: "SOCIAL_DOMINANCE", difficulty: 4, durationMin: 20, risk: "HIGH", failureTags: ["small_chiefs"] },
  { id: "qt-sov-exposure", titleFR: "Exposition Sociale", type: "SOVEREIGNTY", primaryStat: "SOCIAL_DOMINANCE", difficulty: 4, durationMin: 20, risk: "HIGH", failureTags: ["social_fear"] },
  { id: "qt-sov-authority", titleFR: "Protocole Autorité", type: "SOVEREIGNTY", primaryStat: "SOCIAL_DOMINANCE", difficulty: 5, durationMin: 30, risk: "HIGH", failureTags: ["small_chiefs", "social_fear"] },
  // EXECUTION (2)
  { id: "qt-exec-chain", titleFR: "Chaîne Exécution", type: "EXECUTION", primaryStat: "EXECUTION", difficulty: 3, durationMin: 30, risk: "MED", failureTags: ["comfort_loop", "avoidance_admin"] },
  { id: "qt-exec-sprint", titleFR: "Sprint Livraison", type: "EXECUTION", primaryStat: "EXECUTION", difficulty: 4, durationMin: 30, risk: "HIGH", failureTags: ["distraction"] },
  // PUNISHMENT (1)
  { id: "qt-punishment", titleFR: "Peine Consécutive", type: "PUNISHMENT", primaryStat: "DISCIPLINE", difficulty: 4, durationMin: 30, risk: "HIGH", failureTags: ["comfort_loop", "energy_leak"] },
];

// ============================================================
// MICRO QUESTS — 30 entries
// ============================================================
export const SEED_MICRO_QUESTS: MicroQuestCatalog[] = [
  // PHYSICAL (6)
  { id: "mq-respiration", titleFR: "Respiration 4-4-6 — 2 min", primaryStat: "PHYSICAL", durationMin: 2, failureTags: ["energy_leak"] },
  { id: "mq-echauffement", titleFR: "Échauffement Rapide — 5 min", primaryStat: "PHYSICAL", durationMin: 5, failureTags: ["energy_leak", "comfort_loop"] },
  { id: "mq-pompes", titleFR: "10 Pompes Maintenant — 2 min", primaryStat: "PHYSICAL", durationMin: 2, failureTags: ["energy_leak"] },
  { id: "mq-planche", titleFR: "Planche 1 min — 2 min", primaryStat: "PHYSICAL", durationMin: 2, failureTags: ["energy_leak", "comfort_loop"] },
  { id: "mq-marche", titleFR: "Marche Active — 10 min", primaryStat: "PHYSICAL", durationMin: 10, failureTags: ["energy_leak"] },
  { id: "mq-hydratation", titleFR: "Hydratation + Reset — 2 min", primaryStat: "PHYSICAL", durationMin: 2, failureTags: ["energy_leak"] },
  // MENTAL (5)
  { id: "mq-memo-priorite", titleFR: "Mémo Priorité #1 — 5 min", primaryStat: "MENTAL", durationMin: 5, failureTags: ["overthinking", "distraction"] },
  { id: "mq-coupe-pensee", titleFR: "Coupe Pensée Parasite — 5 min", primaryStat: "MENTAL", durationMin: 5, failureTags: ["overthinking"] },
  { id: "mq-focus-mono", titleFR: "Focus Mono-tâche — 12 min", primaryStat: "MENTAL", durationMin: 12, failureTags: ["distraction"] },
  { id: "mq-revue-decision", titleFR: "Revue Décision — 10 min", primaryStat: "MENTAL", durationMin: 10, failureTags: ["overthinking"] },
  { id: "mq-vidage-cerveau", titleFR: "Vidage Cerveau — 5 min", primaryStat: "MENTAL", durationMin: 5, failureTags: ["overthinking", "distraction"] },
  // DISCIPLINE (4)
  { id: "mq-timer-admin", titleFR: "Timer Admin — 10 min", primaryStat: "DISCIPLINE", durationMin: 10, failureTags: ["avoidance_admin"] },
  { id: "mq-tache-bloquee", titleFR: "Tâche Bloquée — 15 min", primaryStat: "DISCIPLINE", durationMin: 15, failureTags: ["avoidance_admin", "comfort_loop"] },
  { id: "mq-mail-prioritaire", titleFR: "Mail Prioritaire — 5 min", primaryStat: "DISCIPLINE", durationMin: 5, failureTags: ["avoidance_admin"] },
  { id: "mq-anti-fuite", titleFR: "Rituel Anti-Fuite — 10 min", primaryStat: "DISCIPLINE", durationMin: 10, failureTags: ["comfort_loop", "avoidance_admin"] },
  // SOCIAL_DOMINANCE (4)
  { id: "mq-message-cle", titleFR: "Message Clé — 5 min", primaryStat: "SOCIAL_DOMINANCE", durationMin: 5, failureTags: ["social_fear", "small_chiefs"] },
  { id: "mq-reponse-directe", titleFR: "Réponse Directe — 2 min", primaryStat: "SOCIAL_DOMINANCE", durationMin: 2, failureTags: ["social_fear"] },
  { id: "mq-position-exprimee", titleFR: "Position Exprimée — 10 min", primaryStat: "SOCIAL_DOMINANCE", durationMin: 10, failureTags: ["small_chiefs", "social_fear"] },
  { id: "mq-refus-net", titleFR: "Refus Net — 2 min", primaryStat: "SOCIAL_DOMINANCE", durationMin: 2, failureTags: ["small_chiefs"] },
  // CREATION (3)
  { id: "mq-capture-idee", titleFR: "Capture Idée — 5 min", primaryStat: "CREATION", durationMin: 5, failureTags: ["comfort_loop", "distraction"] },
  { id: "mq-hook-contenu", titleFR: "Hook Contenu — 10 min", primaryStat: "CREATION", durationMin: 10, failureTags: ["comfort_loop"] },
  { id: "mq-story-rapide", titleFR: "Story Rapide — 5 min", primaryStat: "CREATION", durationMin: 5, failureTags: ["comfort_loop"] },
  // VISION_PRO (2)
  { id: "mq-brief-strategie", titleFR: "Brief Stratégie — 15 min", primaryStat: "VISION_PRO", durationMin: 15, failureTags: ["overthinking"] },
  { id: "mq-arbitrage-priorite", titleFR: "Arbitrage Priorité — 10 min", primaryStat: "VISION_PRO", durationMin: 10, failureTags: ["overthinking", "distraction"] },
  // VNS_RITUAL (3)
  { id: "mq-vns-protocol", titleFR: "Protocole VNS — 5 min", primaryStat: "VNS_RITUAL", durationMin: 5, failureTags: ["energy_leak"] },
  { id: "mq-coherence-check", titleFR: "Cohérence Check — 5 min", primaryStat: "VNS_RITUAL", durationMin: 5, failureTags: ["overthinking"] },
  { id: "mq-connexion-interne", titleFR: "Connexion Interne — 5 min", primaryStat: "VNS_RITUAL", durationMin: 5, failureTags: ["energy_leak"] },
  // EXECUTION (3)
  { id: "mq-sprint-livraison", titleFR: "Sprint Livraison — 20 min", primaryStat: "EXECUTION", durationMin: 20, failureTags: ["distraction", "avoidance_admin"] },
  { id: "mq-action-unique", titleFR: "Action Unique — 12 min", primaryStat: "EXECUTION", durationMin: 12, failureTags: ["comfort_loop", "distraction"] },
  { id: "mq-retour-terrain", titleFR: "Retour Terrain — 15 min", primaryStat: "EXECUTION", durationMin: 15, failureTags: ["avoidance_admin"] },
];

// ============================================================
// ARTIFACTS — 12 entries (JP+FR)
// ============================================================
export const SEED_ARTIFACTS: ArtifactCatalog[] = [
  { id: "artifact-iiwake-fuin", nameJP: "言い訳封印", nameFR: "Sceau anti-justification", ruleTextFR: "Toute justification à un échec est neutralisée. Seule l'action compte.", durationDays: 7, linkedStat: "DISCIPLINE", rarity: "EPIC" },
  { id: "artifact-asa-tanren", nameJP: "朝鍛錬絶対", nameFR: "Entraînement matinal absolu", ruleTextFR: "L'entraînement matinal est verrouillé. Aucun mode SALVAGE ne peut le supprimer.", durationDays: 7, linkedStat: "PHYSICAL", rarity: "EPIC" },
  { id: "artifact-shoo-setsudan", nameJP: "小王切断", nameFR: "Coupe les petits chefs", ruleTextFR: "Toute interaction avec un petit chef déclenche automatiquement une quête SOVEREIGNTY.", durationDays: 5, linkedStat: "SOCIAL_DOMINANCE", rarity: "RARE" },
  { id: "artifact-shin-shuchuu", nameJP: "深集中", nameFR: "Concentration profonde", ruleTextFR: "Les quêtes MENTAL rapportent +20% XP pendant la durée.", durationDays: 5, linkedStat: "MENTAL", rarity: "RARE" },
  { id: "artifact-shikko-tate", nameJP: "執行盾", nameFR: "Bouclier d'exécution", ruleTextFR: "Une quête EXECUTION ratée ne génère pas de corruption.", durationDays: 3, linkedStat: "EXECUTION", rarity: "COMMON" },
  { id: "artifact-sozo-homura", nameJP: "創造焔", nameFR: "Flamme créatrice", ruleTextFR: "Les quêtes CREATION rapportent +15% XP. contentDone compte double.", durationDays: 5, linkedStat: "CREATION", rarity: "RARE" },
  { id: "artifact-shikai-kakudai", nameJP: "視界拡大", nameFR: "Vision élargie", ruleTextFR: "Les quêtes VISION_PRO débloquent une quête bonus si terminées avant 18:00.", durationDays: 7, linkedStat: "VISION_PRO", rarity: "EPIC" },
  { id: "artifact-shakai-yoroi", nameJP: "社会鎧", nameFR: "Armure sociale", ruleTextFR: "Les incidents SOCIAL_FRICTION n'augmentent pas la corruption.", durationDays: 3, linkedStat: "SOCIAL_DOMINANCE", rarity: "COMMON" },
  { id: "artifact-kiritsu-ha", nameJP: "規律刃", nameFR: "Lame de discipline", ruleTextFR: "+5 XP DISCIPLINE sur toute quête complétée avant l'heure prévue.", durationDays: 3, linkedStat: "DISCIPLINE", rarity: "COMMON" },
  { id: "artifact-kaifuku-ishi", nameJP: "回復の石", nameFR: "Pierre de récupération", ruleTextFR: "En mode RECOVERY, les quêtes rapportent XP normal au lieu de 50%.", durationDays: 5, linkedStat: "PHYSICAL", rarity: "RARE" },
  { id: "artifact-vns-kyosei", nameJP: "VNS強制", nameFR: "Protocole VNS forcé", ruleTextFR: "Le Rituel VNS est automatiquement ajouté au Top 3 si VNS_RITUAL_score < 40.", durationDays: 7, linkedStat: "VNS_RITUAL", rarity: "EPIC" },
  { id: "artifact-seishin-gofu", nameJP: "精神護符", nameFR: "Talisman mental", ruleTextFR: "La corruption n'augmente pas si une quête MENTAL est complétée dans la même journée.", durationDays: 3, linkedStat: "MENTAL", rarity: "COMMON" },
];

// ============================================================
// PERKS — 20 entries
// ============================================================
export const SEED_PERKS: PerkCatalog[] = [
  { id: "perk-resistance-base", nameFR: "Résistance de base", descFR: "Les quêtes RECOVERY rapportent 50% d'XP supplémentaire.", rarity: "COMMON" },
  { id: "perk-acuite-tactique", nameFR: "Acuité tactique", descFR: "Le Daily Scan prend en compte l'intention pour booster le Top 3.", rarity: "COMMON" },
  { id: "perk-flux-execution", nameFR: "Flux d'exécution", descFR: "+5 XP EXECUTION sur toute quête terminée dans le délai.", rarity: "COMMON" },
  { id: "perk-ancrage-matinal", nameFR: "Ancrage matinal", descFR: "L'entraînement avant 10:00 génère +10 XP PHYSICAL bonus.", rarity: "COMMON" },
  { id: "perk-vigilance-distraction", nameFR: "Vigilance anti-distraction", descFR: "Les incidents DERAIL ne génèrent qu'1/2 corruption.", rarity: "COMMON" },
  { id: "perk-lecture-terrain", nameFR: "Lecture du terrain", descFR: "Les incidents BUSINESS_FIRE génèrent automatiquement une quête VISION_PRO.", rarity: "COMMON" },
  { id: "perk-rituel-veille", nameFR: "Rituel de veille", descFR: "+5 XP VNS_RITUAL si le shutdown est fait avant 23:00.", rarity: "COMMON" },
  { id: "perk-discipline-acier", nameFR: "Discipline d'acier", descFR: "Trois jours consécutifs de shutdown terminé: +50 XP DISCIPLINE.", rarity: "RARE" },
  { id: "perk-presence-dominante", nameFR: "Présence dominante", descFR: "Les quêtes SOVEREIGNTY en difficulté 4+ rapportent double XP.", rarity: "RARE" },
  { id: "perk-memoire-abime", nameFR: "Mémoire de l'abîme", descFR: "Le streak recommence à 3 au lieu de 0 si un token de grâce est utilisé.", rarity: "RARE" },
  { id: "perk-sceau-silence", nameFR: "Sceau du silence", descFR: "Les quêtes complétées sans interaction sociale rapportent +10 XP MENTAL.", rarity: "RARE" },
  { id: "perk-architecture-decision", nameFR: "Architecture décisionnelle", descFR: "+15 XP VISION_PRO si une quête VISION_PRO est faite avant 12:00.", rarity: "RARE" },
  { id: "perk-fracture-confort", nameFR: "Fracture du confort", descFR: "Chaque semaine sans quête comfort_loop tagguée: +20 XP DISCIPLINE.", rarity: "RARE" },
  { id: "perk-instinct-survie", nameFR: "Instinct de survie", descFR: "En mode SALVAGE, le streak n'est pas affecté si 2 quêtes sur 3 sont faites.", rarity: "RARE" },
  { id: "perk-eveil-accelere", nameFR: "Éveil accéléré", descFR: "Les boss fights rapportent +30% XP.", rarity: "EPIC" },
  { id: "perk-sang-froid", nameFR: "Sang-froid tactique", descFR: "En mode BRUTAL, toutes les quêtes rapportent +25% XP.", rarity: "EPIC" },
  { id: "perk-transmutation", nameFR: "Transmutation", descFR: "Une quête FAILED peut être retentée une fois sans pénalité corruption.", rarity: "EPIC" },
  { id: "perk-conscience-ombre", nameFR: "Conscience de l'ombre", descFR: "La corruption diminue de 2 supplémentaires pour chaque quête SOVEREIGNTY terminée.", rarity: "EPIC" },
  { id: "perk-volonte-absolue", nameFR: "Volonté absolue", descFR: "Si le streak dépasse 14 jours, la corruption maximale est réduite à 80.", rarity: "EPIC" },
  { id: "perk-regard-verre", nameFR: "Regard de verre", descFR: "L'observateur d'évolution génère des suggestions de priorité HIGH en priorité.", rarity: "EPIC" },
];

// ============================================================
// BOSS TEMPLATES — 12 entries
// ============================================================
export const SEED_BOSS_TEMPLATES: BossTemplate[] = [
  { id: "boss-assaut-confort", titleFR: "Assaut sur le Confort", primaryStat: "MENTAL", difficulty: 5, durationMin: 60, risk: "HIGH", xpReward: 200, statXPReward: { MENTAL: 100, DISCIPLINE: 50 } },
  { id: "boss-siege-admin", titleFR: "Siège de l'Admin", primaryStat: "DISCIPLINE", difficulty: 4, durationMin: 45, risk: "HIGH", xpReward: 150, statXPReward: { DISCIPLINE: 80, EXECUTION: 40 } },
  { id: "boss-combat-territoire", titleFR: "Combat de Territoire", primaryStat: "SOCIAL_DOMINANCE", difficulty: 5, durationMin: 60, risk: "HIGH", xpReward: 200, statXPReward: { SOCIAL_DOMINANCE: 100, MENTAL: 30 } },
  { id: "boss-marathon-creatif", titleFR: "Marathon Créatif", primaryStat: "CREATION", difficulty: 4, durationMin: 60, risk: "MED", xpReward: 150, statXPReward: { CREATION: 80, VISION_PRO: 30 } },
  { id: "boss-frappe-decisionnelle", titleFR: "Frappe Décisionnelle", primaryStat: "VISION_PRO", difficulty: 5, durationMin: 60, risk: "HIGH", xpReward: 200, statXPReward: { VISION_PRO: 100, DISCIPLINE: 50 } },
  { id: "boss-execution-totale", titleFR: "Protocole Exécution Totale", primaryStat: "EXECUTION", difficulty: 4, durationMin: 45, risk: "HIGH", xpReward: 150, statXPReward: { EXECUTION: 80, DISCIPLINE: 40 } },
  { id: "boss-purge-parasites", titleFR: "Purge des Parasites", primaryStat: "MENTAL", difficulty: 4, durationMin: 45, risk: "MED", xpReward: 130, statXPReward: { MENTAL: 70, DISCIPLINE: 30 } },
  { id: "boss-entrainement-rituel", titleFR: "Entraînement Rituel", primaryStat: "PHYSICAL", difficulty: 5, durationMin: 60, risk: "HIGH", xpReward: 180, statXPReward: { PHYSICAL: 90, DISCIPLINE: 50 } },
  { id: "boss-vns-maximum", titleFR: "VNS Maximum", primaryStat: "VNS_RITUAL", difficulty: 3, durationMin: 30, risk: "MED", xpReward: 100, statXPReward: { VNS_RITUAL: 60, MENTAL: 20 } },
  { id: "boss-domination-sociale", titleFR: "Domination Sociale Totale", primaryStat: "SOCIAL_DOMINANCE", difficulty: 5, durationMin: 60, risk: "HIGH", xpReward: 200, statXPReward: { SOCIAL_DOMINANCE: 100, MENTAL: 50 } },
  { id: "boss-vision-90j", titleFR: "Vision à 90 jours", primaryStat: "VISION_PRO", difficulty: 4, durationMin: 60, risk: "MED", xpReward: 150, statXPReward: { VISION_PRO: 80, MENTAL: 40 } },
  { id: "boss-annihilation-chaos", titleFR: "Annihilation du Chaos", primaryStat: "DISCIPLINE", difficulty: 5, durationMin: 60, risk: "HIGH", xpReward: 200, statXPReward: { DISCIPLINE: 100, EXECUTION: 60 } },
];

// ============================================================
// RULES ENGINE — 10 rules
// ============================================================
export const SEED_RULES: Rule[] = [
  { id: "rule-automode-salvage", name: "automode_salvage_training_missed", condition: { timeAfter: "10:30", trainingDone: false }, action: { setAutoMode: "SALVAGE" }, priority: 1, enabled: true },
  { id: "rule-automode-recovery-energy", name: "automode_recovery_low_energy", condition: { energyLte: 2 }, action: { setAutoMode: "RECOVERY" }, priority: 2, enabled: true },
  { id: "rule-automode-recovery-incident", name: "automode_recovery_high_incident", condition: { incidentSeverityGte: 4, withinHours: 12 }, action: { setAutoMode: "RECOVERY" }, priority: 2, enabled: true },
  { id: "rule-automode-brutal", name: "automode_brutal_consecutive_miss", condition: { consecutiveMissedTraining: 2, questsSkippedGte: 3 }, action: { setAutoMode: "BRUTAL" }, priority: 3, enabled: true },
  { id: "rule-automode-recovery-corruption", name: "automode_recovery_high_corruption", condition: { corruptionGte: 70 }, action: { setAutoMode: "RECOVERY" }, priority: 1, enabled: true },
  { id: "rule-quest-cap", name: "quest_cap_max_7", condition: { visibleQuestsGt: 7 }, action: { capTo: 7, hideLowerPriority: true }, priority: 5, enabled: true },
  { id: "rule-quest-expire", name: "quest_expire_48h", condition: { statusEq: "TODO", olderThanHours: 48 }, action: { setStatus: "EXPIRED" }, priority: 6, enabled: true },
  { id: "rule-grace-token-reset", name: "grace_token_monthly_reset", condition: { newMonth: true }, action: { resetGraceTokens: 2 }, priority: 10, enabled: true },
  { id: "rule-streak-break", name: "streak_break_rule", condition: { shutdownDone: false, salvageQuestDone: false, graceTokenUsed: false }, action: { breakStreak: true }, priority: 7, enabled: true },
  { id: "rule-corruption-clamp", name: "corruption_clamp", condition: {}, action: { clampMin: 0, clampMax: 100 }, priority: 99, enabled: true },
];

// ============================================================
// TRIGGERS — 12 entries mapping tags -> quest templates
// ============================================================
export const SEED_TRIGGERS: Trigger[] = [
  { id: "trigger-small-chiefs-authority", name: "Petits chefs → Autorité", ifTag: "small_chiefs", thenQuestTemplateId: "qt-sov-authority", enabled: true },
  { id: "trigger-admin-blitz", name: "Admin → Blitz Admin", ifTag: "avoidance_admin", thenQuestTemplateId: "qt-daily-admin", enabled: true },
  { id: "trigger-distraction-deepwork", name: "Distraction → Travail Profond", ifTag: "distraction", thenQuestTemplateId: "qt-daily-deep-work", enabled: true },
  { id: "trigger-energy-recovery", name: "Énergie → Récupération Active", ifTag: "energy_leak", thenQuestTemplateId: "qt-recovery-active", enabled: true },
  { id: "trigger-social-fear-exposure", name: "Peur sociale → Exposition", ifTag: "social_fear", thenQuestTemplateId: "qt-sov-exposure", enabled: true },
  { id: "trigger-comfort-execution", name: "Confort → Chaîne Exécution", ifTag: "comfort_loop", thenQuestTemplateId: "qt-exec-chain", enabled: true },
  { id: "trigger-overthinking-vision", name: "Surpensée → Vision Pro", ifTag: "overthinking", thenQuestTemplateId: "qt-daily-vision", enabled: true },
  { id: "trigger-small-chiefs-micro", name: "Petits chefs → Refus Net (micro)", ifTag: "small_chiefs", thenQuestTemplateId: "mq-refus-net", enabled: true },
  { id: "trigger-admin-micro", name: "Admin → Timer Admin (micro)", ifTag: "avoidance_admin", thenQuestTemplateId: "mq-timer-admin", enabled: true },
  { id: "trigger-distraction-micro", name: "Distraction → Focus Mono-tâche (micro)", ifTag: "distraction", thenQuestTemplateId: "mq-focus-mono", enabled: true },
  { id: "trigger-energy-micro", name: "Énergie → Hydratation (micro)", ifTag: "energy_leak", thenQuestTemplateId: "mq-hydratation", enabled: true },
  { id: "trigger-social-fear-micro", name: "Peur sociale → Message Clé (micro)", ifTag: "social_fear", thenQuestTemplateId: "mq-message-cle", enabled: true },
];

// ============================================================
// DEFAULT PROFILE
// ============================================================
export function makeDefaultProfile(): Profile {
  return {
    id: "profile",
    createdAt: Date.now(),
    timezone: "Europe/Paris",
    wakeTime: "09:00",
    trainingWindowStart: "09:00",
    trainingWindowEnd: "10:00",
    shutdownTime: "23:30",
    bedDeadline: "01:00",
    signatureLine: "Je sais donc je suis.",
    language: "fr",
    difficultyMode: "Normal",
    schemaVersion: SCHEMA_VERSION,
  };
}

// ============================================================
// DEFAULT PROGRESSION
// ============================================================
export function makeDefaultProgression(): Progression {
  return {
    id: "progression",
    globalXP: 0,
    levelIndex: 1,
    streakDays: 0,
    corruption: 0,
    mutationCount: 0,
    graceTokensRemaining: 2,
    graceTokensResetMonth: getCurrentMonth(),
    lastActiveDate: getTodayDate(),
  };
}

// ============================================================
// DEFAULT STATS
// ============================================================
export function makeDefaultStats(): Stats {
  return {
    id: "stats",
    MENTAL_score: 0,
    MENTAL_xp: 0,
    PHYSICAL_score: 0,
    PHYSICAL_xp: 0,
    DISCIPLINE_score: 0,
    DISCIPLINE_xp: 0,
    CREATION_score: 0,
    CREATION_xp: 0,
    SOCIAL_DOMINANCE_score: 0,
    SOCIAL_DOMINANCE_xp: 0,
    VISION_PRO_score: 0,
    VISION_PRO_xp: 0,
    EXECUTION_score: 0,
    EXECUTION_xp: 0,
    VNS_RITUAL_score: 0,
    VNS_RITUAL_xp: 0,
    blockingTags: {},
    updatedAt: Date.now(),
  };
}
