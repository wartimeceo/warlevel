import { getDB } from "../db/schema";
import type { EvolutionSuggestion, SuggestionSource, SuggestionType } from "../types";
import { generateId } from "../utils/deterministic";
import { getTodayDate, getPreviousDate } from "../utils/dates";

// ============================================================
// WARLEVEL — Evolution Observer
// NEVER modifies the app. Only writes evolution_suggestions.
// Max 3 suggestions per day.
// ============================================================

interface Pattern {
  source: SuggestionSource;
  detectedPattern: string;
  suggestionType: SuggestionType;
  suggestionText: string;
  impact: "LOW" | "MED" | "HIGH";
  priority: number;
}

async function detectPatterns(): Promise<Pattern[]> {
  const db = getDB();
  const patterns: Pattern[] = [];
  const today = getTodayDate();

  // --- Pattern 1: Repeated failure tag (>= 3 times in 7 days) ---
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentLogs = await db.daily_logs
    .where("date")
    .aboveOrEqual(getDateNDaysAgo(7))
    .toArray();

  const tagCounts: Record<string, number> = {};
  for (const log of recentLogs) {
    const text = `${log.friction} ${log.avoided ?? ""}`.toLowerCase();
    const tags = [
      ["avoidance_admin", ["admin", "mail"]],
      ["small_chiefs", ["chef", "réunion", "reunion"]],
      ["distraction", ["distract", "téléphone", "telephone", "réseaux"]],
      ["energy_leak", ["énergie", "energie", "fatigue"]],
      ["social_fear", ["peur", "social", "appel"]],
      ["comfort_loop", ["confort", "facile", "confortable"]],
      ["overthinking", ["pens", "analyse", "trop réfléchi", "hésite"]],
    ] as [string, string[]][];

    for (const [tag, keywords] of tags) {
      if (keywords.some((kw) => text.includes(kw))) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
    }
  }

  for (const [tag, count] of Object.entries(tagCounts)) {
    if (count >= 3) {
      patterns.push({
        source: "DATA_PATTERN",
        detectedPattern: `Tag "${tag}" répété ${count} fois en 7 jours`,
        suggestionType: "NEW_TRIGGER",
        suggestionText: `Créer un trigger automatique pour le tag "${tag}" — déclenche une quête ciblée chaque jour où ce pattern est détecté.`,
        impact: "HIGH",
        priority: 1,
      });
    }
  }

  // --- Pattern 2: Quick Ping never used in 14 days ---
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recentIncidents = await db.incidents
    .where("dateTime")
    .above(fourteenDaysAgo)
    .count();
  if (recentIncidents === 0) {
    patterns.push({
      source: "UX_FRICTION",
      detectedPattern: "Quick Ping non utilisé en 14 jours",
      suggestionType: "SIMPLIFY_UX",
      suggestionText:
        "Quick Ping inutilisé depuis 14 jours. Simplifier l'accès ou intégrer le déclenchement dans le Scan quotidien.",
      impact: "LOW",
      priority: 4,
    });
  }

  // --- Pattern 3: Missed training frequency ---
  const last7Days = Array.from({ length: 7 }, (_, i) =>
    getDateNDaysAgo(i + 1)
  );
  const dayStates = await Promise.all(
    last7Days.map((d) => db.day_state.get(d))
  );
  const missedTrainings = dayStates.filter((ds) => ds && !ds.trainingDone).length;
  if (missedTrainings >= 4) {
    patterns.push({
      source: "MISSES",
      detectedPattern: `Entraînement manqué ${missedTrainings}/7 jours`,
      suggestionType: "RULE_TWEAK",
      suggestionText: `Entraînement manqué ${missedTrainings} fois cette semaine. Réduire la durée minimum de la quête TRAINING ou ajuster la fenêtre horaire dans les paramètres.`,
      impact: "HIGH",
      priority: 2,
    });
  }

  // --- Pattern 4: Rage loops (many incidents + low energy) ---
  const recentLowEnergy = recentLogs.filter((l) => l.energy <= 2).length;
  const recentHighIncidents = await db.incidents
    .where("dateTime")
    .above(sevenDaysAgo)
    .filter((i) => i.severity >= 3)
    .count();
  if (recentLowEnergy >= 3 && recentHighIncidents >= 3) {
    patterns.push({
      source: "INCIDENTS",
      detectedPattern: `Boucle de rage: ${recentLowEnergy} jours énergie basse + ${recentHighIncidents} incidents sévères`,
      suggestionType: "NEW_ARTIFACT",
      suggestionText:
        "Pattern de rage loop détecté. Envisager un artéfact de récupération prioritaire ou ajouter automatiquement une quête RECOVERY en début de journée.",
      impact: "HIGH",
      priority: 1,
    });
  }

  // --- Pattern 5: UX friction — pages opened but quests never completed ---
  const totalQuests = await db.quests.count();
  const doneQuests = await db.quests.where("status").equals("DONE").count();
  if (totalQuests > 10 && doneQuests / totalQuests < 0.3) {
    patterns.push({
      source: "UX_FRICTION",
      detectedPattern: `Taux de complétion des quêtes: ${Math.round((doneQuests / totalQuests) * 100)}%`,
      suggestionType: "SIMPLIFY_UX",
      suggestionText:
        "Moins de 30% des quêtes sont complétées. Réduire le nombre de quêtes visibles ou simplifier le flux de complétion (bouton DONE plus visible).",
      impact: "MED",
      priority: 3,
    });
  }

  return patterns;
}

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export async function runEvolutionObserver(): Promise<void> {
  const db = getDB();
  const today = getTodayDate();

  // Check how many suggestions already created today
  const todayStart = new Date(today + "T00:00:00").getTime();
  const todaySuggestions = await db.evolution_suggestions
    .where("createdAt")
    .above(todayStart)
    .count();

  if (todaySuggestions >= 3) return;

  const patterns = await detectPatterns();
  const remaining = 3 - todaySuggestions;
  const toCreate = patterns.slice(0, remaining);

  for (const pattern of toCreate) {
    const suggestion: EvolutionSuggestion = {
      id: generateId(),
      dateTime: Date.now(),
      source: pattern.source,
      detectedPattern: pattern.detectedPattern,
      suggestionType: pattern.suggestionType,
      suggestionText: pattern.suggestionText,
      impact: pattern.impact,
      priority: pattern.priority,
      status: "PROPOSED",
      createdAt: Date.now(),
    };
    await db.evolution_suggestions.add(suggestion);
  }
}

export async function acceptSuggestion(id: string): Promise<void> {
  const db = getDB();
  await db.evolution_suggestions.update(id, { status: "ACCEPTED" });
}

export async function rejectSuggestion(id: string): Promise<void> {
  const db = getDB();
  await db.evolution_suggestions.update(id, { status: "REJECTED" });
}
