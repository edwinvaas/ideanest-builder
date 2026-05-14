import { useEffect, useState } from "react";
import { Zap, Clock, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import RoleBadge from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAthlete } from "@/contexts/AthleteContext";
import { supabase } from "@/integrations/supabase/client";
import { useWodAnalysis } from "@/hooks/useWodAnalysis";
import { useAthleteProfile } from "@/hooks/useAthleteProfile";
import { computeReadinessScore } from "@/types/intelligence";
import { invokeWodInterpreter } from "@/lib/wod-interpreter";
import {
  STIMULUS_LABEL,
  STIMULUS_COLOR,
  PACING_LABEL,
  PACING_ICON,
  LIMITER_LABEL,
  LIMITER_COLOR,
  SCALING_LABEL,
  SCALING_COLOR,
  getAthletePacingExplanation,
  getScalingModifications,
  resolveScaling,
} from "@/lib/ui-mapping";
import { useToast } from "@/hooks/use-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// resolveScaling lives in ui-mapping but wasn't exported — add it here locally
// until the ui-mapping file is updated.
function athleteScaling(readiness: number) {
  if (readiness >= 0.7) return "rx" as const;
  if (readiness >= 0.4) return "scaled" as const;
  return "foundations" as const;
}

// ─── Component ───────────────────────────────────────────────────────────────

const WorkoutStrategy = () => {
  const { profile: athleteProfile } = useAthlete();
  const { toast } = useToast();

  const [latestWodId, setLatestWodId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch the most recently analyzed WOD for this box (RLS handles box scoping)
  useEffect(() => {
    (supabase as any)
      .from("wod_analyses")
      .select("wod_id")
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.wod_id) setLatestWodId(data.wod_id);
      });
  }, []);

  const { analysis, loading } = useWodAnalysis(latestWodId);
  const { profile: limiterProfile } = useAthleteProfile((athleteProfile as any)?.id ?? null);

  const readiness =
    analysis && limiterProfile
      ? computeReadinessScore(
          {
            engine: limiterProfile.engine_score,
            strength: limiterProfile.strength_score,
            gymnastics: limiterProfile.gymnastics_score,
            mobility: limiterProfile.mobility_score,
            pacing: limiterProfile.pacing_score,
            recovery: limiterProfile.recovery_score,
          },
          analysis.limiter_demands,
        )
      : null;

  const scalingLevel = readiness !== null ? athleteScaling(readiness) : null;

  const scalingMods =
    analysis && scalingLevel ? getScalingModifications(analysis, scalingLevel) : null;

  const handleReanalyze = async () => {
    if (!latestWodId) return;
    setAnalyzing(true);
    await invokeWodInterpreter(latestWodId, {
      onSuccess: (r) =>
        toast({ title: "Analyse bijgewerkt", description: r.analysis.coach_brief }),
      onError: (msg) =>
        toast({ title: "Analyse mislukt", description: msg, variant: "destructive" }),
    });
    // useWodAnalysis updates automatically via Realtime
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading || !analysis) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3 animate-pulse" />
          <div className="h-40 bg-white/10 rounded-2xl animate-pulse" />
          <div className="h-40 bg-white/10 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <RoleBadge
              role="athlete"
              description="Persoonlijke strategie — jouw limiter profiel vs vandaag's WOD"
            />
            <h1 className="text-2xl font-bold mt-2">
              Workout{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Strategie
              </span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {analysis.estimated_time_domain} · AI analyse
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReanalyze}
            disabled={analyzing}
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${analyzing ? "animate-spin" : ""}`} />
            {analyzing ? "Analyseren…" : "Heranalyseer"}
          </Button>
        </div>

        {/* Stimulus + readiness */}
        <div className="gradient-card rounded-2xl p-6 flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Dominant stimulus
            </p>
            <Badge className={`text-sm px-3 py-1 ${STIMULUS_COLOR[analysis.dominant_stimulus]}`}>
              {STIMULUS_LABEL[analysis.dominant_stimulus]}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Vertrouwen: {Math.round(analysis.stimulus_confidence * 100)}%
            </p>
          </div>
          {readiness !== null && scalingLevel && (
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Jouw gereedheid
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">
                  {Math.round(readiness * 100)}
                  <span className="text-sm font-normal text-muted-foreground">/100</span>
                </span>
                <Badge className={`text-sm px-3 py-1 ${SCALING_COLOR[scalingLevel]}`}>
                  {SCALING_LABEL[scalingLevel]}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Pacing */}
        <div className="gradient-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Pacing strategie</h2>
          </div>
          <p className="text-sm">{getAthletePacingExplanation(analysis)}</p>

          {analysis.pacing_risks.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Veelgemaakte fouten
              </p>
              {analysis.pacing_risks.map((risk, i) => (
                <div
                  key={i}
                  className="bg-destructive/5 border border-destructive/10 rounded-xl p-3 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{risk.risk}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{risk.mitigation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scaling advice */}
        {scalingMods && scalingMods.length > 0 && (
          <div className="gradient-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-accent" />
              <h2 className="font-semibold">
                Jouw aanpassingen{" "}
                {scalingLevel && (
                  <Badge className={`ml-2 text-xs ${SCALING_COLOR[scalingLevel]}`}>
                    {SCALING_LABEL[scalingLevel]}
                  </Badge>
                )}
              </h2>
            </div>
            <ul className="space-y-2">
              {scalingMods.map((mod, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{mod}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Energy systems */}
        <div className="gradient-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Energiesystemen</h2>
          </div>
          <div className="space-y-3">
            {(
              [
                ["Fosfageen (explosief)", analysis.energy_system_breakdown.phosphagen],
                ["Glycolytisch (hoog-intensief)", analysis.energy_system_breakdown.glycolytic],
                ["Oxidatief (uithoudingsvermogen)", analysis.energy_system_breakdown.oxidative],
              ] as [string, number][]
            ).map(([label, pct]) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High-risk limiters */}
        {analysis.high_risk_limiters.length > 0 && (
          <div className="gradient-card rounded-2xl p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
              Hoog-risico limiters in deze WOD
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.high_risk_limiters.map((limiter) => (
                <span
                  key={limiter}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white ${LIMITER_COLOR[limiter]}`}
                >
                  {LIMITER_LABEL[limiter]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutStrategy;
