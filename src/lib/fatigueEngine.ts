/**
 * BoxBrain Advanced Human Performance Engine
 *
 * Pure, deterministic functions — no I/O.
 *
 * Inputs:  athlete snapshot + workout demand + (optional) movement list +
 *          (optional) learned profile (correction factor, resilience).
 * Outputs: 3-zone HR timeline, three pacing protocols, biomechanical
 *          interference taxation, recovery-driven de-load advice and a
 *          coach-voice narrative.
 */

// ───────────────────────── Types ─────────────────────────

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
  /** Per-athlete learned correction factor (default 1.0) */
  correctionFactor?: number;
  /** Per-athlete mental resilience score 0-1 (default 0.5) */
  mentalResilience?: number;
  /** Top unbroken-rep capacities by movement slug (e.g. "pull-up": 25) */
  unbrokenByMovement?: Record<string, number>;
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
  /** Optional: parsed movements appearing in the WOD */
  movements?: WodMovement[];
  /** Optional rounds (for density calc). Defaults to 1. */
  rounds?: number;
  /** Optional plain-text description; engine will scan it for movements. */
  description?: string;
}

export interface WodMovement {
  /** Lower-cased slug, e.g. "deadlift", "pull-up", "thruster" */
  slug: string;
  /** Reps per round (or per set). Optional. */
  reps?: number;
  /** True if this is a 1RM-graded movement (load-based). */
  isLoaded?: boolean;
}

export type Zone = "z1" | "z2" | "z3";

export interface PacingSplit {
  label: string;
  startSec: number;
  endSec: number;
  /** Target intensity as % of HR-max */
  intensityPct: number;
  /** Coach voice cue for this segment */
  cue: string;
  /** Dominant zone in this split */
  zone: Zone;
}

export interface InterferenceReport {
  posteriorTax: number; // 0-1
  shoulderTax: number; // 0-1
  /** Negative = fatigue point pulled earlier (e.g. -0.20 = 20% earlier) */
  fatigueShiftPct: number;
  notes: string[];
}

export type ProtocolId = "game_plan" | "smart_engine" | "foundation";

export interface PacingProtocol {
  id: ProtocolId;
  name: string;
  tagline: string;
  splits: PacingSplit[];
  narrative: string;
  /** Loaded-movement scaling, e.g. 0.85 for a de-load */
  loadScalingPct: number;
  /** Predicted finish time for THIS protocol (seconds) */
  predictedTimeSeconds: number;
  /** Predicted fatigue point for THIS protocol (seconds) */
  fatiguePointSeconds: number;
}

export interface TimelinePoint {
  t: number;
  hr: number;
  zone: Zone;
  cue: string;
  intensityPct: number;
}

export interface StrategyPlan {
  estimatedMaxHr: number;
  anaerobicThresholdBpm: number;
  redlineBpm: number;
  /** Predicted seconds until the athlete crosses the anaerobic threshold */
  fatiguePointSeconds: number;
  /** Predicted finish time for THIS athlete */
  predictedTimeSeconds: number;
  interference: InterferenceReport;
  /** True when recovery-driven de-load was applied */
  deloadApplied: boolean;
  /** Recommended protocol id (used as the default) */
  recommendedProtocol: ProtocolId;
  protocols: Record<ProtocolId, PacingProtocol>;
  /** Convenience: splits of the recommended protocol */
  splits: PacingSplit[];
  /** Coach-voice paragraph */
  advice: string;
  /** Density assessment per gymnastics movement found in the WOD */
  density: DensityAssessment[];
}

export interface DensityAssessment {
  slug: string;
  repsPerSet: number;
  unbrokenMax: number;
  ratio: number;
  /** Per-set fatigue multiplier (1.0 = neutral, >1 = exponential pile-up) */
  fatigueMultiplier: number;
  curve: "linear" | "exponential";
}

// ───────────────────────── Helpers ─────────────────────────

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** Tanaka formula — more accurate than 220 - age above 35 */
export function estimateMaxHr(age: number): number {
  return Math.round(208 - 0.7 * age);
}

/**
 * Aerobic capacity → fraction of HR-max where the athlete crosses lactate
 * threshold. Engine + correction factor + recovery push the threshold.
 */
