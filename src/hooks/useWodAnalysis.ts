import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { WodAnalysis, WodAnalysisBroadcastPayload } from "@/types/wod-analysis";

interface UseWodAnalysisResult {
  analysis: WodAnalysis | null;
  loading: boolean;
  error: string | null;
  /** True between triggering a re-analysis and receiving the broadcast. */
  analyzing: boolean;
  refetch: () => Promise<void>;
}

/**
 * Fetches the wod_analysis for a given wod_id and subscribes to real-time updates.
 *
 * Two Realtime channels work in tandem:
 *  1. postgres_changes — fires when the DB row is written (WAL-based, ~1–2 s lag)
 *  2. broadcast `analysis_complete` — fires instantly from the Edge Function
 *
 * The broadcast sets `analyzing = false` and triggers a refetch so the UI
 * transitions from skeleton → data in a single render cycle.
 */
export function useWodAnalysis(wodId: string | null): UseWodAnalysisResult {
  const [analysis, setAnalysis] = useState<WodAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    if (!wodId) return;
    setLoading(true);
    setError(null);

    // RLS on wod_analyses enforces box_id automatically via the JWT — no manual filter needed.
    const { data, error: fetchError } = await supabase
      .from("wod_analyses")
      .select("*")
      .eq("wod_id", wodId)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setAnalysis(data as WodAnalysis | null);
    }
    setLoading(false);
  }, [wodId]);

  useEffect(() => {
    if (!wodId) return;

    fetchAnalysis();

    const channel = supabase
      .channel(`wod:${wodId}`)
      // Fast path: Edge Function broadcasts this immediately after upsert
      .on("broadcast", { event: "analysis_complete" }, ({ payload }) => {
        const event = payload as WodAnalysisBroadcastPayload;
        setAnalyzing(false);
        // Refetch the full row — the broadcast only carries the headline fields
        fetchAnalysis();
        // Caller can use event.coach_brief for a toast before the full data arrives
        window.dispatchEvent(
          new CustomEvent("boxbrain:analysis_complete", { detail: event }),
        );
      })
      // Safety net: postgres_changes fires even if the broadcast was missed
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wod_analyses",
          filter: `wod_id=eq.${wodId}`,
        },
        () => {
          fetchAnalysis();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wodId, fetchAnalysis]);

  return { analysis, loading, error, analyzing, refetch: fetchAnalysis };
}

/**
 * Marks the WOD as "analyzing" so the caller can show a skeleton/spinner.
 * Call this just before invokeWodInterpreter() so there is no visible gap.
 */
export function useAnalyzingState() {
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const handler = () => setAnalyzing(false);
    window.addEventListener("boxbrain:analysis_complete", handler);
    return () => window.removeEventListener("boxbrain:analysis_complete", handler);
  }, []);

  return { analyzing, setAnalyzing };
}
