import type { AthleteSnapshot, WodMovement } from "@/lib/fatigueEngine";
import { movementBalanceCnsAdjust } from "@/lib/anatomy";

/**
 * CNS volume cap: returns the safe upper-bound % of 1RM the athlete should
 * touch today, based on recovery + mental resilience.
 *
 * <0.40 recovery → 70% (deload)
 * 0.40–0.55     → 75%
 * 0.55–0.75     → 85%
 * >0.75         → 92%
 *
 * Mental resilience nudges the cap by ±3%.
 */
export function cnsMax1RmPct(snapshot: AthleteSnapshot): number {
  const r = snapshot.recoveryToday;
  let cap = 0.85;
  if (r < 0.4) cap = 0.7;
  else if (r < 0.55) cap = 0.75;
  else if (r < 0.75) cap = 0.85;
  else cap = 0.92;
  const resilienceAdj = ((snapshot.mentalResilience ?? 0.5) - 0.5) * 0.06;
  return Math.max(0.6, Math.min(0.95, cap + resilienceAdj));
}

/**
 * Subjective wellness (1–10) → 0–1 recovery proxy.
 * Used when no wearable reading exists for today.
 */
export function recoveryFromWellness(score: number | null | undefined): number | null {
  if (!score || score < 1) return null;
  return Math.max(0.2, Math.min(1, score / 10));
}

/**
 * Age + gender baseline recovery proxy (last-resort fallback).
 * Younger athletes recover faster; female athletes use a slight HRV adjustment.
 */
export function recoveryFromAgeGender(
  age: number | null,
  gender: string | null,
): number {
  const a = age ?? 30;
  const ageFactor = a < 25 ? 0.78 : a < 35 ? 0.72 : a < 45 ? 0.66 : 0.6;
  const genderAdj = gender === "female" ? -0.02 : 0;
  return Math.max(0.45, Math.min(0.85, ageFactor + genderAdj));
}
