// UI mapping helpers — translate Intelligence Layer values to display-ready strings,
// badge colours, and icons. All label functions are pure and side-effect free.
//
// Principle: "Coaches zien beslissingen, atleten zien uitleg."
//   → Coach view: coach_brief, focus_cue, recommended_scaling per cluster
//   → Athlete view: pacing_rationale, technique_notes, scaling_options[level].modifications

import type {
  DominantStimulus,
  PacingStrategy,
  LimiterType,
  ScalingLevel,
  WodAnalysis,
} from "@/types/wod-analysis";
import type { CoachStrategy } from "@/types/intelligence";

// ─── Stimulus ────────────────────────────────────────────────────────────────

export const STIMULUS_LABEL: Record<DominantStimulus, string> = {
  aerobic_capacity:  "Aerobe capaciteit",
  lactic_threshold:  "Lactaatdrempel",
  alactic_power:     "Alactisch vermogen",
  strength_endurance:"Krachtuithoudingsvermogen",
  pure_strength:     "Maximale kracht",
  gymnastics_skill:  "Gymnastic skill",
  mixed_modal:       "Mixed modal",
};

/** Tailwind background colour for the stimulus badge */
export const STIMULUS_COLOR: Record<DominantStimulus, string> = {
  aerobic_capacity:  "bg-blue-100 text-blue-800",
  lactic_threshold:  "bg-orange-100 text-orange-800",
  alactic_power:     "bg-red-100 text-red-800",
  strength_endurance:"bg-purple-100 text-purple-800",
  pure_strength:     "bg-gray-100 text-gray-800",
  gymnastics_skill:  "bg-green-100 text-green-800",
  mixed_modal:       "bg-yellow-100 text-yellow-800",
};

// ─── Pacing ──────────────────────────────────────────────────────────────────

export const PACING_LABEL: Record<PacingStrategy, string> = {
  consistent:      "Consistent tempo",
  negative_split:  "Negative split",
  positive_split:  "Positive split",
  sprint_recover:  "Sprint / herstel",
  front_loaded:    "Front-loaded",
};

export const PACING_ICON: Record<PacingStrategy, string> = {
  consistent:      "→",
  negative_split:  "↗",
  positive_split:  "↘",
  sprint_recover:  "⚡",
  front_loaded:    "▶▶",
};

// ─── Limiters ────────────────────────────────────────────────────────────────

export const LIMITER_LABEL: Record<LimiterType, string> = {
  engine:     "Motor (aerobe basis)",
  strength:   "Kracht",
  gymnastics: "Gymnastics",
  mobility:   "Mobiliteit",
  pacing:     "Pacing",
  recovery:   "Herstel",
};

export const LIMITER_COLOR: Record<LimiterType, string> = {
  engine:     "bg-blue-500",
  strength:   "bg-red-500",
  gymnastics: "bg-green-500",
  mobility:   "bg-yellow-500",
  pacing:     "bg-orange-500",
  recovery:   "bg-purple-500",
};

/** Returns demand level label for UI tooltip */
export function limiterDemandLabel(score: number): string {
  if (score >= 0.7) return "Hoog";
  if (score >= 0.4) return "Matig";
  return "Laag";
}

// ─── Scaling ─────────────────────────────────────────────────────────────────

export const SCALING_LABEL: Record<ScalingLevel, string> = {
  rx:          "RX",
  scaled:      "Scaled",
  foundations: "Foundations",
};

export const SCALING_COLOR: Record<ScalingLevel, string> = {
  rx:          "bg-black text-white",
  scaled:      "bg-gray-200 text-gray-800",
  foundations: "bg-gray-100 text-gray-600",
};

// ─── Readiness → scaling ──────────────────────────────────────────────────────

export function resolveScaling(readiness: number): ScalingLevel {
  if (readiness >= 0.7) return "rx";
  if (readiness >= 0.4) return "scaled";
  return "foundations";
}

// ─── Coach view helpers ───────────────────────────────────────────────────────

/**
 * Returns the single most important line a coach reads before class.
 * Maps to the `coach_brief` field — already ≤500 chars, no trimming needed.
 */
export function getCoachHeadline(analysis: WodAnalysis): string {
  return analysis.coach_brief;
}

/**
 * Returns the top-level cluster decision for display in the coach dashboard.
 * Format: "Engine-beperkt (3 atleten) → Scaled | Let op: Thrusters, Box Jumps"
 */
export function formatClusterDecision(strategy: CoachStrategy): string {
  const athletes = `${strategy.cluster.athlete_count} atleet${strategy.cluster.athlete_count !== 1 ? "en" : ""}`;
  const scaling = SCALING_LABEL[strategy.recommended_scaling];
  const movements = strategy.watch_movements.slice(0, 2).join(", ");
  return `${strategy.cluster.label} (${athletes}) → ${scaling}${movements ? ` | Let op: ${movements}` : ""}`;
}

// ─── Athlete view helpers ─────────────────────────────────────────────────────

/**
 * Returns athlete-facing pacing instruction.
 * Uses pacing_rationale (explanatory) instead of coach_brief (directive).
 */
export function getAthletePacingExplanation(analysis: WodAnalysis): string {
  return `${PACING_ICON[analysis.recommended_pacing]} ${PACING_LABEL[analysis.recommended_pacing]} — ${analysis.pacing_rationale}`;
}

/**
 * Returns athlete-facing scaling modifications for a given level.
 * Returns null if the requested level is not present in scaling_options.
 */
export function getScalingModifications(
  analysis: WodAnalysis,
  level: ScalingLevel,
): string[] | null {
  return analysis.scaling_options.find((s) => s.level === level)?.modifications ?? null;
}

/**
 * Returns athlete-facing technique notes for a specific movement.
 * Returns null if no notes exist for that movement name.
 */
export function getMovementNote(analysis: WodAnalysis, movementName: string): string | null {
  return (
    analysis.movements.find(
      (m) => m.name.toLowerCase() === movementName.toLowerCase(),
    )?.technique_notes ?? null
  );
}
