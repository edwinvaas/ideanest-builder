/**
 * BoxBrain — Anatomical Chain Matrix.
 *
 * Vectoriseert bewegingen naar spier/zenuwsysteem-belasting:
 *  - Posterior chain   (DL, Cleans, KB Swing, Box Jump, Row)
 *  - Anterior chain    (Front Squat, Wallball, Thruster, T2B, Hip Flexors)
 *  - Vertical Push     (HSPU, Press, Jerk, Snatch overhead)
 *  - Vertical Pull     (Pull-up, C2B, Muscle-up, Rope)
 *  - High-Power Cardio (Echo Bike, Sprint Row, Assault Run)
 *  - High-Tech Lift    (Snatch, Clean, OHS — neuraal precisiewerk)
 *
 * Output:
 *  - bottleneck (zwaarst belaste keten + score)
 *  - fatigueAccumulationBoost (1.0 = neutraal, >1 = sneller verzuren)
 *  - alerts (cues per anatomische combo)
 *  - transitionBufferSec (15-20s als cardio→tech-lift switch detected)
 *  - flowTip (één-zin actief-herstel advies)
 */

import type { WodMovement } from "@/lib/fatigueEngine";

export type Chain =
  | "posterior"
  | "anterior"
  | "vertical_push"
  | "vertical_pull"
  | "grip"
  | "high_power_cardio"
  | "high_tech_lift";

export interface AnatomyReport {
  hits: Record<Chain, string[]>;
  bottleneck: { chain: Chain; label: string; score: number } | null;
  fatigueAccumulationBoost: number; // 1.0 = baseline
  transitionBufferSec: number;
  alerts: { chain: Chain; severity: "info" | "warning" | "critical"; cue: string }[];
  flowTip: string | null;
}

// ─────────── Catalog ───────────

const POSTERIOR = new Set([
  "deadlift",
  "sumo-deadlift-high-pull",
  "clean",
  "power-clean",
  "squat-clean",
  "hang-clean",
  "kettlebell-swing",
  "kb-swing",
  "box-jump",
  "box-jump-over",
  "row",
  "rowing",
  "good-morning",
]);

const ANTERIOR = new Set([
  "front-squat",
  "wall-ball",
  "wallball",
  "thruster",
  "toes-to-bar",
  "knees-to-elbow",
  "sit-up",
  "v-up",
  "hollow-hold",
  "pistol",
]);

const HEAVY_QUAD = new Set(["front-squat", "back-squat", "thruster", "wall-ball", "wallball"]);
const HIP_FLEXOR = new Set(["toes-to-bar", "knees-to-elbow", "sit-up", "v-up", "hollow-hold"]);

