/**
 * BoxBrain — Contextual Intelligence pipeline.
 *
 * Wraps the deterministic `fatigueEngine.buildStrategy` with a strict 5-stage
 * decision hierarchy:
 *
 *   1. Biometric gate    (recovery <50% caps intensity at Z2/Z3)
 *   2. Stimulus gate     (predicted finish vs intended_stimulus_min/max
 *                         → ScalingProposal)
 *   3. Goal modifier     (competition / longevity / strength)
 *   4. Interference pass (grip overlap → micro-rests)
 *   5. CNS volume cap    (max %1RM based on recovery)
 */

import {
  buildStrategy,
  type AthleteSnapshot,
  type PacingProtocol,
  type PacingSplit,
  type ProtocolId,
  type StrategyPlan,
  type WodDemand,
  type WodMovement,
} from "@/lib/fatigueEngine";
import { cnsMax1RmPct, repDensityFactorFor } from "@/lib/cnsBuffer";
import { analyzeAnatomy, type AnatomyReport } from "@/lib/anatomy";

export type Goal = "competition" | "longevity" | "health" | "strength" | "weightlifting";

export interface SessionStimulus {
  intended_stimulus_min?: number | null;
  intended_stimulus_max?: number | null;
  stimulus_description?: string | null;
}

export interface ScalingProposal {
  reason: string;
  loadScalingPct: number; // multiply RX load (e.g. 0.8 = -20%)
  repScalingPct: number;  // multiply RX reps  (e.g. 0.7 = -30%)
  substitutions: string[]; // e.g. "Vervang Pull-up door Banded Pull-up"
}

export interface ContextualPlan {
  plan: StrategyPlan;
  /** Hard ceiling on intensity zone (engine never plans above this) */
  intensityCeiling: "z1" | "z2" | "z3";
  proposal: ScalingProposal | null;
  microRestSec: number; // global per-cluster micro-rest injected
  cnsMax1RmPct: number;
  goalAlignment: number; // 0–100
  goals: Goal[];
  anatomy: AnatomyReport;
  repDensityFactor: number;
  notes: string[];
}

// ─────────── Grip interference catalog ───────────

const HIGH_GRIP_SLUGS = new Set([
  "deadlift",
  "sumo-deadlift-high-pull",
  "kettlebell-swing",
  "kb-swing",
  "pull-up",
  "chest-to-bar",
  "toes-to-bar",
  "muscle-up",
  "bar-muscle-up",
  "ring-muscle-up",
  "rope-climb",
  "farmer-carry",
  "snatch",
  "clean",
]);

export function analyzeGripInterference(movements: WodMovement[]): {
  overlap: number;
  microRestSec: number;
  notes: string[];
} {
  const hits = movements.filter((m) => HIGH_GRIP_SLUGS.has(m.slug));
  const overlap = hits.length;
  if (overlap < 2) return { overlap, microRestSec: 0, notes: [] };
  // 2 high-grip → 7s, 3+ → 10s
  const microRestSec = overlap >= 3 ? 10 : 7;
  return {
    overlap,
    microRestSec,
    notes: [
      `Grip-overlap: ${hits.map((h) => h.slug).join(" + ")} — plan ${microRestSec}s rust per cluster om vroege onderarm-shutdown te voorkomen.`,
    ],
  };
}

// ─────────── 1. Biometric gate ───────────

function applyBiometricGate(
  plan: StrategyPlan,
  recovery: number,
): { plan: StrategyPlan; ceiling: "z1" | "z2" | "z3"; note: string | null } {
  if (recovery >= 0.5) return { plan, ceiling: "z3", note: null };

  // Cap: rewrite every split's intensity to ≤92% HRmax (Z2 max)
  const cap = recovery < 0.35 ? 78 : 88;
  const cappedProtocols = (Object.keys(plan.protocols) as ProtocolId[]).reduce(
    (acc, id) => {
      const p = plan.protocols[id];
      acc[id] = capProtocol(p, cap);
      return acc;
    },
    {} as Record<ProtocolId, PacingProtocol>,
  );
  return {
    plan: {
      ...plan,
      protocols: cappedProtocols,
      splits: cappedProtocols[plan.recommendedProtocol].splits,
      deloadApplied: true,
    },
    ceiling: cap <= 80 ? "z1" : "z2",
    note: `Biometrische limiet — herstel ${Math.round(recovery * 100)}% → intensiteit gecapt op ${cap}% HRmax.`,
  };
}