export function anaerobicThresholdPct(snapshot: AthleteSnapshot): number {
  const base = 0.78;
  const engineLift = (snapshot.engineScore - 0.5) * 0.12;
  const recoveryLift = (snapshot.recoveryToday - 0.7) * 0.05;
  const correction = (snapshot.correctionFactor ?? 1) - 1; // ±0.3 max
  return clamp(base + engineLift + recoveryLift + correction * 0.05, 0.7, 0.92);
}

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
  return clamp(1 - (focusScore - 0.5) * 0.6, 0.55, 1.4);
}

// ───────────── 1. Movement Interference Matrix ─────────────

const POSTERIOR_SLUGS = new Set([
  "deadlift",
  "sumo-deadlift-high-pull",
  "clean",
  "power-clean",
  "squat-clean",
  "hang-clean",
  "kettlebell-swing",
  "kb-swing",
  "snatch",
  "power-snatch",
  "good-morning",
]);

const SHOULDER_PULL_SLUGS = new Set([
  "pull-up",
  "chest-to-bar",
  "muscle-up",
  "bar-muscle-up",
  "ring-muscle-up",
  "toes-to-bar",
]);

const SHOULDER_PRESS_SLUGS = new Set([
  "shoulder-press",
  "push-press",
  "push-jerk",
  "split-jerk",
  "thruster",
  "handstand-push-up",
  "overhead-squat",
  "snatch",
  "power-snatch",
]);

/** Scan a description string for known movement slugs. */
export function parseMovementsFromText(text: string): WodMovement[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = new Set<string>();
  const ALL = new Set<string>([
    ...POSTERIOR_SLUGS,
    ...SHOULDER_PULL_SLUGS,
    ...SHOULDER_PRESS_SLUGS,
    "thruster",
    "wall-ball",
    "burpee",
    "row",
    "double-under",
    "box-jump",
    "front-squat",
    "back-squat",
  ]);
  ALL.forEach((slug) => {
    const variants = [slug, slug.replace(/-/g, " "), slug.replace(/-/g, "")];
    if (variants.some((v) => lower.includes(v))) found.add(slug);
  });
  // Try to grab "21-15-9" / "10 reps" hints
  const repMatch = lower.match(/(\d+)[\s-]+(\d+)[\s-]+(\d+)/);
  const defaultReps = repMatch
    ? Math.round((+repMatch[1] + +repMatch[2] + +repMatch[3]) / 3)
    : undefined;
  return [...found].map((slug) => ({
    slug,
    reps: defaultReps,
    isLoaded:
      POSTERIOR_SLUGS.has(slug) ||
      SHOULDER_PRESS_SLUGS.has(slug) ||
      slug === "front-squat" ||
      slug === "back-squat",
  }));
}

export function analyzeMovementInterference(
  movements: WodMovement[],
): InterferenceReport {
  const slugs = new Set(movements.map((m) => m.slug));
  const posteriorHits = [...POSTERIOR_SLUGS].filter((s) => slugs.has(s)).length;
  const pullHits = [...SHOULDER_PULL_SLUGS].filter((s) => slugs.has(s)).length;
  const pressHits = [...SHOULDER_PRESS_SLUGS].filter((s) => slugs.has(s)).length;

  const posteriorTax = clamp(posteriorHits / 3, 0, 1); // 3 posterior moves = max
  const shoulderTax = clamp(
    pullHits > 0 && pressHits > 0 ? (pullHits + pressHits) / 4 : 0,
    0,
    1,
  );
  const notes: string[] = [];
  if (posteriorTax >= 0.5)
    notes.push(
      `Posterior chain stack (${posteriorHits} bewegingen) — fatigue ~20% eerder.`,
    );
  if (shoulderTax >= 0.5)
    notes.push(
      `Schouderoverlap pull + press (${pullHits + pressHits}) — armen verzuren snel.`,
    );

  // Fatigue shift: weighted, capped at -25%
  const fatigueShiftPct = -clamp(posteriorTax * 0.2 + shoulderTax * 0.1, 0, 0.25);
  return { posteriorTax, shoulderTax, fatigueShiftPct, notes };
}

// ───────────── 1b. Density scaling for gymnastics ─────────────

