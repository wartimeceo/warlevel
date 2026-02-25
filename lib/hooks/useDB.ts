"use client";

import { useState, useEffect, useCallback } from "react";
import { getDB } from "../db/schema";
import { initDB } from "../db";
import type { Quest, DayState, Progression, Stats, DailyLog, EvolutionSuggestion } from "../types";
import { getTodayDate } from "../utils/dates";
import { generateDailyQuests, getTodayQuests } from "../engine/questGeneration";
import { computeAutoMode } from "../engine/autoMode";
import { checkAndApplyLevelUp } from "../engine/levelEngine";

// ============================================================
// WARLEVEL — React Hooks for DB
// ============================================================

export function useInit() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDB()
      .then(async () => {
        // Ensure today's day_state and quests exist
        const db = getDB();
        const today = getTodayDate();
        const existing = await db.day_state.get(today);
        if (!existing) {
          await generateDailyQuests(today);
        }
        setReady(true);
      })
      .catch((e) => {
        setError(e?.message ?? "DB init failed");
        setReady(true); // still show UI with error
      });
  }, []);

  return { ready, error };
}

export function useDayState(date: string) {
  const [dayState, setDayState] = useState<DayState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const db = getDB();
    const ds = await db.day_state.get(date);
    setDayState(ds ?? null);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { dayState, loading, refresh };
}

export function useProgression() {
  const [progression, setProgression] = useState<Progression | null>(null);

  const refresh = useCallback(async () => {
    const db = getDB();
    const p = await db.progression.get("progression");
    setProgression(p ?? null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { progression, refresh };
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  const refresh = useCallback(async () => {
    const db = getDB();
    const s = await db.stats.get("stats");
    setStats(s ?? null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, refresh };
}

export function useQuests(date: string) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const qs = await getTodayQuests(date);
    setQuests(qs);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { quests, loading, refresh };
}

export function useTop3Quests(date: string) {
  const [top3, setTop3] = useState<Quest[]>([]);
  const [dayState, setDayState] = useState<DayState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const db = getDB();
    const ds = await db.day_state.get(date);
    setDayState(ds ?? null);
    if (ds && ds.top3QuestIds.length) {
      const quests = await Promise.all(
        ds.top3QuestIds.map((id) => db.quests.get(id))
      );
      setTop3(quests.filter((q): q is Quest => !!q));
    } else {
      setTop3([]);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { top3, dayState, loading, refresh };
}

export function useTodayLog(date: string) {
  const [log, setLog] = useState<DailyLog | null>(null);

  const refresh = useCallback(async () => {
    const db = getDB();
    const l = await db.daily_logs.where("date").equals(date).first();
    setLog(l ?? null);
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { log, refresh };
}

export function useEvolutionSuggestions() {
  const [suggestions, setSuggestions] = useState<EvolutionSuggestion[]>([]);

  const refresh = useCallback(async () => {
    const db = getDB();
    const all = await db.evolution_suggestions.toArray();
    setSuggestions(all.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { suggestions, refresh };
}
