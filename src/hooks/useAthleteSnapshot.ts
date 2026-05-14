import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AthleteSnapshot } from "@/lib/fatigueEngine";
import {
  isDemoMode,
  DEMO_SNAPSHOT,
  DEMO_BENCHMARK_TIMES,
  DEMO_DISPLAY_NAME,
} from "@/lib/demoMode";

interface SnapshotResult {
  snapshot: AthleteSnapshot | null;
  loading: boolean;
  /** Latest individual benchmark times in seconds keyed by slug */
  benchmarkTimes: Record<string, number>;
  /** Display name */
  displayName: string;
  /** True when no real data exists and we're showing fallback */
  isMock: boolean;
}

const FRAN_REF = 240; // 4:00 reference
const HELEN_REF = 540; // 9:00 reference

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function useAthleteSnapshot(athleteId: string | null): SnapshotResult {
  const [snapshot, setSnapshot] = useState<AthleteSnapshot | null>(null);
  const [benchmarkTimes, setBenchmarkTimes] = useState<Record<string, number>>({});
  const [displayName, setDisplayName] = useState("Athlete");
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    if (!athleteId) {
      if (isDemoMode()) {
        setSnapshot(DEMO_SNAPSHOT);
        setBenchmarkTimes(DEMO_BENCHMARK_TIMES);
        setDisplayName(DEMO_DISPLAY_NAME);
        setIsMock(true);
      }
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const sb = supabase as any;
      const [
        { data: profile },
        { data: lifts },
        { data: gym },
        { data: benches },
        { data: wear },
        { data: fatigue },
      ] = await Promise.all([
        sb.from("profiles").select("display_name, date_of_birth, weight_kg").eq("id", athleteId).maybeSingle(),
        sb.from("athlete_lift_records").select("load_kg, movements(slug)").eq("athlete_id", athleteId),
        sb.from("athlete_gymnastics_records").select("max_unbroken_reps, movements(slug)").eq("athlete_id", athleteId),
        sb.from("athlete_benchmark_results").select("time_seconds, benchmark_workouts(slug)").eq("athlete_id", athleteId),
        sb.from("wearable_readings").select("recovery_pct").eq("athlete_id", athleteId).order("reading_date", { ascending: false }).limit(1).maybeSingle(),
        sb.from("fatigue_profiles").select("redline_pct, recovery_factor, correction_factor, mental_resilience_score").eq("athlete_id", athleteId).maybeSingle(),
      ]);

      const dob = profile?.date_of_birth ? new Date(profile.date_of_birth) : null;
      const age = dob
        ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000))
        : 30;
      const bw = profile?.weight_kg ?? 75;
      setDisplayName(profile?.display_name ?? "Athlete");

      // Strength score: use back-squat & deadlift relative to bodyweight
      const liftBy = new Map<string, number>();
      ((lifts ?? []) as any[]).forEach((l) => {
        const slug = l.movements?.slug;
        if (slug) liftBy.set(slug, Math.max(liftBy.get(slug) ?? 0, l.load_kg));
      });
      const bsRatio = (liftBy.get("back-squat") ?? 0) / bw; // 1.0 average, 2.0 elite
      const dlRatio = (liftBy.get("deadlift") ?? 0) / bw; // 1.5 average, 2.5 elite
      const strengthScore = clamp01(((bsRatio / 2.0) + (dlRatio / 2.5)) / 2);

      // Gymnastics: pull-ups, HSPU, double-unders normalized
      const gymBy = new Map<string, number>();
      ((gym ?? []) as any[]).forEach((g) => {
        const slug = g.movements?.slug;
        if (slug) gymBy.set(slug, Math.max(gymBy.get(slug) ?? 0, g.max_unbroken_reps));
      });
      const pu = (gymBy.get("pull-up") ?? 0) / 25;
      const hspu = (gymBy.get("handstand-push-up") ?? 0) / 15;
      const du = (gymBy.get("double-under") ?? 0) / 100;
      const gymScore = clamp01((pu + hspu + du) / 3);

      // Engine: invert benchmark times against reference
      const benchBy = new Map<string, number>();
      ((benches ?? []) as any[]).forEach((b) => {
        const slug = b.benchmark_workouts?.slug;
        if (slug && b.time_seconds) benchBy.set(slug, b.time_seconds);
      });
      const fran = benchBy.get("fran");
      const helen = benchBy.get("helen");
      const engineScore = clamp01(
        (fran ? clamp01(FRAN_REF / fran) : 0.5) * 0.5 +
          (helen ? clamp01(HELEN_REF / helen) : 0.5) * 0.5,
      );

      const recoveryToday = wear?.recovery_pct ? wear.recovery_pct / 100 : 0.7;

      const hasRealData =
        (lifts?.length ?? 0) > 0 ||
        (gym?.length ?? 0) > 0 ||
        (benches?.length ?? 0) > 0;

      if (!hasRealData) {
        // New athlete with no records: show demo so the engine UI is meaningful
        setSnapshot(DEMO_SNAPSHOT);
        setBenchmarkTimes(DEMO_BENCHMARK_TIMES);
        setIsMock(true);
      } else {
        setBenchmarkTimes(Object.fromEntries(benchBy));
        setSnapshot({
          age,
          engineScore,
          strengthScore,
          gymnasticsScore: gymScore,
          recoveryToday,
          redlinePct: Number(fatigue?.redline_pct ?? 0.9),
          recoveryFactor: Number(fatigue?.recovery_factor ?? 1.0),
          correctionFactor: Number(fatigue?.correction_factor ?? 1.0),
          mentalResilience: Number(fatigue?.mental_resilience_score ?? 0.5),
          unbrokenByMovement: Object.fromEntries(gymBy),
        });
        setIsMock(false);
      }
      setLoading(false);
    })();
  }, [athleteId]);

  return { snapshot, benchmarkTimes, displayName, loading, isMock };
}
