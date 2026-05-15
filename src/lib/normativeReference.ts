import normative from "./normativeData.json";
import type { AthleteSnapshot } from "./fatigueEngine";

export type ArchetypeLevel = "Beginner" | "Intermediate" | "Advanced/RX";

interface BaseBenchmark {
  back_squat_bw: number;
  deadlift_bw: number;
  row_2km_pace: string;
  pull_ups_unbroken: number;
  burpee_cycle_time: number;
}

interface DegradationFactor {
  strength: number;
  cardio: number;
}

export interface PerformanceArchetype {
  level: ArchetypeLevel;
  base: BaseBenchmark;
  /** Strength multiplier from age degradation (1.0 = peak) */
  strengthFactor: number;
  /** Cardio multiplier from age degradation (>1 = slower) */
  cardioFactor: number;
}

const BASE = normative.base_benchmarks as Record<string, BaseBenchmark>;
const MATRIX = normative.degradation_matrix as Record<string, DegradationFactor>;

// Beginner derived as ~60% of Intermediate strength, ~115% slower cardio
const BEGINNER_BASE: BaseBenchmark = {
  back_squat_bw: BASE.Intermediate.back_squat_bw * 0.6,
  deadlift_bw: BASE.Intermediate.deadlift_bw * 0.65,
  row_2km_pace: "2:20",
  pull_ups_unbroken: 0,
  burpee_cycle_time: BASE.Intermediate.burpee_cycle_time * 1.4,
};

function parsePace(pace: string): number {
  const m = pace.match(/(\d+):(\d+)/);
  if (!m) return 120;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

function degradationForAge(age: number): DegradationFactor {
  if (age >= 65) return MATRIX["65-70+"];
  if (age >= 55) return MATRIX["55-64"];
  if (age >= 45) return MATRIX["45-54"];
  if (age >= 35) return MATRIX["35-44"];
  return MATRIX["18-34"];
}

/** Map experience tier to archetype, applying age-based degradation */
export function archetypeForExperience(
  experience?: string | null,
  age = 30,
): PerformanceArchetype {
  const e = (experience ?? "").toLowerCase();
  const level: ArchetypeLevel =
    e === "advanced" || e === "elite"
      ? "Advanced/RX"
      : e === "intermediate"
        ? "Intermediate"
        : "Beginner";
  const base =
    level === "Advanced/RX"
      ? BASE.Advanced_RX
      : level === "Intermediate"
        ? BASE.Intermediate
        : BEGINNER_BASE;
  const deg = degradationForAge(age);
  return {
    level,
    base,
    strengthFactor: deg.strength,
    cardioFactor: deg.cardio,
  };
}

export function snapshotFromArchetype(
  archetype: PerformanceArchetype,
  age = 30,
): AthleteSnapshot {
  const idx =
    archetype.level === "Advanced/RX" ? 2 : archetype.level === "Intermediate" ? 1 : 0;
  const base = (idx + 1) / 3;
  const bs = archetype.base.back_squat_bw * archetype.strengthFactor;
  const dl = archetype.base.deadlift_bw * archetype.strengthFactor;
  return {
    age,
    engineScore: Math.min(1, (base * 0.95) / archetype.cardioFactor),
    strengthScore: Math.min(1, (bs / 2.0 + dl / 2.5) / 2),
    gymnasticsScore: Math.min(1, archetype.base.pull_ups_unbroken / 25),
    recoveryToday: 0.7,
    redlinePct: idx === 2 ? 0.92 : idx === 1 ? 0.88 : 0.82,
    recoveryFactor: 1.0,
    correctionFactor: 1.0,
    mentalResilience: 0.4 + idx * 0.2,
    unbrokenByMovement: {
      "pull-up": archetype.base.pull_ups_unbroken,
    },
  };
}

export function benchmarkTimesFromArchetype(
  archetype: PerformanceArchetype,
): Record<string, number> {
  const fran =
    archetype.level === "Advanced/RX" ? 240 : archetype.level === "Intermediate" ? 360 : 540;
  const helen =
    archetype.level === "Advanced/RX" ? 540 : archetype.level === "Intermediate" ? 720 : 960;
  const rowSecPer500 = parsePace(archetype.base.row_2km_pace) * archetype.cardioFactor;
  return {
    fran: fran * archetype.cardioFactor,
    helen: helen * archetype.cardioFactor,
    "row-2km": rowSecPer500 * 4,
  };
}

export function getArchetypes(): PerformanceArchetype[] {
  return (["Beginner", "Intermediate", "Advanced/RX"] as ArchetypeLevel[]).map((lvl) =>
    archetypeForExperience(lvl === "Advanced/RX" ? "advanced" : lvl.toLowerCase(), 30),
  );
}
