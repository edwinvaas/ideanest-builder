import type { WorkoutSession } from "@/hooks/useTodaySession";

export type ProgrammingSourceId =
  | "manual"
  | "crossfit_main"
  | "mayhem"
  | "hwpo"
  | "cap"
  | "prvn"
  | "linchpin";

export interface ProgrammingSource {
  id: ProgrammingSourceId;
  name: string;
  blurb: string;
}

export const PROGRAMMING_SOURCES: ProgrammingSource[] = [
  { id: "manual", name: "Handmatige invoer", blurb: "Gebruik de WOD van je box of je eigen plan." },
  { id: "crossfit_main", name: "CrossFit.com (Main Site)", blurb: "Officiële daily WOD van CrossFit HQ." },
  { id: "mayhem", name: "Mayhem", blurb: "Rich Froning's competitive programming." },
  { id: "hwpo", name: "HWPO", blurb: "Mat Fraser's Hard Work Pays Off." },
  { id: "cap", name: "CAP", blurb: "Comptrain Athlete Program." },
  { id: "prvn", name: "PRVN", blurb: "Shane Orr's PRVN Fitness." },
  { id: "linchpin", name: "Linchpin", blurb: "Pat Sherwood's Linchpin." },
];

const KEY = "boxbrain.programmingSource";

export function getStoredSource(): ProgrammingSourceId {
  if (typeof window === "undefined") return "manual";
  return (window.localStorage.getItem(KEY) as ProgrammingSourceId) || "manual";
}

export function setStoredSource(id: ProgrammingSourceId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, id);
}

/**
 * Daily WOD sync — for now we simulate a few canonical workouts per source.
 * The selection is deterministic for "today" so the UI stays stable across
 * a session.
 */
export interface DailyWod extends WorkoutSession {
  /** Slug into benchmark_workouts so the Truth Engine can override predicted finish */
  benchmark_slug?: string;
  source: ProgrammingSourceId;
}

const TODAY = () => new Date().toISOString().slice(0, 10);

const FRAN: Omit<DailyWod, "source"> = {
  id: "src-fran",
  box_id: null,
  benchmark_id: null,
  scheduled_for: TODAY(),
  title: "Fran",
  description: "21-15-9 reps for time of:\nThrusters 43kg / 30kg\nPull-ups",
  dominant_stimulus: "glycolytic sprint",
  primary_limiter: "engine",
  energy_phosphagen: 10,
  energy_glycolytic: 70,
  energy_oxidative: 20,
  expected_time_seconds: 240,
  time_cap_seconds: 600,
  intended_stimulus_min: 180,
  intended_stimulus_max: 360,
  stimulus_description: "Glycolytische sprint — alles binnen 6 minuten finishen.",
  coaching_goals_text: "Behoud techniek op thrusters, ga unbroken op pull-ups in ronde 1.",
  class_size: 8,
  benchmark_slug: "fran",
};

const HELEN: Omit<DailyWod, "source"> = {
  ...FRAN,
  id: "src-helen",
  title: "Helen",
  description: "3 rounds for time:\n400m run\n21 KB swings 24/16kg\n12 pull-ups",
  dominant_stimulus: "oxidative power",
  primary_limiter: "engine",
  energy_phosphagen: 5,
  energy_glycolytic: 35,
  energy_oxidative: 60,
  expected_time_seconds: 540,
  time_cap_seconds: 900,
  intended_stimulus_min: 480,
  intended_stimulus_max: 780,
  stimulus_description: "Aerobische power — pacing op de run, breath control op KB.",
  coaching_goals_text: "Run consistent, KB unbroken sets van 11/10, pull-ups in 2 sets.",
  benchmark_slug: "helen",
};

const GRACE: Omit<DailyWod, "source"> = {
  ...FRAN,
  id: "src-grace",
  title: "Grace",
  description: "30 Clean & Jerks for time\n61kg / 43kg",
  dominant_stimulus: "phosphagen / strength-speed",
  primary_limiter: "strength",
  energy_phosphagen: 35,
  energy_glycolytic: 55,
  energy_oxidative: 10,
  expected_time_seconds: 165,
  time_cap_seconds: 360,
  intended_stimulus_min: 120,
  intended_stimulus_max: 240,
  stimulus_description: "Strength-speed sprint — singles met ritme.",
  coaching_goals_text: "Touch & go in eerste 5, dan singles om de 4-6 sec.",
  benchmark_slug: "grace",
};

const DIANE: Omit<DailyWod, "source"> = {
  ...FRAN,
  id: "src-diane",
  title: "Diane",
  description: "21-15-9 reps for time:\nDeadlift 102kg / 70kg\nHandstand Push-ups",
  dominant_stimulus: "glycolytic strength",
  primary_limiter: "gymnastics",
  energy_phosphagen: 15,
  energy_glycolytic: 65,
  energy_oxidative: 20,
  expected_time_seconds: 300,
  time_cap_seconds: 720,
  intended_stimulus_min: 240,
  intended_stimulus_max: 480,
  stimulus_description: "Posterior + schouder — ademhaling tussen sets.",
  coaching_goals_text: "DL in snelle singles, HSPU clusters van 5/4/3.",
  benchmark_slug: "diane",
};

const POOLS: Record<ProgrammingSourceId, Omit<DailyWod, "source">[]> = {
  manual: [],
  crossfit_main: [FRAN, HELEN, GRACE, DIANE],
  mayhem: [HELEN, GRACE],
  hwpo: [FRAN, DIANE],
  cap: [FRAN, HELEN],
  prvn: [GRACE, HELEN],
  linchpin: [DIANE, FRAN],
};

export function getDailyWod(source: ProgrammingSourceId, date = TODAY()): DailyWod | null {
  const pool = POOLS[source];
  if (!pool || pool.length === 0) return null;
  // Deterministic per date so reload doesn't reshuffle
  const seed = date.split("-").reduce((acc, v) => acc + parseInt(v, 10), 0);
  const wod = pool[seed % pool.length];
  return { ...wod, scheduled_for: date, source };
}