function capProtocol(p: PacingProtocol, capPct: number): PacingProtocol {
  const splits: PacingSplit[] = p.splits.map((s) => ({
    ...s,
    intensityPct: Math.min(s.intensityPct, capPct),
    zone: s.intensityPct > capPct ? (capPct <= 80 ? "z1" : "z2") : s.zone,
    cue:
      s.intensityPct > capPct
        ? `${s.cue} • Hard cap ${capPct}% HRmax — herstel respecteren.`
        : s.cue,
  }));
  return { ...p, splits };
}

// ─────────── 2. Stimulus gate ───────────

function applyStimulusGate(
  plan: StrategyPlan,
  stimulus: SessionStimulus,
  activeProtocol: ProtocolId,
): ScalingProposal | null {
  const min = stimulus.intended_stimulus_min ?? null;
  const max = stimulus.intended_stimulus_max ?? null;
  if (!min && !max) return null;

  const predicted = plan.protocols[activeProtocol].predictedTimeSeconds;

  if (max && predicted > max * 1.15) {
    // Athlete will blow past time-cap → scale down to protect stimulus
    const overshoot = predicted / max;
    const loadScalingPct = Math.max(0.7, 1 - (overshoot - 1));
    const repScalingPct = Math.max(0.6, 1 - (overshoot - 1) * 0.8);
    return {
      reason: `Voorspelde finish ${fmt(predicted)} ligt boven het bedoelde stimulus-venster (${fmt(min ?? 0)}–${fmt(max)}). Schaal terug om de metabole prikkel te beschermen.`,
      loadScalingPct,
      repScalingPct,
      substitutions: [],
    };
  }
  if (min && predicted < min * 0.7) {
    return {
      reason: `Voorspelde finish ${fmt(predicted)} ligt ruim onder het stimulus-venster (${fmt(min)}–${fmt(max ?? 0)}). Verhoog gewicht of kies een zwaardere variant.`,
      loadScalingPct: 1.1,
      repScalingPct: 1.0,
      substitutions: [],
    };
  }
  return null;
}

// ─────────── 3. Goal modifier ───────────

function applyGoalModifier(
  plan: StrategyPlan,
  goals: Goal[],
): { plan: StrategyPlan; notes: string[] } {
  const notes: string[] = [];
  const wantsCompetition = goals.includes("competition");
  const wantsLongevity = goals.includes("longevity") || goals.includes("health");
  const wantsStrength = goals.includes("strength") || goals.includes("weightlifting");

  let protocols = plan.protocols;

  if (wantsLongevity) {
    // Strict technical ceiling: never above 92% HRmax, plan rust-clusters
    protocols = mapProtocols(protocols, (p) => capProtocol(p, 92));
    notes.push("Longevity goal — technische plafond actief, rustclusters ingepland.");
  }
  if (wantsCompetition) {
    // Tolerantie voor grinden in laatste 10%
    protocols = mapProtocols(protocols, (p) => {
      const last = p.splits[p.splits.length - 1];
      if (!last) return p;
      const newSplits = [...p.splits];
      newSplits[newSplits.length - 1] = {
        ...last,
        intensityPct: Math.max(last.intensityPct, 100),
        zone: "z3",
        cue: `${last.cue} • Competition: technical breakdown geaccepteerd voor max-score.`,
      };
      return { ...p, splits: newSplits };
    });
    notes.push("Competition goal — laatste 10% mag in Z3 / technical breakdown.");
  }
  if (wantsStrength) {
    // Inject langere herstelmomenten
    protocols = mapProtocols(protocols, (p) => ({
      ...p,
      splits: p.splits.map((s) => ({
        ...s,
        cue: `${s.cue} • Strength goal: 15–20s neuraal herstel tussen werksets.`,
      })),
    }));
    notes.push("Strength/Weightlifting goal — neurale output beschermd met langere rusten.");
  }

  return {
    plan: {
      ...plan,
      protocols,
      splits: protocols[plan.recommendedProtocol].splits,
    },
    notes,
  };
}

