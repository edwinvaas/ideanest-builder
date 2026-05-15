# Contextual Intelligence Upgrade — Incremental & Non-Destructive

Doel: BoxBrain uitbreiden met een strikte beslis-hiërarchie, dieper interferentie-model, doel-alignment en adaptief coach-UI. Auth, routing en bestaande tabellen blijven intact.

---

## 1. Database (additieve migratie)

`workout_sessions` — nieuwe kolommen:
- `intended_stimulus_min int`
- `intended_stimulus_max int`
- `stimulus_description text`
- `coaching_goals_text text`
- `class_size int` (voor adaptive coach view)

`profiles` — nieuwe kolom:
- `subjective_wellness int` (1–10, fallback wanneer geen wearable)

`fatigue_profiles` — `correction_factor` bestaat al ✓ (hergebruiken voor ML kalibratie).

Geen tabel-renames, geen dropping.

## 2. Strategy Engine — Decision Hierarchy

Nieuw bestand `src/lib/decisionHierarchy.ts` dat boven op bestaande `fatigueEngine.ts` draait:

```text
Stap 1  Biometric gate     → recovery <50% ⇒ cap intensiteit op Z2/Z3
Stap 2  Stimulus gate      → check predicted finish vs intended_stimulus_min/max
                              ⇒ genereer ScalingProposal (load%, reps, of substitutie)
Stap 3  Goal modifier      → competition | longevity | strength
                              past pacing/rust/technical-ceiling toe
Stap 4  Interference pass  → grip/posterior/shoulder/CNS buffer
                              voegt micro-rusten (7-10s) toe
Stap 5  CNS volume cap     → max %1RM op basis van HRV-bucket
```

Functie signaturen:
- `applyBiometricGate(plan, recovery): GatedPlan`
- `applyStimulusGate(plan, session, snapshot): { plan, proposal? }`
- `applyGoalModifier(plan, goals[]): plan`
- `applyInterferenceMicroRests(plan, movements): plan`
- `enforceCnsVolumeCap(plan, snapshot): plan`
- `runDecisionPipeline(...)` — orchestrator, async, Promise.all voor data-fetch.

`buildStrategy()` blijft de low-level berekening; pipeline is een nieuwe laag.

## 3. Interference & CNS

Uitbreiden `MOVEMENT_TAXONOMY` in `fatigueEngine.ts` met `gripLoad` (0–1). Nieuwe helper:
- detecteert grip-overlap (SDHP + K2E etc.) ⇒ injecteert `microRestSec: 7–10` per cluster.
- `cnsBuffer(snapshot, recovery)` retourneert max %1RM (bijv. 75% bij HRV-laag, 90% bij HRV-hoog).

## 4. UI

Niet-destructief (bestaande componenten blijven werken):

- **Goal Alignment Badge** (`src/components/athlete/GoalAlignmentBadge.tsx`) — 0–100% score hoe goed huidig protocol/plan bij goals past. Toegevoegd bovenin Pilot Status op `WorkoutStrategy`.
- **Scaling Proposal Card** (`src/components/athlete/ScalingProposal.tsx`) — toont alleen als stimulus-gate een proposal terug geeft.
- **Adaptive Coach Dashboard**: bestaande `CoachDashboard.tsx` krijgt toggle op basis van `class_size`:
  - `>6` → `CoachQuickCues` prominent (Group / Safety view)
  - `≤6` → `CoachDeepDive` + `CoachIntelligenceBar` (Tactical view)
  Toggle is automatisch + handmatig override (knop).
- **Fatigue Timeline**: bestaande `FatigueTimelineInteractive` blijft, krijgt overlay-laag voor micro-rest markers.

## 5. Sync & Fallback

- `useStrategyContext` hook bundelt `Promise.all([snapshot, session, wearable, movements])`.
- Wanneer geen wearable van vandaag → val terug op `profiles.subjective_wellness` (1–10 → 0–1) of leeftijd/geslacht baseline (`recoveryFromAgeGender`).
- Engine pas rekenen wanneer `ready === true`.

## 6. Out of scope

- Echte wearable-ingest (mock blijft)
- Push notificaties
- LLM/AI text generatie (deterministisch)
- Auth/route wijzigingen

## Bestanden

Nieuw:
- `supabase/migrations/<ts>_contextual_intelligence.sql`
- `src/lib/decisionHierarchy.ts`
- `src/lib/cnsBuffer.ts`
- `src/components/athlete/GoalAlignmentBadge.tsx`
- `src/components/athlete/ScalingProposal.tsx`
- `src/hooks/useStrategyContext.ts`

Aangepast:
- `src/lib/fatigueEngine.ts` (gripLoad veld + micro-rest hook)
- `src/pages/WorkoutStrategy.tsx` (pipeline + nieuwe cards)
- `src/pages/CoachDashboard.tsx` (adaptive view switch)
- `src/hooks/useTodaySession.ts` (nieuwe velden meenemen)
- `src/integrations/supabase/types.ts` (auto na migratie)
