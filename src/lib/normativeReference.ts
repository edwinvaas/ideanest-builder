import normative from "./normativeData.json";
import type { AthleteSnapshot } from "./fatigueEngine";

export type ArchetypeLevel = "Beginner" | "Intermediate" | "Advanced/RX";

export interface PerformanceArchetype {
  level: ArchetypeLevel;
  description: string;
  strength_ratios_bw: Record<string, number>;
  cardio_paces: Record<string, string>;
  gymnastics_unbroken_max: Record<string, number>;
  movement_cycle_times_sec: Record<string, number>;
  recovery_profile: {
    cns_fatigue_threshold: "Low" | "Medium" | "High";
    recommended_rest_multiplier: number;
  };
}

const ARCHETYPES = normative.performance_archetypes as PerformanceArchetype[];

export function getArchetypes(): PerformanceArchetype[] {
  return ARCHETYPES;
}

/** Map experience tier to archetype */
export function archetypeForExperience(
  experience?: string | null,
): PerformanceArchetype {
  const e = (experience ?? "").toLowerCase();
  if (e === "advanced" || e === "elite") return ARCHETYPES[2];
  if (e === "intermediate") return ARCHETYPES[1];
  return ARCHETYPES[0];
}

/** Parse "1:55 - 2:05 /500m" → midpoint seconds per 500m */
function midRangeSeconds(range: string): number {
  const m = range.match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/);
  if (!m) return 0;
  const a = parseInt(m[1]) * 60 + parseInt(m[2]);
  const b = parseInt(m[3]) * 60 + parseInt(m[4]);
  return (a + b) / 2;
}

/**
 * Derive a synthetic AthleteSnapshot from an archetype so engine UI works
 * for athletes without their own benchmarks.
 */
export function snapshotFromArchetype(
  archetype: PerformanceArchetype,
  age = 30,
): AthleteSnapshot {
  const idx = ARCHETYPES.indexOf(archetype); // 0..2
  const base = (idx + 1) / 3; // 0.33 / 0.67 / 1.0
  return {
    age,
    engineScore: Math.min(1, base * 0.95),
    strengthScore: Math.min(
      1,
      (archetype.strength_ratios_bw.back_squat / 2.0 +
        archetype.strength_ratios_bw.deadlift / 2.5) /
        2,
    ),
    gymnasticsScore: Math.min(
      1,
      (archetype.gymnastics_unbroken_max.pull_ups / 25 +
        archetype.gymnastics_unbroken_max.toes_to_bar / 20) /
        2,
    ),
    recoveryToday: 0.7,
    redlinePct: idx === 2 ? 0.92 : idx === 1 ? 0.88 : 0.82,
    recoveryFactor: 1 / archetype.recovery_profile.recommended_rest_multiplier,
    correctionFactor: 1.0,
    mentalResilience: 0.4 + idx * 0.2,
    unbrokenByMovement: {
      "pull-up": archetype.gymnastics_unbroken_max.pull_ups,
      "push-up": archetype.gymnastics_unbroken_max.push_ups,
      "toes-to-bar": archetype.gymnastics_unbroken_max.toes_to_bar,
      "air-squat": archetype.gymnastics_unbroken_max.air_squats,
    },
  };
}

/** Reference benchmark times derived from cardio paces (rough estimates) */
export function benchmarkTimesFromArchetype(
  archetype: PerformanceArchetype,
): Record<string, number> {
  const rowSecPer500 = midRangeSeconds(archetype.cardio_paces.row_2km);
  const fran =
    archetype.level === "Advanced/RX"
      ? 240
      : archetype.level === "Intermediate"
        ? 360
        : 540;
  const helen =
    archetype.level === "Advanced/RX"
      ? 540
      : archetype.level === "Intermediate"
        ? 720
        : 960;
  return {
    fran,
    helen,
    "row-2km": rowSecPer500 * 4,
  };
}
