import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  recoveryFromAgeGender,
  recoveryFromWellness,
} from "@/lib/cnsBuffer";
import type { Goal } from "@/lib/decisionHierarchy";

export interface StrategyContext {
  ready: boolean;
  /** Effective recovery (wearable → wellness → age/gender) */
  effectiveRecovery: number;
  recoverySource: "wearable" | "wellness" | "baseline";
  goals: Goal[];
  subjectiveWellness: number | null;
}

/**
 * Bundles wearable + profile fallback data so the decision pipeline can run
 * even when the athlete has no smartwatch ingestion.
 */
export function useStrategyContext(athleteId: string | null): StrategyContext {
  const [ctx, setCtx] = useState<StrategyContext>({
    ready: false,
    effectiveRecovery: 0.7,
    recoverySource: "baseline",
    goals: [],
    subjectiveWellness: null,
  });

  useEffect(() => {
    if (!athleteId) {
      setCtx((c) => ({ ...c, ready: true }));
      return;
    }
    (async () => {
      const sb = supabase as any;
      const [{ data: profile }, { data: wear }] = await Promise.all([
        sb
          .from("profiles")
          .select("date_of_birth, gender, goals, subjective_wellness")
          .eq("id", athleteId)
          .maybeSingle(),
        sb
          .from("wearable_readings")
          .select("recovery_pct, reading_date")
          .eq("athlete_id", athleteId)
          .order("reading_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const today = new Date().toISOString().slice(0, 10);
      const wearableRecovery =
        wear?.recovery_pct && wear.reading_date === today
          ? wear.recovery_pct / 100
          : null;
      const wellnessRecovery = recoveryFromWellness(profile?.subjective_wellness);
      const age = profile?.date_of_birth
        ? Math.floor(
            (Date.now() - new Date(profile.date_of_birth).getTime()) /
              (365.25 * 24 * 3600 * 1000),
          )
        : null;
      const baselineRecovery = recoveryFromAgeGender(age, profile?.gender ?? null);

      let effective = baselineRecovery;
      let source: "wearable" | "wellness" | "baseline" = "baseline";
      if (wearableRecovery !== null) {
        effective = wearableRecovery;
        source = "wearable";
      } else if (wellnessRecovery !== null) {
        effective = wellnessRecovery;
        source = "wellness";
      }

      setCtx({
        ready: true,
        effectiveRecovery: effective,
        recoverySource: source,
        goals: ((profile?.goals ?? []) as string[]).map((g) => g.toLowerCase() as Goal),
        subjectiveWellness: profile?.subjective_wellness ?? null,
      });
    })();
  }, [athleteId]);

  return ctx;
}
