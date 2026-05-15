import type { AthleteProfile } from "@/contexts/AthleteContext";
import type { AthleteSnapshot } from "@/lib/fatigueEngine";
import { parseTimeToSeconds } from "@/lib/onboardingSync";

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Derive an AthleteSnapshot + benchmark times from the locally-entered
 * onboarding profile (AthleteContext). Used as a fallback when no DB
 * records exist yet (e.g. unauthenticated demo flow).
 *
 * Returns null if the user has not completed onboarding.
 */
export function snapshotFromLocalProfile(profile: AthleteProfile | null | undefined): {
  snapshot: AthleteSnapshot;
  benchmarkTimes: Record<string, number>;
  unbroken: Record<string, number>;
} | null {
  if (!profile) return null;
  const hasAny =
    Object.values(profile.maxLifts).some((v) => Number(v) > 0) ||
    Object.values(profile.gymnastics).some((v) => Number(v) > 0) ||
    Object.values(profile.benchmarks).some((v) => v && v.trim().length > 0);
  if (!hasAny) return null;

  const bw = 75; // onboarding does not capture bodyweight; assume average

  const bsRatio = (profile.maxLifts.backSquat || 0) / bw;
  const dlRatio = (profile.maxLifts.deadlift || 0) / bw;
  const strengthScore = clamp01(((bsRatio / 2.0) + (dlRatio / 2.5)) / 2);

  const pu = (profile.gymnastics.maxPullups || 0) / 25;
  const hspu = (profile.gymnastics.maxHSPU || 0) / 15;
  const du = (profile.gymnastics.maxDoubleUnders || 0) / 100;
  const gymnasticsScore = clamp01((pu + hspu + du) / 3);

  const benchmarkTimes: Record<string, number> = {};
  for (const [slug, raw] of Object.entries(profile.benchmarks)) {
    const sec = parseTimeToSeconds(raw);
    if (sec != null) benchmarkTimes[slug] = sec;
  }
  const fran = benchmarkTimes["fran"];
  const helen = benchmarkTimes["helen"];
  const FRAN_REF = 240;
  const HELEN_REF = 540;
  const engineScore = clamp01(
    (fran ? clamp01(FRAN_REF / fran) : 0.5) * 0.5 +
      (helen ? clamp01(HELEN_REF / helen) : 0.5) * 0.5,
  );

  const unbroken: Record<string, number> = {
    "pull-up": profile.gymnastics.maxPullups || 0,
    "handstand-push-up": profile.gymnastics.maxHSPU || 0,
    "ring-muscle-up": profile.gymnastics.maxMuscleUps || 0,
    "double-under": profile.gymnastics.maxDoubleUnders || 0,
  };

  return {
    snapshot: {
      age: profile.age || 30,
      engineScore,
      strengthScore,
      gymnasticsScore,
      recoveryToday: 0.7,
      redlinePct: 0.9,
      recoveryFactor: 1.0,
      correctionFactor: 1.0,
      mentalResilience: 0.5,
      unbrokenByMovement: unbroken,
    },
    benchmarkTimes,
    unbroken,
  };
}
