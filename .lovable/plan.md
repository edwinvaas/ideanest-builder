# Advanced Human Performance Engine

A major upgrade to the Fatigue Engine: from a single HR curve into a biomechanically aware, three-zone, multi-protocol coaching system, plus matching coach-side intelligence and a "pre-flight briefing" UI.

## Scope (one PR, in order)

### 1. Engine core (`src/lib/fatigueEngine.ts` — rewritten)
- **Movement Interference Matrix** — new `analyzeMovementInterference(movements[])`:
  - Posterior chain overload: deadlift + clean + KB swing combo → `posteriorTax` 0–1.
  - Shoulder fatigue: pull-up + overhead press overlap → `shoulderTax` 0–1.
  - Returns `fatigueShiftPct` (e.g. −0.20 when posteriorTax > threshold) that pulls the Fatigue Point earlier.
- **Density Scaling** — new `gymnasticsDensityCurve(unbrokenMax, repsPerSet)`:
  - `ratio = repsPerSet / unbrokenMax`. Linear when ratio ≤ 0.4, exponential beyond.
  - Output is a per-set fatigue multiplier consumed by the timeline.
- **3-Zone Threshold Model** — replace single redline with explicit `zones`:
  - Z1 Aerobic (<80% AT), Z2 Threshold (80–95% AT), Z3 Redline (>95% AT).
  - Each timeline point is tagged with its zone; "Danger Zone" minutes are summed for UI.
- **Recovery-driven De-load** — `applyDeload(plan, recovery)`:
  - Recovery <40% → reduce 1RM-based load percentages by 10–15% and shift protocol toward conservative.
- **Three protocols** — `buildProtocols(snapshot, demand) → { gamePlan, smartEngine, foundation }`:
  - `gamePlan`: maximize score, allow Z3 in last 2 minutes.
  - `smartEngine`: hold Z2 ≥90% of time, forced rest clusters.
  - `foundation`: stay Z1, nasal-breathing focus.
- **Pacing Clusters as text** — `formatPacingNarrative(plan)` produces lines like:
  `"Round 1–3: pace 2:10. Round 4: 2:00. Last round: all-out."`
- **Correction Factor** — engine reads `correction_factor` from `fatigue_profiles` and applies it to the anaerobic threshold before computing the timeline.

### 2. Database (one migration)
- `fatigue_profiles` add: `correction_factor numeric default 1.0`, `mental_resilience_score numeric default 0.5`.
- Update trigger `adapt_fatigue_profile`:
  - Read `expected fatigue point` (predicted) and `actual fatigue point` (from `athlete_session_results`).
  - Update `correction_factor` via EMA: faster-than-expected souring → factor <1, later → factor >1.
  - Update `mental_resilience_score` from the gap between RPE and predicted Z3 time (held high HR with low RPE → higher resilience).
- New table `coach_alerts` (id, athlete_id, session_id, type, severity, message, created_at) with RLS so coach in same box can read.

### 3. Coach intelligence
- New module `src/lib/coachInsights.ts`:
  - `detectAnomalies(athlete, latestResult, baseline)` — flags >25% deviation from baseline pace.
  - `compareToOpenGlobal(boxResults, openPercentiles)` — returns class avg vs Open percentile.
- `CoachQuickCues` and `CoachDeepDive` consume these:
  - Red "Check {Name}: prestatie wijkt sterk af" alert cards.
  - "Klas vs Open Global" summary bar (avg percentile + delta).

### 4. UI: "Pre-flight briefing" (`/strategy`)
- Restructure `WorkoutStrategy.tsx` into top-down briefing sections:
  1. **Mission** — WOD card, dominant stimulus, energy mix.
  2. **Pilot status** — engine/strength/gymnastics/recovery + de-load badge if active.
  3. **Protocol selector** — three tabs (Game Plan / Smart Engine / Foundation), default = recommended based on recovery.
  4. **Interactive timeline** — new `FatigueTimelineInteractive`:
     - Recharts area chart with three colored zone bands (Z1 green, Z2 amber, Z3 red).
     - Draggable scrubber (`<input type="range">` over chart) — moving it updates a "Now playing" panel showing the cue, target HR/zone, and cluster advice for that second.
     - Touch-friendly (swipe = drag the scrubber).
  5. **Pacing narrative** — text output of `formatPacingNarrative`.
  6. **Post-WOD feedback** (existing).
- Add a `Movement Interference` chip row showing taxation badges (e.g. "Posterior chain ↑20%").

### 5. Demo / mock fallback
- Extend `src/lib/demoMode.ts` with `DEMO_MOVEMENTS` so the interference matrix has something to chew on in demo mode.

## Technical notes

- Pure functions stay pure; no React imports in `lib/`.
- `buildStrategy` becomes the orchestrator: snapshot + demand + movements + profile → plan with `zones`, `splits`, `protocols`, `interference`, `deloadApplied`.
- Timeline output gains `zone: "z1" | "z2" | "z3"` and `cue` per point, so the scrubber doesn't need a second computation.
- All zone colors via existing semantic tokens (success, warning, destructive) + the fire gradient — no hex literals in components.
- New tables/columns: migration auto-regenerates `supabase/types.ts`.
- Persisted strategy now stores the chosen protocol id; default `smart_engine`.

## Out of scope

- Real wearable ingestion (still mocked).
- AI/LLM generation — narratives are deterministic strings from the engine.
- Coach push notifications — alerts are surfaced in-dashboard only.
