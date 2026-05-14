import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LimiterType } from "@/types/wod-analysis";

export interface AthleteProfile {
  id: string;
  athlete_id: string;
  assessed_at: string;
  engine_score: number;
  strength_score: number;
  gymnastics_score: number;
  mobility_score: number;
  pacing_score: number;
  recovery_score: number;
  primary_limiter: LimiterType | null;
  secondary_limiter: LimiterType | null;
  confidence_score: number | null;
  data_points_used: number;
}

interface UseAthleteProfileResult {
  profile: AthleteProfile | null;
  loading: boolean;
  error: string | null;
}

/** Fetches the most recent limiter profile for a given athlete_id. */
export function useAthleteProfile(athleteId: string | null): UseAthleteProfileResult {
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) return;

    setLoading(true);
    (supabase as any)
      .from("athlete_limiter_profiles")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("assessed_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        setProfile(data as AthleteProfile | null);
        setError(fetchError?.message ?? null);
        setLoading(false);
      });
  }, [athleteId]);

  return { profile, loading, error };
}

/** Score 0–1 → human-readable label. */
export function limiterScoreLabel(score: number): string {
  if (score >= 0.7) return "Sterk";
  if (score >= 0.4) return "Gemiddeld";
  return "Beperkend";
}

/** Score 0–1 → display value out of 100. */
export function toDisplayScore(score: number | null): number {
  return Math.round((score ?? 0) * 100);
}
