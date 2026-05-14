import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildBaseline,
  detectAnomaly,
  compareToOpenGlobal,
  type AnomalyAlert,
} from "@/lib/coachInsights";

export interface CoachAthleteRow {
  id: string;
  display_name: string;
  experience: string | null;
  latestRpe: number | null;
  latestPerceivedLimiter: string | null;
  latestRecovery: number | null;
  latestSessionAt: string | null;
  latestTimeSec: number | null;
  baselineTimeSec: number | null;
}

export interface OpenComparison {
  avgPercentile: number | null;
  sampleSize: number;
  openCode: string | null;
}

interface CoachRosterResult {
  rows: CoachAthleteRow[];
  loading: boolean;
  anomalies: AnomalyAlert[];
  openComparison: OpenComparison;
}

/** Loads all athletes in the coach's box plus their latest session result, recovery, baseline & alerts. */
export function useCoachRoster(): CoachRosterResult {
  const { user } = useAuth();
  const [rows, setRows] = useState<CoachAthleteRow[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [openComparison, setOpenComparison] = useState<OpenComparison>({
    avgPercentile: null,
    sampleSize: 0,
    openCode: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const sb = supabase as any;
      const { data: profiles } = await sb
        .from("profiles")
        .select("id, display_name, experience, gender, date_of_birth")
        .order("display_name");
      const ids = ((profiles ?? []) as any[]).map((p) => p.id).filter((id) => id !== user.id);

      if (ids.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const [
        { data: results },
        { data: wear },
        { data: todaySession },
      ] = await Promise.all([
        sb
          .from("athlete_session_results")
          .select(
            "athlete_id, rpe, perceived_limiter, recorded_on, created_at, time_seconds, session_id",
          )
          .in("athlete_id", ids)
          .order("created_at", { ascending: false }),
        sb
          .from("wearable_readings")
          .select("athlete_id, recovery_pct, reading_date")
          .in("athlete_id", ids)
          .order("reading_date", { ascending: false }),
        sb
          .from("workout_sessions")
          .select("id, benchmark_id, scheduled_for")
          .eq("scheduled_for", today)
          .maybeSingle(),
      ]);

      const latestResult = new Map<string, any>();
      const allByAthlete = new Map<string, any[]>();
      ((results ?? []) as any[]).forEach((r) => {
        if (!latestResult.has(r.athlete_id)) latestResult.set(r.athlete_id, r);
        if (!allByAthlete.has(r.athlete_id)) allByAthlete.set(r.athlete_id, []);
        allByAthlete.get(r.athlete_id)!.push(r);
      });
      const latestWear = new Map<string, any>();
      ((wear ?? []) as any[]).forEach((w) => {
        if (!latestWear.has(w.athlete_id)) latestWear.set(w.athlete_id, w);
      });

      const builtRows: CoachAthleteRow[] = ((profiles ?? []) as any[])
        .filter((p) => p.id !== user.id)
        .map((p) => {
          const r = latestResult.get(p.id);
          const w = latestWear.get(p.id);
          const history = allByAthlete.get(p.id) ?? [];
          const baseline = buildBaseline(p.id, p.display_name ?? "Athlete", history.slice(1, 6));
          return {
            id: p.id,
            display_name: p.display_name ?? "Athlete",
            experience: p.experience,
            latestRpe: r?.rpe ?? null,
            latestPerceivedLimiter: r?.perceived_limiter ?? null,
            latestRecovery: w?.recovery_pct ?? null,
            latestSessionAt: r?.created_at ?? null,
            latestTimeSec: r?.time_seconds ?? null,
            baselineTimeSec: baseline.baselineTimeSec,
          };
        });

      // Anomalies
      const detected: AnomalyAlert[] = builtRows
        .map((row) => {
          const r = latestResult.get(row.id);
          const baseline = {
            athlete_id: row.id,
            display_name: row.display_name,
            baselineTimeSec: row.baselineTimeSec,
            baselineRpe: null,
          };
          return detectAnomaly(baseline, r ?? null);
        })
        .filter((a): a is AnomalyAlert => a !== null);

      setRows(builtRows);
      setAnomalies(detected);

      // Open comparison: if today's session is mapped to an Open WOD
      if (todaySession?.benchmark_id) {
        const { data: bench } = await sb
          .from("benchmark_workouts")
          .select("open_code")
          .eq("id", todaySession.benchmark_id)
          .maybeSingle();
        if (bench?.open_code) {
          const { data: percentiles } = await sb
            .from("open_percentile_data")
            .select("*")
            .eq("open_code", bench.open_code);
          const todaysResults = ((results ?? []) as any[]).filter(
            (r) => r.session_id === todaySession.id,
          );
          const cmp = compareToOpenGlobal(todaysResults, (percentiles ?? []) as any);
          setOpenComparison({
            avgPercentile: cmp.avgPercentile,
            sampleSize: cmp.sampleSize,
            openCode: bench.open_code,
          });
        }
      }
      setLoading(false);
    })();
  }, [user?.id]);

  return { rows, loading, anomalies, openComparison };
}
