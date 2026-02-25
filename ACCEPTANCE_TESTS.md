# WARLEVEL — Acceptance Tests (V1)

Date: 2026-02-25
Schema Version: 1

---

## AT-01 — Offline After First Load

**Condition:** App has been opened once in a browser (service worker installed).
**Test:** Disable network (airplane mode). Navigate to `/home`.
**Expected:** App loads fully. Quests visible. All interactions work.
**Pass:** [ ]

---

## AT-02 — Daily Scan Creates Log + Deterministic Quest Generation

**Condition:** Fresh day (no scan yet).
**Steps:**
1. Navigate to `/scan`
2. Enter Energy=3, Focus=4, Chaos=2, Friction="trop de mails admin"
3. Submit

**Expected:**
- `daily_logs` row created with correct date
- `day_state.checkinDone = true`
- `day_state.keyFailureTag = "avoidance_admin"` (inferred from "mails admin")
- Quests regenerated with a Blitz Admin or similar quest in Top 3
- Running the scan again with SAME inputs on SAME date produces SAME quest IDs

**Pass:** [ ]

---

## AT-03 — Training Missed After 10:30 → SALVAGE

**Condition:** Current time > 10:30. Training not done.
**Steps:**
1. Ensure no training done today
2. Open app after 10:30
3. Check `/home` or `/autopilot`

**Expected:**
- `day_state.autoMode = "SALVAGE"`
- AutoMode badge shows "SALVAGE"
- Top 3 contains exactly:
  - 1 RECOVERY quest (10–20 min)
  - 1 EXECUTION quest (10–20 min)
  - 1 VNS_RITUAL or SOCIAL_DOMINANCE quest (10–20 min)
  - OR: 1 Micro Training 12min + 2 of the above

**Pass:** [ ]

---

## AT-04 — Incident Changes Top 3

**Condition:** Quests already generated for today.
**Steps:**
1. Navigate to `/incident`
2. Select type: SOCIAL_FRICTION, Severity: 4, fill summary, submit

**Expected:**
- Incident row created in DB
- A micro quest (SOVEREIGNTY or SOCIAL_DOMINANCE type) added to quests
- Top 3 updated to include this new urgent quest as first item
- `day_state.autoMode` recalculated (may shift to RECOVERY due to severity >= 4)

**Pass:** [ ]

---

## AT-05 — Quick Ping → Micro Quest in One Tap

**Condition:** Any state.
**Steps:**
1. Press "QUICK PING" button on `/home`
2. Select "Je suis distrait."

**Expected:**
- Modal shows immediately
- Incident created (type: DERAIL)
- Micro quest generated immediately (focus/distraction related)
- Micro quest title shown in modal without page reload
- Top 3 refreshed

**Pass:** [ ]

---

## AT-06 — Grace Token Preserves Streak

**Condition:** `graceTokensRemaining >= 1`. Day is failing (no shutdown done after 23:00).
**Steps:**
1. Press "TOKEN GRÂCE" button on `/home`