export function gymnasticsDensityCurve(
  unbrokenMax: number,
  repsPerSet: number,
): { multiplier: number; curve: "linear" | "exponential" } {
  if (unbrokenMax <= 0) return { multiplier: 1.5, curve: "exponential" };
  const ratio = repsPerSet / unbrokenMax;
  if (ratio <= 0.4) return { multiplier: 1.0, curve: "linear" };
  // Exponential: doubles as ratio approaches 1.0
  const mult = 1 + Math.pow(ratio - 0.4, 1.7) * 2.5;
  return { multiplier: clamp(mult, 1.0, 2.2), curve: "exponential" };
}

function assessDensity(
  movements: WodMovement[],
  unbrokenByMovement: Record<string, number> | undefined,
): DensityAssessment[] {
  if (!unbrokenByMovement) return [];
  const out: DensityAssessment[] = [];
  movements.forEach((m) => {
    if (!SHOULDER_PULL_SLUGS.has(m.slug) && m.slug !== "double-under") return;
    if (!m.reps) return;
    const max = unbrokenByMovement[m.slug] ?? 0;
    const { multiplier, curve } = gymnasticsDensityCurve(max, m.reps);
    out.push({
      slug: m.slug,
      repsPerSet: m.reps,
      unbrokenMax: max,
      ratio: max ? m.reps / max : 1,
      fatigueMultiplier: multiplier,
      curve,
    });
  });
  return out;
}

// ───────────── 2. 3-Zone Threshold Model ─────────────

export function classifyZone(
  hr: number,
  atBpm: number,
  redlineBpm: number,
): Zone {
  if (hr >= redlineBpm) return "z3";
  if (hr >= atBpm * 0.95) return "z3";
  if (hr >= atBpm * 0.8) return "z2";
  return "z1";
}

// ───────────── 3. Three protocols ─────────────

/** Per-protocol pacing characteristics applied to baseline predicted time. */
export const PROTOCOL_FACTORS: Record<
  ProtocolId,
  { timeFactor: number; fatigueFactor: number }
> = {
  // Aggressive — finishes faster but fatigue point arrives earlier
  game_plan: { timeFactor: 0.92, fatigueFactor: 0.82 },
  // Baseline reference
  smart_engine: { timeFactor: 1.0, fatigueFactor: 1.0 },
  // Conservative Z1 work — slower finish, fatigue point pushed far back
  foundation: { timeFactor: 1.18, fatigueFactor: 1.45 },
};

function buildProtocol(
  id: ProtocolId,
  protocolPredicted: number,
  protocolFatigue: number,
  loadScalingPct: number,
): PacingProtocol {
  const predicted = protocolPredicted;
  if (id === "game_plan") {
    const splits: PacingSplit[] = [
      {
        label: "Aanval",
        startSec: 0,
        endSec: Math.round(predicted * 0.4),
        intensityPct: 88,
        zone: "z2",
        cue: "Vroeg op drempel — niet wachten.",
      },
      {
        label: "Hold",
        startSec: Math.round(predicted * 0.4),
        endSec: Math.max(0, predicted - 120),
        intensityPct: 95,
        zone: "z2",
        cue: "Op drempel rijden, korte microbreaks.",
      },
      {
        label: "Danger Zone",
        startSec: Math.max(0, predicted - 120),
        endSec: predicted,
        intensityPct: 100,
        zone: "z3",
        cue: "Laatste 2 minuten alles geven — accepteer Z3.",
      },
    ];
    return {
      id,
      name: "Game Plan (Full Gas)",
      tagline: "Hoge intensiteit. Het tempo ligt hoog, je vermoeidheidspunt ligt vroeg. Alleen kiezen als je 100% hersteld bent.",
      splits,
      narrative: buildClusterNarrative("game_plan", predicted),
      loadScalingPct,
      predictedTimeSeconds: predicted,
      fatiguePointSeconds: protocolFatigue,
    };
  }

  if (id === "smart_engine") {
    const splits: PacingSplit[] = [
      {
        label: "Set the pace",
        startSec: 0,
        endSec: Math.round(predicted * 0.3),
        intensityPct: 80,
        zone: "z2",
        cue: "Iets onder drempel — geen vuur opbouwen.",
      },
      {
        label: "Threshold cruise",
        startSec: Math.round(predicted * 0.3),
        endSec: Math.round(predicted * 0.85),
        intensityPct: 88,
        zone: "z2",
        cue: "Forced rest van 5-8s aan elke transitie.",
      },
      {
        label: "Controlled close",
        startSec: Math.round(predicted * 0.85),
        endSec: predicted,
        intensityPct: 92,
        zone: "z2",
        cue: "Tempo iets op, blijf onder Z3.",
      },
    ];
    return {
      id,
    name: "Smart Engine (Optimaal)",
      tagline: "Jouw perfecte tempo. Berekend op basis van je leeftijd en PR's. Constante output, minimale kans op de man met de hamer.",
      splits,
      narrative: buildClusterNarrative("smart_engine", predicted),
      loadScalingPct,
      predictedTimeSeconds: predicted,
      fatiguePointSeconds: protocolFatigue,
    };
  }

  // foundation
  const splits: PacingSplit[] = [
    {
      label: "Nasal warm-up",
      startSec: 0,
      endSec: Math.round(predicted * 0.4),
      intensityPct: 65,
      zone: "z1",
      cue: "Neusademen — 4 in / 4 uit, blijf praatbaar.",
    },
    {
      label: "Steady",
      startSec: Math.round(predicted * 0.4),
      endSec: Math.round(predicted * 0.85),
      intensityPct: 72,
      zone: "z1",
      cue: "Comfortabel ritme — geen redline ooit.",
    },
    {
      label: "Cool finish",
      startSec: Math.round(predicted * 0.85),
      endSec: predicted,
      intensityPct: 75,
      zone: "z1",
      cue: "Zelfde tempo, mooie afwerking.",
    },
  ];
  return {
    id,
    name: "Foundation (Herstel/Z2)",
    tagline: "Rustig tempo. Focus op constante ademhaling en herstel. Ideaal als je een zware week hebt gehad of minder fit bent.",
    splits,
    narrative: buildClusterNarrative("foundation", predicted),
    loadScalingPct,
    predictedTimeSeconds: predicted,
    fatiguePointSeconds: protocolFatigue,
  };
}

