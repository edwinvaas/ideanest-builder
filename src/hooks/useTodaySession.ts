import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WorkoutSession {
  id: string;
  box_id: string | null;
  benchmark_id: string | null;
  scheduled_for: string;
  title: string;
  description: string;
  dominant_stimulus: string | null;
  primary_limiter: "engine" | "strength" | "gymnastics" | null;
  energy_phosphagen: number;
  energy_glycolytic: number;
  energy_oxidative: number;
  expected_time_seconds: number | null;
  time_cap_seconds: number | null;
}

/** Returns the most recently scheduled session for the user's box (today or upcoming). */
export function useTodaySession() {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("workout_sessions")
        .select("*")
        .order("scheduled_for", { ascending: false })
        .limit(1)
        .maybeSingle();
      setSession((data ?? null) as WorkoutSession | null);
      setLoading(false);
    })();
  }, []);

  return { session, loading };
}
