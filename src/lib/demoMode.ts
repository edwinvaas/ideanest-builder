import type { AthleteSnapshot, WodMovement } from "@/lib/fatigueEngine";
import type { WorkoutSession } from "@/hooks/useTodaySession";

const KEY = "boxbrain.demoMode";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function setDemoMode(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) window.localStorage.setItem(KEY, "1");
  else window.localStorage.removeItem(KEY);
}

export const DEMO_DISPLAY_NAME = "Demo Athlete";

export const DEMO_UNBROKEN: Record<string, number> = {
  "pull-up": 25,
  "chest-to-bar": 15,
  "handstand-push-up": 10,
  "double-under": 80,
  "toes-to-bar": 18,
};

export const DEMO_SNAPSHOT: AthleteSnapshot = {
  age: 32,
  engineScore: 0.68,
  strengthScore: 0.74,
  gymnasticsScore: 0.55,
  recoveryToday: 0.78,
  redlinePct: 0.9,
  recoveryFactor: 1.0,
  correctionFactor: 1.0,
  mentalResilience: 0.6,
  unbrokenByMovement: DEMO_UNBROKEN,
};

export const DEMO_BENCHMARK_TIMES: Record<string, number> = {
  fran: 218,
  helen: 512,
  grace: 165,
  diane: 252,
};

export const DEMO_MOVEMENTS: WodMovement[] = [
  { slug: "thruster", reps: 15, isLoaded: true },
  { slug: "pull-up", reps: 15 },
];

export const DEMO_SESSION: WorkoutSession = {
  id: "demo-session",
  box_id: null,
  benchmark_id: null,
  scheduled_for: new Date().toISOString().slice(0, 10),
  title: "Fran",
  description:
    "21-15-9 reps for time of:\nThrusters 43kg / 30kg\nPull-ups",
  dominant_stimulus: "glycolytic sprint",
  primary_limiter: "engine",
  energy_phosphagen: 10,
  energy_glycolytic: 70,
  energy_oxidative: 20,
  expected_time_seconds: 240,
  time_cap_seconds: 600,
};
