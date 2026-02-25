"use client";

import { useState } from "react";
import { getDB } from "@/lib/db/schema";
import { generateId } from "@/lib/utils/deterministic";
import { getTodayDate } from "@/lib/utils/dates";
import { addIncidentQuest } from "@/lib/engine/questGeneration";
import { applyCorruptionTrigger } from "@/lib/engine/corruptionEngine";
import type { IncidentType, ImpactedWindow, ChosenResponse } from "@/lib/types";

interface PingOption {
  label: string;
  incidentType: IncidentType;
  failureTag: string;
  severity: number;
  impactedWindow: ImpactedWindow;
  chosenResponse: ChosenResponse;
  summary: string;
}

const PING_OPTIONS: PingOption[] = [
  {
    label: "J'ai évité quelque chose.",
    incidentType: "UNPLANNED",
    failureTag: "avoidance_admin",
    severity: 2,
    impactedWindow: "DAY",
    chosenResponse: "ADAPT",
    summary: "Quelque chose évité — sans précision.",
  },
  {
    label: "Énergie chutée.",
    incidentType: "LOW_ENERGY",
    failureTag: "energy_leak",
    severity: 3,
    impactedWindow: "DAY",
    chosenResponse: "RECOVER",
    summary: "Chute d'énergie soudaine.",
  },
  {
    label: "J'ai été manqué de respect.",
    incidentType: "SOCIAL_FRICTION",
    failureTag: "small_chiefs",
    severity: 4,
    impactedWindow: "DAY",
    chosenResponse: "ADAPT",
    summary: "Friction sociale — manque de respect.",
  },
  {
    label: "Je suis distrait.",
    incidentType: "DERAIL",
    failureTag: "distraction",
    severity: 2,
    impactedWindow: "DAY",
    chosenResponse: "ADAPT",
    summary: "Distraction en cours.",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function QuickPingModal({ open, onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [microQuestTitle, setMicroQuestTitle] = useState<string | null>(null);

  if (!open) return null;

  async function handlePing(option: PingOption) {
    setLoading(true);
    const db = getDB();
    const now = Date.now();
    const today = getTodayDate();

    const incidentId = generateId();
    await db.incidents.add({
      id: incidentId,
      dateTime: now,
      type: option.incidentType,
      summary: option.summary,
      severity: option.severity,
      impactedWindow: option.impactedWindow,
      chosenResponse: option.chosenResponse,
      createdAt: now,
    });

    // Apply corruption
    if (option.severity >= 4) {
      await applyCorruptionTrigger("FAILED_QUEST");
    }

    // Add micro quest targeting this failure tag
    await addIncidentQuest(today, incidentId, option.failureTag);

    // Get the newly created quest title
    const db2 = getDB();
    const newQuests = await db2.quests
      .where("relatedIncidentId")
      .equals(incidentId)
      .toArray();
    if (newQuests.length > 0) {
      setMicroQuestTitle(newQuests[0].title);
    }

    setLoading(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <div className="w-full max-w-lg bg-zinc-900 border-t border-zinc-700 rounded-t-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-mono font-bold text-zinc-300">QUICK PING</span>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {microQuestTitle ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-300">Incident enregistré.</p>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-500 font-mono mb-1">MICRO-QUÊTE PROPOSÉE</p>
              <p className="text-sm text-white font-medium">{microQuestTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-mono rounded-lg transition-colors"
            >
              FERMER
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {PING_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handlePing(opt)}
                disabled={loading}
                className="w-full text-left p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-sm text-zinc-200 font-medium transition-colors disabled:opacity-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