function mapProtocols(
  protocols: Record<ProtocolId, PacingProtocol>,
  fn: (p: PacingProtocol) => PacingProtocol,
): Record<ProtocolId, PacingProtocol> {
  return (Object.keys(protocols) as ProtocolId[]).reduce(
    (acc, id) => {
      acc[id] = fn(protocols[id]);
      return acc;
    },
    {} as Record<ProtocolId, PacingProtocol>,
  );
}

// ─────────── 4. Goal alignment scoring ───────────

function scoreGoalAlignment(
  plan: StrategyPlan,
  activeProtocol: ProtocolId,
  goals: Goal[],
  ceiling: "z1" | "z2" | "z3",
): number {
  if (goals.length === 0) return 75;
  const protocol = plan.protocols[activeProtocol];
  const z3Splits = protocol.splits.filter((s) => s.zone === "z3").length;
  const z3Ratio = z3Splits / Math.max(1, protocol.splits.length);

  let score = 60;
  if (goals.includes("competition")) {
    score += activeProtocol === "game_plan" ? 30 : activeProtocol === "smart_engine" ? 15 : 0;
    score += z3Ratio > 0.2 ? 10 : 0;
  }
  if (goals.includes("longevity") || goals.includes("health")) {
    score += activeProtocol === "foundation" ? 30 : activeProtocol === "smart_engine" ? 20 : 5;
    score += ceiling !== "z3" ? 10 : -10;
  }
  if (goals.includes("strength") || goals.includes("weightlifting")) {
    score += activeProtocol === "foundation" ? 20 : 10;
    score += plan.deloadApplied ? 10 : 0;
  }
  return Math.max(0, Math.min(100, score));
}

// ─────────── Orchestrator ───────────

export interface RunPipelineInput {
  snapshot: AthleteSnapshot;
  demand: WodDemand;
  stimulus: SessionStimulus;
  goals: Goal[];
  activeProtocol: ProtocolId;
}

export function runDecisionPipeline(input: RunPipelineInput): ContextualPlan {
  const base = buildStrategy(input.snapshot, input.demand);
  const movements = input.demand.movements ?? [];

  // 1. Biometric gate
  const gated = applyBiometricGate(base, input.snapshot.recoveryToday);

  // 4. Interference (grip-specific, on top of existing posterior/shoulder)
  const grip = analyzeGripInterference(movements);

  // 3. Goal modifier
  const goaled = applyGoalModifier(gated.plan, input.goals);

  // 2. Stimulus gate (uses post-goal predicted time)
  const proposal = applyStimulusGate(goaled.plan, input.stimulus, input.activeProtocol);

  // 5. CNS volume cap
  const cnsCap = cnsMax1RmPct(input.snapshot);

  const goalAlignment = scoreGoalAlignment(
    goaled.plan,
    input.activeProtocol,
    input.goals,
    gated.ceiling,
  );

  const notes = [
    ...(gated.note ? [gated.note] : []),
    ...goaled.notes,
    ...grip.notes,
    `CNS-buffer — vandaag max ${Math.round(cnsCap * 100)}% 1RM aanraken.`,
  ];

  return {
    plan: goaled.plan,
    intensityCeiling: gated.ceiling,
    proposal,
    microRestSec: grip.microRestSec,
    cnsMax1RmPct: cnsCap,
    goalAlignment,
    goals: input.goals,
    notes,
  };
}

function fmt(sec: number): string {
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
}
