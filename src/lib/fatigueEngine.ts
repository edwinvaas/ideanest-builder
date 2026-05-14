/**
 * BoxBrain Fatigue & Strategy Engine
 *
 * Pure functions — no I/O — that derive an athlete's anaerobic threshold,
 * redline heart-rate, expected workout duration and "Fatigue Point" timeline
 * from their raw benchmark/lift/recovery numbers.
 */

export interface AthleteSnapshot {
  age: number;
  /** Aggregate engine score 0-1 derived from benchmarks + recovery */
  engineScore: number;
  /** Aggregate strength score 0-1 derived from 1RMs vs bodyweight */
  strengthScore: number;
  /** Aggregate gymnastics score 0-1 derived from unbroken capacities */
  gymnasticsScore: number;
  /** Recovery 0-1 (today) — defaults to 0.7 if not measured */
  recoveryToday: number;
  /** Per-athlete redline (% of HR-max) — read from fatigue_profiles */
  redlinePct: number;
  /** Per-athlete recovery factor — how fast they bounce back */
  recoveryFactor: number;
}

export interface WodDemand {
  /** Estimated total work duration in seconds for an "average" athlete */
  expectedTimeSeconds: number;
  /** Energy-system distribution, must sum ~100 */
  phosphagen: number;
  glycolytic: number;
  oxidative: number;
  /** Which capacity matters most */
  dominantLimiter: "engine" | "strength" | "gymnastics";
}

export interface PacingSplit {
  label: string;
  startSec: number;
  endSec: number;
  intensityPct: number; // 0-100 of redline
  cue: string;
}