const VERTICAL_PUSH = new Set([
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

const VERTICAL_PULL = new Set([
  "pull-up",
  "chest-to-bar",
  "muscle-up",
  "bar-muscle-up",
  "ring-muscle-up",
  "rope-climb",
  "toes-to-bar",
]);

const GRIP = new Set([
  "deadlift",
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

const HIGH_POWER_CARDIO = new Set([
  "echo-bike",
  "assault-bike",
  "bike-erg",
  "row",
  "rowing",
  "ski-erg",
  "skierg",
  "sprint",
  "shuttle-run",
  "run",
]);

const HIGH_TECH_LIFT = new Set([
  "snatch",
  "power-snatch",
  "squat-snatch",
  "clean",
  "power-clean",
  "squat-clean",
  "clean-and-jerk",
  "split-jerk",
  "overhead-squat",
]);

const REDUNDANT_PAIRS: Array<[Set<string>, Set<string>, string]> = [
  [
    new Set(["burpee"]),
    new Set(["push-up", "handstand-push-up", "shoulder-press", "push-press"]),
    "Burpees + verticale push: zelfde tricep/borst-bundel — verlaag rep-density.",
  ],
  [
    new Set(["pull-up", "chest-to-bar"]),
    new Set(["toes-to-bar", "muscle-up"]),
    "Pull + T2B/MU werken dezelfde lat/grip — voorkom premature shutdown.",
  ],
];

const COMPLEMENTARY_PAIRS: Array<[Set<string>, Set<string>, string]> = [
  [
    new Set(["pull-up", "chest-to-bar", "muscle-up", "bar-muscle-up"]),
    new Set(["push-up", "handstand-push-up", "shoulder-press"]),
    "Push + Pull antagonist — kortere rust toegestaan, agonisten herstellen kruislings.",
  ],
];

// ─────────── Helpers ───────────

function pick(slugs: string[], set: Set<string>): string[] {
  return slugs.filter((s) => set.has(s));
}

function intersects(slugs: Set<string>, a: Set<string>, b: Set<string>) {
  let ah = false;
  let bh = false;
  for (const s of slugs) {
    if (a.has(s)) ah = true;
    if (b.has(s)) bh = true;
    if (ah && bh) return true;
  }
  return false;
}

// ─────────── Main ───────────

export function analyzeAnatomy(
  movements: WodMovement[],
  goals: string[] = [],
): AnatomyReport {
  const slugs = movements.map((m) => m.slug);
  const slugSet = new Set(slugs);

  const hits: Record<Chain, string[]> = {
    posterior: pick(slugs, POSTERIOR),
    anterior: pick(slugs, ANTERIOR),
    vertical_push: pick(slugs, VERTICAL_PUSH),
    vertical_pull: pick(slugs, VERTICAL_PULL),
    grip: pick(slugs, GRIP),
    high_power_cardio: pick(slugs, HIGH_POWER_CARDIO),
    high_tech_lift: pick(slugs, HIGH_TECH_LIFT),
  };

  const alerts: AnatomyReport["alerts"] = [];
  let fatigueAccumulationBoost = 1.0;

  // 1. Posterior overload
  if (hits.posterior.length > 2) {
    fatigueAccumulationBoost *= 1.25;
    alerts.push({
      chain: "posterior",
      severity: "warning",
      cue: `Posterior chain overload (${hits.posterior.join(", ")}) — Lower Back Safety: hou hip-hinge strak, brace elke rep, geen rounding.`,
    });
  }

  // 2. Anterior — heavy quad + hip flexor combo
  const heavyQuad = pick(slugs, HEAVY_QUAD);
  const hipFlex = pick(slugs, HIP_FLEXOR);
  if (heavyQuad.length > 0 && hipFlex.length > 0) {
    fatigueAccumulationBoost *= 1.12;
    alerts.push({
      chain: "anterior",
      severity: "warning",
      cue: `Hip Flexor Cramping risico (${heavyQuad.join("+")} ↔ ${hipFlex.join("+")}) — verlaag transitie-snelheid en strek hip flexors tussen rondes.`,
    });
  }

  // 3. Shoulder girdle — vertical push vs pull
  if (hits.vertical_push.length > 0 && hits.vertical_pull.length > 0) {
    alerts.push({
      chain: "vertical_push",
      severity: "warning",
      cue: `Vertical Push/Pull interferentie (${hits.vertical_push.join("+")} ↔ ${hits.vertical_pull.join("+")}) — dwing clusters af, nooit failure-set, schouderstabiliteit beschermen.`,
    });
  }

  // 4. Redundant movement pairs → density penalty
  REDUNDANT_PAIRS.forEach(([a, b, cue]) => {
    if (intersects(slugSet, a, b)) {
      fatigueAccumulationBoost *= 1.08;
      alerts.push({ chain: "grip", severity: "warning", cue });
    }
  });

  // 5. Complementary pairs → softer rest
  COMPLEMENTARY_PAIRS.forEach(([a, b, cue]) => {
    if (intersects(slugSet, a, b)) {
      alerts.push({ chain: "vertical_push", severity: "info", cue });
    }
  });

  // 6. Transition buffer cardio → tech-lift
  let transitionBufferSec = 0;
  if (hits.high_power_cardio.length > 0 && hits.high_tech_lift.length > 0) {
    const wantsLongevity =
      goals.includes("longevity") || goals.includes("health");
    const wantsCompetition = goals.includes("competition");
    transitionBufferSec = wantsLongevity ? 20 : wantsCompetition ? 10 : 15;
    alerts.push({
      chain: "high_tech_lift",
      severity: wantsCompetition ? "info" : "warning",
      cue: wantsCompetition
        ? `Aggressive Transition (${transitionBufferSec}s) van ${hits.high_power_cardio[0]} → ${hits.high_tech_lift[0]} — let op techniek-degradatie, accepteer 1 mis-lift.`
        : `Verplichte transition buffer ${transitionBufferSec}s na ${hits.high_power_cardio[0]} voor ${hits.high_tech_lift[0]} — HR moet zakken voor neuraal precisiewerk.`,
    });
  }

  // 7. Bottleneck score: pick chain with highest taxation
  const scores: { chain: Chain; label: string; score: number }[] = [
    { chain: "posterior", label: "Posterior Chain Overload", score: hits.posterior.length * 1.0 + (hits.posterior.length > 2 ? 1.5 : 0) },
    { chain: "anterior", label: "Anterior Chain (Quads/Hip Flexors)", score: heavyQuad.length + hipFlex.length * 0.8 },
    { chain: "vertical_push", label: "Shoulder Girdle Push/Pull", score: (hits.vertical_push.length + hits.vertical_pull.length) * (hits.vertical_push.length && hits.vertical_pull.length ? 1.2 : 0.5) },
    { chain: "grip", label: "Grip & Forearm Endurance", score: hits.grip.length * 0.9 },
    { chain: "high_tech_lift", label: "Neural / CNS Precision Load", score: hits.high_tech_lift.length * (transitionBufferSec ? 1.6 : 1) },
  ];
  scores.sort((a, b) => b.score - a.score);
  const bottleneck = scores[0].score >= 1.5 ? scores[0] : null;

  // 8. Movement Flow Tip — pick most actionable
  let flowTip: string | null = null;
  if (bottleneck?.chain === "grip" && hits.high_power_cardio.length) {
    flowTip = `Je grip is de bottleneck — gebruik de transitie van ${hits.high_power_cardio[0]} naar ${hits.vertical_pull[0] ?? "de bar"} voor actieve hersteltijd van je onderarmen (schud uit, geen knijpen).`;
  } else if (bottleneck?.chain === "posterior") {
    flowTip = `Posterior is leading — adem-cyclus tijdens de hinge, breek de set vóór je form breekt (niet erna).`;
  } else if (bottleneck?.chain === "vertical_push") {
    flowTip = `Schouders zijn limiterend — split de push-set vroeg (bijv. 5+5+5 i.p.v. 10+5), bewaar shoulder-stack voor de laatste ronde.`;
  } else if (transitionBufferSec > 0) {
    flowTip = `Loop niet de bar in vanaf de bike — ${transitionBufferSec}s ademen, RHR onder 150 voor je de bar pakt.`;
  } else if (bottleneck?.chain === "anterior") {
    flowTip = `Hip flexors gaan fataal worden — strek aktief tussen rondes, kies pacing-protocol dat een halve seconde rust per rep toelaat.`;
  }

  return {
    hits,
    bottleneck,
    fatigueAccumulationBoost,
    transitionBufferSec,
    alerts,
    flowTip,
  };
}

/**
 * Movement-balance modifier voor de CNS buffer.
 *  - Complementary push/pull → mag iets hoger laden (cap +2%)
 *  - Redundant overlap (burpee+push-up) → verlaag rep-density (cap −5%)
 */
export function movementBalanceCnsAdjust(
  movements: WodMovement[],
): { capDeltaPct: number; repDensityFactor: number; note: string | null } {
  const slugSet = new Set(movements.map((m) => m.slug));
  let capDeltaPct = 0;
  let repDensityFactor = 1.0;
  let note: string | null = null;

  for (const [a, b] of COMPLEMENTARY_PAIRS) {
    if (intersects(slugSet, a, b)) {
      capDeltaPct += 0.02;
      note = "Complementaire push/pull → CNS-cap +2% (antagonist herstel).";
    }
  }
  for (const [a, b] of REDUNDANT_PAIRS) {
    if (intersects(slugSet, a, b)) {
      capDeltaPct -= 0.03;
      repDensityFactor *= 0.7;
      note = "Redundante overlap → rep-density 70%, CNS-cap -3%.";
    }
  }
  return { capDeltaPct, repDensityFactor, note };
}