function buildClusterNarrative(id: ProtocolId, predicted: number): string {
  const min = Math.max(1, Math.round(predicted / 60));
  if (id === "game_plan")
    return `Round 1–${Math.max(1, Math.floor(min * 0.4))}: pace agressief. Midden: ${Math.max(1, Math.floor(min * 0.5))} min op drempel. Laatste 2 min: all-out.`;
  if (id === "smart_engine")
    return `Round 1–3: pace +10s op je PR-tempo. Round 4+: forced rest 5-8s na elke set. Laatste ronde: tempo terug naar PR.`;
  return `Heel de WOD: nasal-only ademen. Constante splits, geen sprint, geen redline.`;
}

// ───────────── 4. Recovery-driven de-load ─────────────

export function computeLoadScaling(recoveryToday: number): number {
  if (recoveryToday < 0.4) return 0.85; // -15%
  if (recoveryToday < 0.55) return 0.9; // -10%
  return 1.0;
}

// ───────────── Core orchestrator ─────────────

export function buildStrategy(
  snapshot: AthleteSnapshot,
  demand: WodDemand,
): StrategyPlan {
  const movements =
    demand.movements && demand.movements.length > 0
      ? demand.movements
      : parseMovementsFromText(demand.description ?? "");

  const interference = analyzeMovementInterference(movements);
  const density = assessDensity(movements, snapshot.unbrokenByMovement);
  const loadScaling = computeLoadScaling(snapshot.recoveryToday);
  const deloadApplied = loadScaling < 1;

  const maxHr = estimateMaxHr(snapshot.age);
  const atPct = anaerobicThresholdPct(snapshot);
  const atBpm = Math.round(maxHr * atPct);
  const redlineBpm = Math.round(maxHr * snapshot.redlinePct);

  const mult = performanceMultiplier(snapshot, demand);
  // Density also slightly slows the athlete down
  const densityPenalty = density.reduce(
    (acc, d) => acc + (d.fatigueMultiplier - 1) * 0.05,
    0,
  );
  const predicted = Math.max(
    30,
    Math.round(demand.expectedTimeSeconds * mult * (1 + densityPenalty)),
  );

  // Fatigue point
  const fatigueFraction = clamp(
    0.45 +
      (snapshot.engineScore - 0.5) * 0.3 +
      (snapshot.recoveryFactor - 1) * 0.2 +
      ((snapshot.correctionFactor ?? 1) - 1) * 0.3,
    0.2,
    0.8,
  );
  const fatiguePointRaw = predicted * fatigueFraction;
  const fatiguePoint = Math.round(
    Math.max(15, fatiguePointRaw * (1 + interference.fatigueShiftPct)),
  );

  // Recommend protocol from recovery + RPE-tolerance
  let recommended: ProtocolId = "smart_engine";
  if (snapshot.recoveryToday < 0.45) recommended = "foundation";
  else if (
    snapshot.recoveryToday >= 0.75 &&
    snapshot.engineScore >= 0.6 &&
    !deloadApplied
  )
    recommended = "game_plan";

  const protoTime = (id: ProtocolId) =>
    Math.max(30, Math.round(predicted * PROTOCOL_FACTORS[id].timeFactor));
  const protoFatigue = (id: ProtocolId) =>
    Math.round(
      Math.max(15, fatiguePoint * PROTOCOL_FACTORS[id].fatigueFactor),
    );

  const protocols: Record<ProtocolId, PacingProtocol> = {
    game_plan: buildProtocol("game_plan", protoTime("game_plan"), protoFatigue("game_plan"), loadScaling),
    smart_engine: buildProtocol("smart_engine", protoTime("smart_engine"), protoFatigue("smart_engine"), loadScaling),
    foundation: buildProtocol("foundation", protoTime("foundation"), protoFatigue("foundation"), loadScaling),
  };

  const advice = buildAdvice(
    snapshot,
    demand,
    predicted,
    fatiguePoint,
    interference,
    deloadApplied,
    protocols[recommended],
  );

  return {
    estimatedMaxHr: maxHr,
    anaerobicThresholdBpm: atBpm,
    redlineBpm,
    fatiguePointSeconds: fatiguePoint,
    predictedTimeSeconds: predicted,
    interference,
    deloadApplied,
    recommendedProtocol: recommended,
    protocols,
    splits: protocols[recommended].splits,
    advice,
    density,
  };
}