export interface StrategyPlan {
  estimatedMaxHr: number;
  anaerobicThresholdBpm: number;
  redlineBpm: number;
  /** Predicted seconds until the athlete crosses their anaerobic threshold */
  fatiguePointSeconds: number;
  /** Predicted finish time for THIS athlete */
  predictedTimeSeconds: number;
  /** Pacing breakdown — first/middle/finish thirds */
  splits: PacingSplit[];
  /** One-paragraph coach voice */
  advice: string;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** Tanaka formula — more accurate than 220 - age above 35 */
export function estimateMaxHr(age: number): number {
  return Math.round(208 - 0.7 * age);
}

/**
 * Aerobic capacity → fraction of HR-max where the athlete crosses lactate
 * threshold. Better engines push the threshold higher.
 */
export function anaerobicThresholdPct(snapshot: AthleteSnapshot): number {
  const base = 0.78; // average athlete: 78% of HR-max
  const engineLift = (snapshot.engineScore - 0.5) * 0.12; // ±6%
  const recoveryLift = (snapshot.recoveryToday - 0.7) * 0.05;
  return clamp(base + engineLift + recoveryLift, 0.7, 0.92);
}

/** How much earlier/later this athlete will finish vs the average. */
export function performanceMultiplier(
  snapshot: AthleteSnapshot,
  demand: WodDemand,
): number {
  const focusScore =
    demand.dominantLimiter === "engine"
      ? snapshot.engineScore
      : demand.dominantLimiter === "strength"
        ? snapshot.strengthScore
        : snapshot.gymnasticsScore;
  // 0.5 → average. <0.5 = slower. >0.5 = faster.
  // Each 0.1 above/below average = ~6% time delta.
  return clamp(1 - (focusScore - 0.5) * 0.6, 0.55, 1.4);
}

/**
 * Core: turn an athlete + a workout into a full pacing strategy.
 */
export function buildStrategy(
  snapshot: AthleteSnapshot,
  demand: WodDemand,
): StrategyPlan {
  const maxHr = estimateMaxHr(snapshot.age);
  const atPct = anaerobicThresholdPct(snapshot);
  const atBpm = Math.round(maxHr * atPct);
  const redlineBpm = Math.round(maxHr * snapshot.redlinePct);

  const mult = performanceMultiplier(snapshot, demand);
  const predicted = Math.round(demand.expectedTimeSeconds * mult);

  // Predicted time the athlete crosses lactate threshold and starts
  // accumulating fatigue faster than they can clear it.
  // Higher recovery factor delays the crossover.
  const fatigueFraction = clamp(
    0.45 + (snapshot.engineScore - 0.5) * 0.3 + (snapshot.recoveryFactor - 1) * 0.2,
    0.25,
    0.75,
  );
  const fatiguePoint = Math.round(predicted * fatigueFraction);

  // Energy-aware pacing curve
  const isSprint = predicted < 240; // <4 min
  const isLong = predicted > 900; // >15 min

  const splits: PacingSplit[] = isSprint
    ? [
        {
          label: "Open",
          startSec: 0,
          endSec: Math.round(predicted * 0.4),
          intensityPct: 92,
          cue: "Aanvallen — fosfageen systeem laden",
        },
        {
          label: "Hold",
          startSec: Math.round(predicted * 0.4),
          endSec: Math.round(predicted * 0.8),
          intensityPct: 96,
          cue: "Vasthouden boven drempel — adem ritmisch",
        },
        {
          label: "Empty the tank",
          startSec: Math.round(predicted * 0.8),
          endSec: predicted,
          intensityPct: 100,
          cue: "Alles geven — niets sparen",
        },
      ]
    : isLong
      ? [
          {
            label: "Sustainable open",
            startSec: 0,
            endSec: Math.round(predicted * 0.33),
            intensityPct: 78,
            cue: "Onder drempel blijven — diep neusademen",
          },
          {
            label: "Negative split",
            startSec: Math.round(predicted * 0.33),
            endSec: Math.round(predicted * 0.75),
            intensityPct: 84,
            cue: "Gestaag opbouwen — splits niet laten zakken",
          },
          {
            label: "Closeout",
            startSec: Math.round(predicted * 0.75),
            endSec: predicted,
            intensityPct: 95,
            cue: "Laatste kwart: tempo op — tank leegmaken",
          },
        ]
      : [
          {
            label: "Set the pace",
            startSec: 0,
            endSec: Math.round(predicted * 0.3),
            intensityPct: 84,
            cue: "Iets onder drempel — geen vuur opbouwen",
          },
          {
            label: "Threshold",
            startSec: Math.round(predicted * 0.3),
            endSec: Math.round(predicted * 0.7),
            intensityPct: 92,
            cue: "Op drempel rijden — split per ronde checken",
          },
          {
            label: "Push to finish",
            startSec: Math.round(predicted * 0.7),
            endSec: predicted,
            intensityPct: 99,
            cue: "Boven drempel — kort en hard",
          },
        ];

  const advice = buildAdvice(snapshot, demand, predicted, fatiguePoint);

  return {
    estimatedMaxHr: maxHr,
    anaerobicThresholdBpm: atBpm,
    redlineBpm,
    fatiguePointSeconds: fatiguePoint,
    predictedTimeSeconds: predicted,
    splits,
    advice,
  };
}

function buildAdvice(
  s: AthleteSnapshot,
  d: WodDemand,
  predicted: number,
  fatigue: number,
): string {
  const m = (sec: number) =>
    `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
  const limiter =
    d.dominantLimiter === "engine"
      ? "aëroob systeem"
      : d.dominantLimiter === "strength"
        ? "kracht (1RM-belasting)"
        : "gymnastische cycle-snelheid";
  const recovery =
    s.recoveryToday >= 0.75
      ? "Je herstel is goed — je kunt agressief starten."
      : s.recoveryToday >= 0.5
        ? "Herstel is gemiddeld — bewaar 5% in tank tot fatigue point."
        : "Herstel is laag — pak een conservatieve open en bouw op.";
  return [
    `Verwachte finish ~${m(predicted)}, fatigue point rond ${m(fatigue)}.`,
    `De grootste limiter vandaag is je ${limiter}.`,
    recovery,
    `Blijf onder ${Math.round(s.redlinePct * 100)}% HR-max tot na het fatigue point.`,
  ].join(" ");
}

/**
 * Generate a per-second timeline that the UI can plot.
 * Heart-rate climbs toward each split's target intensity, then plateaus.
 */
export function buildTimeline(
  plan: StrategyPlan,
  resolution = 5,
): Array<{ t: number; hr: number; zone: "aerobic" | "threshold" | "redline" }> {
  const points: Array<{
    t: number;
    hr: number;
    zone: "aerobic" | "threshold" | "redline";
  }> = [];
  let currentHr = Math.round(plan.estimatedMaxHr * 0.55);
  for (let t = 0; t <= plan.predictedTimeSeconds; t += resolution) {
    const split = plan.splits.find((s) => t >= s.startSec && t <= s.endSec) ?? plan.splits[plan.splits.length - 1];
    const targetHr = (plan.estimatedMaxHr * split.intensityPct) / 100;
    // ease toward target
    currentHr += (targetHr - currentHr) * 0.18;
    const hr = Math.round(currentHr);
    const zone =
      hr >= plan.redlineBpm
        ? "redline"
        : hr >= plan.anaerobicThresholdBpm
          ? "threshold"
          : "aerobic";
    points.push({ t, hr, zone });
  }
  return points;
}
