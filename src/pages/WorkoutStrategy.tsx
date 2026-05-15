import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import RoleBadge from "@/components/RoleBadge";
import FatigueTimelineInteractive from "@/components/athlete/FatigueTimelineInteractive";
import PostWodFeedback from "@/components/athlete/PostWodFeedback";
import GoalAlignmentBadge from "@/components/athlete/GoalAlignmentBadge";
import ScalingProposalCard from "@/components/athlete/ScalingProposal";
import BottleneckAlert from "@/components/athlete/BottleneckAlert";
import { DemoBanner } from "@/components/DemoBanner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useAthleteSnapshot } from "@/hooks/useAthleteSnapshot";
import { useTodaySession } from "@/hooks/useTodaySession";
import { useStrategyContext } from "@/hooks/useStrategyContext";
import { type ProtocolId } from "@/lib/fatigueEngine";
import { runDecisionPipeline, type Goal } from "@/lib/decisionHierarchy";
import { formatSeconds } from "@/lib/onboardingSync";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode, DEMO_MOVEMENTS } from "@/lib/demoMode";
import {
  Activity,
  AlertTriangle,
  Heart,
  Loader2,
  Plane,
  Shield,
  Target,
  Timer,
  Zap,
} from "lucide-react";

const FALLBACK_DEMAND = {
  expectedTimeSeconds: 600,
  phosphagen: 10,
  glycolytic: 45,
  oxidative: 45,
  dominantLimiter: "engine" as const,
};

const PROTOCOL_META: Record<ProtocolId, { icon: typeof Target; tone: string }> = {
  game_plan: { icon: Target, tone: "border-destructive/40 text-destructive" },
  smart_engine: { icon: Zap, tone: "border-primary/40 text-primary" },
  foundation: { icon: Shield, tone: "border-success/40 text-success" },
};

