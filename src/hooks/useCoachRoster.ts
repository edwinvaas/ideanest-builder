import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CoachAthleteRow {
  id: string;
  display_name: string;
  experience: string | null;
  latestRpe: number | null;
  latestPerceivedLimiter: string | null;
  latestRecovery: number | null;
  latestSessionAt: string | null;
}

/** Loads all athletes in the coach's box plus their latest session result + recovery. */
export function useCoachRoster() {
  const { user } = useAuth();
  const [rows, setRows] = useState<CoachAthleteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const sb = supabase as any;
      // RLS already filters profiles to same-box for coaches.
      const { data: profiles } = await sb
        .from("profiles")
        .select("id, display_name, experience")
        .order("display_name");
      const ids = ((profiles ?? []) as any[]).map((p) => p.id).filter((id) => id !== user.id);

      if (ids.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const [{ data: results }, { data: wear }] = await Promise.all([
        sb
          .from("athlete_session_results")
          .select("athlete_id, rpe, perceived_limiter, recorded_on, created_at")
          .in("athlete_id", ids)
          .order("created_at", { ascending: false }),
        sb
          .from("wearable_readings")
          .select("athlete_id, recovery_pct, reading_date")
          .in("athlete_id", ids)
          .order("reading_date", { ascending: false }),
      ]);

      const latestResult = new Map<string, any>();
      ((results ?? []) as any[]).forEach((r) => {
        if (!latestResult.has(r.athlete_id)) latestResult.set(r.athlete_id, r);
      });
      const latestWear = new Map<string, any>();
      ((wear ?? []) as any[]).forEach((w) => {
        if (!latestWear.has(w.athlete_id)) latestWear.set(w.athlete_id, w);
      });

      setRows(
        ((profiles ?? []) as any[])
          .filter((p) => p.id !== user.id)
          .map((p) => {
            const r = latestResult.get(p.id);
            const w = latestWear.get(p.id);
            return {
              id: p.id,
              display_name: p.display_name ?? "Athlete",
              experience: p.experience,
              latestRpe: r?.rpe ?? null,
              latestPerceivedLimiter: r?.perceived_limiter ?? null,
              latestRecovery: w?.recovery_pct ?? null,
              latestSessionAt: r?.created_at ?? null,
            };
          }),
      );
      setLoading(false);
    })();
  }, [user?.id]);

  return { rows, loading };
}
