import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import RoleBadge from "@/components/RoleBadge";
import FatigueTimeline from "@/components/athlete/FatigueTimeline";
import PostWodFeedback from "@/components/athlete/PostWodFeedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAthleteSnapshot } from "@/hooks/useAthleteSnapshot";
import { useTodaySession } from "@/hooks/useTodaySession";
import { buildStrategy } from "@/lib/fatigueEngine";
import { formatSeconds } from "@/lib/onboardingSync";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Loader2 } from "lucide-react";

const FALLBACK_DEMAND = {
  expectedTimeSeconds: 600,
  phosphagen: 10,
  glycolytic: 45,
  oxidative: 45,
  dominantLimiter: "engine" as const,
};

const WorkoutStrategy = () => {
  const { user } = useAuth();
  const { snapshot, loading } = useAthleteSnapshot(user?.id ?? null);
  const { session, loading: sessionLoading } = useTodaySession();

  const demand = useMemo(() => {
    if (!session) return FALLBACK_DEMAND;
    return {
      expectedTimeSeconds: session.expected_time_seconds ?? 600,
      phosphagen: session.energy_phosphagen,
      glycolytic: session.energy_glycolytic,
      oxidative: session.energy_oxidative,
      dominantLimiter: (session.primary_limiter ?? "engine") as
        | "engine"
        | "strength"
        | "gymnastics",
    };
  }, [session]);

  const plan = useMemo(
    () => (snapshot ? buildStrategy(snapshot, demand) : null),
    [snapshot, demand],
  );

  // Persist generated strategy so coach can read it
  useEffect(() => {
    if (!plan || !session || !user) return;
    (supabase as any)
      .from("athlete_strategies")
      .upsert(
        {
          session_id: session.id,
          athlete_id: user.id,
          anaerobic_threshold_bpm: plan.anaerobicThresholdBpm,
          redline_bpm: plan.redlineBpm,
          fatigue_point_seconds: plan.fatiguePointSeconds,
          splits: plan.splits as any,
          advice: plan.advice,
        },
        { onConflict: "session_id,athlete_id" },
      )
      .then(() => undefined);
  }, [plan, session, user]);

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 md:px-8 py-24 max-w-4xl mx-auto">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 md:px-8 py-24 max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground">
            Voltooi je onboarding om een persoonlijke strategie te genereren.
          </p>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed top-16 left-0 right-0 h-0.5 bg-gradient-fire z-40 opacity-70" />

      <div className="px-4 md:px-8 py-24 max-w-4xl mx-auto space-y-6">
        <RoleBadge
          role="athlete"
          description="Persoonlijke strategie — jouw profiel toegepast op vandaag's WOD"
        />

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-1">
              Workout <span className="text-gradient-fire">Strategie</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              {session?.title ?? "Generieke conditioning"} —{" "}
              voorspelde finish: <span className="font-mono text-foreground">{formatSeconds(plan.predictedTimeSeconds)}</span>
            </p>
          </div>
        </div>

        {/* WOD card */}
        {session && (
          <div className="rounded-xl bg-gradient-card border border-border p-6 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  WOD vandaag
                </p>
                <h2 className="font-display font-bold text-xl">{session.title}</h2>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                  {session.description}
                </p>
              </div>
              {session.dominant_stimulus && (
                <Badge variant="outline" className="shrink-0">
                  {session.dominant_stimulus}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                ["Fosfageen", session.energy_phosphagen],
                ["Glycolytisch", session.energy_glycolytic],
                ["Oxidatief", session.energy_oxidative],
              ].map(([label, pct]) => (
                <div key={label as string}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-gradient-fire"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Engine snapshot */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Engine", value: Math.round(snapshot.engineScore * 100), suffix: "/100" },
            { label: "Kracht", value: Math.round(snapshot.strengthScore * 100), suffix: "/100" },
            { label: "Gymnastiek", value: Math.round(snapshot.gymnasticsScore * 100), suffix: "/100" },
            { label: "Recovery vandaag", value: Math.round(snapshot.recoveryToday * 100), suffix: "%" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-gradient-card border border-border p-4 shadow-card">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="font-display font-bold text-2xl mt-1">
                {m.value}
                <span className="text-sm text-muted-foreground font-normal">{m.suffix}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Fatigue timeline */}
        <FatigueTimeline plan={plan} />

        {/* Coach-voice advice */}
        <div className="rounded-xl bg-gradient-card border border-border p-6 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-lg">Coach voice</h3>
          </div>
          <p className="text-sm leading-relaxed">{plan.advice}</p>
        </div>

        {/* Post-WOD feedback */}
        {session && user && (
          <PostWodFeedback sessionId={session.id} athleteId={user.id} />
        )}
      </div>
    </div>
  );
};

export default WorkoutStrategy;