function buildAdvice(
  s: AthleteSnapshot,
  d: WodDemand,
  predicted: number,
  fatigue: number,
  interference: InterferenceReport,
  deload: boolean,
  protocol: PacingProtocol,
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
      ? "Herstel is goed — je kunt agressief openen."
      : s.recoveryToday >= 0.55
        ? "Herstel is gemiddeld — bewaar 5% tot na fatigue point."
        : "Herstel is laag — de-load actief, blijf in Zone 1-2.";
  const interferenceLine = interference.notes.length
    ? ` Let op: ${interference.notes.join(" ")}`
    : "";
  const deloadLine = deload
    ? ` Schaal de geprogrammeerde 1RM-percentages met ${Math.round((1 - protocol.loadScalingPct) * 100)}%.`
    : "";
  return [
    `Verwachte finish ~${m(predicted)}, fatigue point rond ${m(fatigue)}.`,
    `Grootste limiter: ${limiter}.`,
    `Aanbevolen protocol: ${protocol.name}.`,
    recovery + interferenceLine + deloadLine,
  ].join(" ");
}

// ───────────── Timeline generation ─────────────

/**
 * Generate a per-second timeline for a specific protocol that the UI can plot
 * and scrub. HR climbs toward each split's target intensity, then plateaus.
 */
export function buildTimeline(
  plan: StrategyPlan,
  protocolId: ProtocolId = plan.recommendedProtocol,
  resolution = 5,
): TimelinePoint[] {
  const protocol = plan.protocols[protocolId];
  const points: TimelinePoint[] = [];
  let currentHr = Math.round(plan.estimatedMaxHr * 0.55);
  for (let t = 0; t <= protocol.predictedTimeSeconds; t += resolution) {
    const split =
      protocol.splits.find((s) => t >= s.startSec && t <= s.endSec) ??
      protocol.splits[protocol.splits.length - 1];
    const targetHr = (plan.estimatedMaxHr * split.intensityPct) / 100;
    currentHr += (targetHr - currentHr) * 0.18;
    const hr = Math.round(currentHr);
    const zone = classifyZone(hr, plan.anaerobicThresholdBpm, plan.redlineBpm);
    points.push({
      t,
      hr,
      zone,
      cue: split.cue,
      intensityPct: split.intensityPct,
    });
  }
  return points;
}

/** Convenience formatter for clusters — used in UI. */
export function formatPacingNarrative(protocol: PacingProtocol): string {
  return protocol.narrative;
}
