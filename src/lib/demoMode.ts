import type { AthleteSnapshot } from "@/lib/fatigueEngine";
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

export const DEMO_SNAPSHOT: AthleteSnapshot = {
  age: 32,
  engineScore: 0.68,
  strengthScore: 0.74,
  gymnasticsScore: 0.55,
  recoveryToday: 0.78,
  redlinePct: 0.9,
  recoveryFactor: 1.0,
};

export const DEMO_BENCHMARK_TIMES: Record<string, number> = {
  fran: 218, // 3:38
  helen: 512, // 8:32
  grace: 165, // 2:45
  diane: 252, // 4:12
};

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