const WorkoutStrategy = () => {
  const { user } = useAuth();
  const { snapshot: rawSnapshot, loading, isMock } = useAthleteSnapshot(user?.id ?? null);
  const { session, loading: sessionLoading } = useTodaySession();
  const ctx = useStrategyContext(user?.id ?? null);
  const demo = isDemoMode();

  // Override recovery with effective (wearable → wellness → baseline)
  const snapshot = useMemo(() => {
    if (!rawSnapshot) return null;
    return ctx.ready
      ? { ...rawSnapshot, recoveryToday: ctx.effectiveRecovery }
      : rawSnapshot;
  }, [rawSnapshot, ctx.ready, ctx.effectiveRecovery]);

  const demand = useMemo(() => {
    const base = session
      ? {
          expectedTimeSeconds: session.expected_time_seconds ?? 600,
          phosphagen: session.energy_phosphagen,
          glycolytic: session.energy_glycolytic,
          oxidative: session.energy_oxidative,
          dominantLimiter: (session.primary_limiter ?? "engine") as
            | "engine"
            | "strength"
            | "gymnastics",
          description: session.description,
        }
      : FALLBACK_DEMAND;
    return {
      ...base,
      movements: demo ? DEMO_MOVEMENTS : undefined,
    };
  }, [session, demo]);

  const [protocolId, setProtocolId] = useState<ProtocolId | null>(null);
  const activeProtocol: ProtocolId = protocolId ?? "smart_engine";

  // Stage 5 of pipeline runs full Decision Hierarchy
  const ctxPlan = useMemo(() => {
    if (!snapshot || !ctx.ready) return null;
    const goals: Goal[] = ctx.goals.length
      ? ctx.goals
      : (demo ? (["competition"] as Goal[]) : []);
    return runDecisionPipeline({
      snapshot,
      demand,
      stimulus: {
        intended_stimulus_min: session?.intended_stimulus_min ?? null,
        intended_stimulus_max: session?.intended_stimulus_max ?? null,
        stimulus_description: session?.stimulus_description ?? null,
      },
      goals,
      activeProtocol,
    });
  }, [snapshot, ctx.ready, ctx.goals, demand, session, activeProtocol, demo]);

  const plan = ctxPlan?.plan ?? null;
  const recommended = plan?.recommendedProtocol ?? "smart_engine";
  const finalActiveProtocol: ProtocolId = protocolId ?? recommended;

  // Persist generated strategy + chosen protocol so coach can read it
  useEffect(() => {
    if (!plan || !session || !user || demo) return;
    (supabase as any)
      .from("athlete_strategies")
      .upsert(
        {
          session_id: session.id,
          athlete_id: user.id,
          anaerobic_threshold_bpm: plan.anaerobicThresholdBpm,
          redline_bpm: plan.redlineBpm,
          fatigue_point_seconds: plan.protocols[finalActiveProtocol].fatiguePointSeconds,
          splits: plan.protocols[finalActiveProtocol].splits as any,
          advice: plan.advice,
          chosen_protocol: finalActiveProtocol,
        },
        { onConflict: "session_id,athlete_id" },
      )
      .then(() => undefined);
  }, [plan, session, user, finalActiveProtocol, demo]);

  if (loading || sessionLoading || !ctx.ready) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 md:px-8 py-24 max-w-4xl mx-auto">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  if (!snapshot || !plan || !ctxPlan) {
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

  const protocol = plan.protocols[finalActiveProtocol];


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed top-16 left-0 right-0 h-0.5 bg-gradient-fire z-40 opacity-70" />

      <div className="px-4 md:px-8 py-24 max-w-4xl mx-auto space-y-6">
        {(demo || isMock) && <DemoBanner reason="briefing draait op demo-data." />}

        <RoleBadge
          role="athlete"
          description="Pre-flight briefing — jouw profiel toegepast op vandaag's WOD"
        />

        {/* Mission header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary mb-2">
              <Plane className="w-3.5 h-3.5" />
              Pre-flight briefing
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-1">
              Mission: <span className="text-gradient-fire">{session?.title ?? "Conditioning"}</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Voorspelde finish:{" "}
              <span className="font-mono text-foreground">
                {formatSeconds(protocol.predictedTimeSeconds)}
              </span>{" "}
              • Fatigue point:{" "}
              <span className="font-mono text-foreground">
                {formatSeconds(protocol.fatiguePointSeconds)}
              </span>
            </p>
          </div>
        </div>

        {/* WOD card */}
        {session && (
          <div className="rounded-xl bg-gradient-card border border-border p-6 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Mission brief
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

        {/* Goal alignment + scaling proposal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GoalAlignmentBadge score={ctxPlan.goalAlignment} goals={ctx.goals} />
          <div className="rounded-xl border border-border bg-secondary/30 p-4 flex items-center gap-3">
            <Heart className="w-5 h-5 text-primary shrink-0" />
            <div className="text-xs">
              <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                Recovery bron
              </p>
              <p className="text-sm">
                {ctx.recoverySource === "wearable"
                  ? "Wearable (HRV/RHR vandaag)"
                  : ctx.recoverySource === "wellness"
                    ? `Subjectieve wellness (${ctx.subjectiveWellness}/10)`
                    : "Leeftijd/geslacht baseline"}
                {" · "}
                <span className="font-mono text-foreground">
                  {Math.round(ctx.effectiveRecovery * 100)}%
                </span>
              </p>
            </div>
            <Badge variant="outline" className="ml-auto text-[10px]">
              CNS cap {Math.round(ctxPlan.cnsMax1RmPct * 100)}% 1RM
            </Badge>
          </div>
        </div>

        {ctxPlan.proposal && <ScalingProposalCard proposal={ctxPlan.proposal} />}

        {ctxPlan.intensityCeiling !== "z3" && (
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <p className="text-xs">
              Biometrische limiet actief — intensiteit gecapt op{" "}
              <strong>{ctxPlan.intensityCeiling.toUpperCase()}</strong>. Engine
              negeert protocol-keuzes die hier overheen vragen.
            </p>
          </div>
        )}

        {/* Pilot status */}
        <div className="rounded-xl bg-gradient-card border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold">Pilot status</p>
            {plan.deloadApplied && (
              <Badge
                variant="outline"
                className="border-warning/40 text-warning bg-warning/10"
              >
                <Shield className="w-3 h-3 mr-1" />
                De-load actief −
                {Math.round((1 - protocol.loadScalingPct) * 100)}%
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Engine", value: Math.round(snapshot.engineScore * 100), suffix: "/100" },
              { label: "Kracht", value: Math.round(snapshot.strengthScore * 100), suffix: "/100" },
              { label: "Gymnastiek", value: Math.round(snapshot.gymnasticsScore * 100), suffix: "/100" },
              { label: "Recovery", value: Math.round(snapshot.recoveryToday * 100), suffix: "%" },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-secondary/40 border border-border p-3">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="font-display font-bold text-2xl mt-1">
                  {m.value}
                  <span className="text-sm text-muted-foreground font-normal">
                    {m.suffix}
                  </span>
                </p>
              </div>
            ))}
          </div>

          {/* Movement interference badges */}
          {plan.interference.notes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Movement interference
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ctxPlan.microRestSec > 0 && (
                  <Badge variant="outline" className="border-warning/40 text-warning">
                    <Timer className="w-3 h-3 mr-1" />
                    Grip micro-rest {ctxPlan.microRestSec}s
                  </Badge>
                )}
                {plan.interference.posteriorTax >= 0.5 && (
                  <Badge variant="outline" className="border-warning/40 text-warning">
                    Posterior chain ↑{Math.abs(Math.round(plan.interference.fatigueShiftPct * 100))}%
                  </Badge>
                )}
                {plan.interference.shoulderTax >= 0.5 && (
                  <Badge variant="outline" className="border-warning/40 text-warning">
                    Schouder pull+press overlap
                  </Badge>
                )}
                {plan.density.map((d) => (
                  <Badge
                    key={d.slug}
                    variant="outline"
                    className={
                      d.curve === "exponential"
                        ? "border-destructive/40 text-destructive"
                        : "border-success/40 text-success"
                    }
                  >
                    {d.slug} {d.repsPerSet}/{d.unbrokenMax || "?"} —{" "}
                    {d.curve === "exponential" ? "exponentieel" : "lineair"}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Protocol selector */}
        <div className="rounded-xl bg-gradient-card border border-border p-5 shadow-card">
          <p className="font-display font-semibold mb-1">Kies je protocol</p>
          <p className="text-xs text-muted-foreground mb-4">
            Aanbevolen op basis van herstel + engine:{" "}
            <span className="text-foreground font-semibold">
              {plan.protocols[plan.recommendedProtocol].name}
            </span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.keys(plan.protocols) as ProtocolId[]).map((pid) => {
              const p = plan.protocols[pid];
              const meta = PROTOCOL_META[pid];
              const Icon = meta.icon;
              const active = pid === finalActiveProtocol;
              const recommended = pid === plan.recommendedProtocol;
              return (
                <button
                  key={pid}
                  onClick={() => setProtocolId(pid)}
                  className={`text-left rounded-lg border p-4 transition-all ${
                    active
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-secondary/30 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${meta.tone.split(" ").slice(-1)[0]}`} />
                      <span className="font-display font-semibold">{p.name}</span>
                    </div>
                    {recommended && (
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                        Aanbevolen
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {p.tagline}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive timeline */}
        <FatigueTimelineInteractive plan={plan} protocolId={finalActiveProtocol} />

        {/* Pacing narrative */}
        <div className="rounded-xl bg-gradient-card border border-border p-6 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-lg">Pacing clusters</h3>
          </div>
          <p className="text-sm leading-relaxed mb-4">{protocol.narrative}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {protocol.splits.map((split) => (
              <div
                key={split.label}
                className="rounded-lg bg-secondary/40 border border-border p-3"
              >
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {formatSeconds(split.startSec)} – {formatSeconds(split.endSec)}
                </p>
                <p className="font-semibold text-sm mt-0.5">{split.label}</p>
                <p className="text-xs text-primary font-mono mt-1">
                  {split.intensityPct}% HRmax
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                  {split.cue}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Coach voice */}
        <div className="rounded-xl bg-gradient-card border border-border p-6 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-lg">Coach voice</h3>
          </div>
          <p className="text-sm leading-relaxed">{plan.advice}</p>
        </div>

        {/* Post-WOD feedback */}
        {session && user && !demo && (
          <PostWodFeedback sessionId={session.id} athleteId={user.id} />
        )}
      </div>
    </div>
  );
};

export default WorkoutStrategy;