**Expected:**
- `graceTokensRemaining` decrements by 1
- Notification logged: "Token de grâce utilisé..."
- Streak NOT broken for the day
- Corruption still increases normally (grace doesn't block corruption)

**Pass:** [ ]

---

## AT-07 — Corruption Changes Exactly Per Rules

**Condition:** Fresh profile (corruption = 0).
**Test sequence:**

| Action | Expected corruption after |
|--------|--------------------------|
| Miss training (day ends without training) | +8 → 8 |
| Miss shutdown | +5 → 13 |
| Fail a quest | +4 → 17 |
| Skip a quest | +3 → 20 |
| Complete training | -10 → 10 |
| Complete shutdown | -6 → 4 |
| Complete recovery quest | -12 → 0 (clamped) |
| Boss failed | +15 → 15 |

**Expected:** All values match exactly. Corruption clamped 0..100.
**Pass:** [ ]

---

## AT-08 — Quests Cap at 7 / Expire After 48h

**Sub-test A — Cap:**
1. Trigger all conditional quest additions (low CREATION, low SOCIAL, corruption > 35, 2 missed trainings, BUSINESS_FIRE incident)
2. Check `/quests`

**Expected:** Maximum 7 quests visible. Oldest/lowest priority hidden.

**Sub-test B — Expire:**
1. Create a quest with `createdAt = Date.now() - 49 * 3600 * 1000` (49 hours ago)
2. Run `generateDailyQuests`

**Expected:** Quest status set to EXPIRED. Appears in Graveyard section only.

**Pass:** [ ]

---

## AT-09 — Level Names Show JP + FR

**Condition:** Navigate to `/home`.

**Expected:**
- Level display shows: `L1 目覚め Éveil` (for level 1)
- Arc shown: `覚醒 — Éveil`
- XP progress bar visible

**All 10 levels check (verify in catalogs_levels):**

| Index | JP | FR |
|-------|----|----|
| 1 | 目覚め | Éveil |
| 2 | 影歩き | Marcheur de l'ombre |
| 3 | 規律者 | Discipliné |
| 4 | 執行者 | Exécuteur |
| 5 | 支配者 | Dominant |
| 6 | 戦略家 | Stratège |
| 7 | 覚醒王 | Roi éveillé |
| 8 | 異端者 | Anomalie |
| 9 | 深淵王 | Roi de l'abîme |
| 10 | 戦神 | Dieu de guerre |

**Pass:** [ ]

---

## AT-10 — Export JSON + Import Restores Full State

**Steps:**
1. Complete a few quests, do a scan, log an incident
2. Go to `/settings` → "EXPORTER JSON"
3. Download file is created
4. Verify file contains: schemaVersion, exportedAt, profile, progression, stats, daily_logs, quests, incidents
5. Click "IMPORTER JSON" → select the downloaded file
6. Verify all data restored correctly

**Expected:**
- Export file is valid JSON
- Import validates schemaVersion
- All tables restored
- App state identical after import

**Pass:** [ ]

---

## AT-11 — PWA Installable (iOS/Android)

**iOS Test:**
1. Open app in Safari
2. Tap Share → Add to Home Screen
3. App installs with WARLEVEL icon
4. Opens in standalone mode (no browser chrome)

**Android Test:**
1. Open app in Chrome
2. Install prompt appears OR use ⋮ menu → Install app
3. App installs on home screen
4. Opens in standalone mode

**Pass:** [ ]

---

## AT-12 — AutoMode State Machine Full Coverage

| Condition | Expected Mode |
|-----------|--------------|
| Time < 10:30, training not done, energy >= 3 | NORMAL |
| Time > 10:30, training not done | SALVAGE |
| Energy <= 2 in daily log | RECOVERY |
| Incident severity >= 4 in last 12h | RECOVERY |
| Corruption >= 70 | RECOVERY |
| 2 consecutive missed trainings + 3+ skipped quests | BRUTAL |

**Pass:** [ ]

---

## AT-13 — Seed Data Integrity

Verify via Settings page or browser console:

| Table | Expected Count |
|-------|---------------|
| catalogs_levels | 10 |
| catalogs_quest_templates | 25 |
| catalogs_micro_quests | 30 |
| catalogs_artifacts | 12 |
| catalogs_perks | 20 |
| catalogs_boss_templates | 12 |
| rules_engine | 10 |
| triggers | 12 |

Required artifacts present:
- [ ] 言い訳封印 (artifact-iiwake-fuin)
- [ ] 朝鍛錬絶対 (artifact-asa-tanren)
- [ ] 小王切断 (artifact-shoo-setsudan)

**Pass:** [ ]

---

## AT-14 — Streak Logic

**Test A — Streak increment:**
1. Complete shutdown ritual
2. Advance date to next day
3. Complete training

**Expected:** `streakDays` increments by 1.

**Test B — Streak break:**
1. Let a day pass without shutdown AND without grace token

**Expected:** `streakDays = 0`.

**Test C — Salvage saves streak:**
1. Miss training (SALVAGE mode)
2. Complete shutdown + 1 salvage quest

**Expected:** Streak NOT broken.

**Pass:** [ ]

---

## V2 STUBS (Phase 2 — Not in V1)

- [ ] CSV export (`/settings` → button disabled with "Phase 2" label)
- [ ] Notion integration (not present)
- [ ] Meta Graph API (not present)
- [ ] Instagram analysis (not present, no scraping)
- [ ] Boss fight UX polish
- [ ] Content engine
- [ ] Idea engine

These are documented and stubbed. UI shows disabled state for CSV export.
