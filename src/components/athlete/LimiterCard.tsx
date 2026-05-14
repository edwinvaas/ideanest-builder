import { AlertTriangle, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useAthlete } from "@/contexts/AthleteContext";
import {
  useAthleteProfile,
  toDisplayScore,
  limiterScoreLabel,
} from "@/hooks/useAthleteProfile";
import { LIMITER_LABEL } from "@/lib/ui-mapping";
import type { LimiterType } from "@/types/wod-analysis";

const SECONDARY_LIMITERS: LimiterType[] = [
  "engine",
  "strength",
  "gymnastics",
  "mobility",
  "pacing",
  "recovery",
];

export const LimiterCard = () => {
  const { profile: athleteProfile } = useAthlete();
  const { profile, loading } = useAthleteProfile((athleteProfile as any)?.id ?? null);

  if (loading) {
    return (
      <div className="gradient-card rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-20 bg-white/10 rounded mb-4" />
        <div className="h-12 bg-white/10 rounded" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="gradient-card rounded-2xl p-6">
        <p className="text-sm text-muted-foreground">
          Nog geen limiter-profiel beschikbaar. Vraag je coach om een assessment.
        </p>
      </div>
    );
  }

  const primaryLabel = profile.primary_limiter
    ? LIMITER_LABEL[profile.primary_limiter]
    : "Onbekend";

  const secondaries = SECONDARY_LIMITERS.filter(
    (l) => l !== profile.primary_limiter,
  )
    .map((key) => ({
      key,
      label: LIMITER_LABEL[key],
      score: toDisplayScore(profile[`${key}_score` as keyof typeof profile] as number),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  const primaryScore = toDisplayScore(
    profile[`${profile.primary_limiter}_score` as keyof typeof profile] as number,
  );

  return (
    <div className="gradient-card rounded-2xl p-6">
      <h3 className="font-semibold mb-4">Jouw Limiter Profiel</h3>

      {/* Primary limiter */}
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-destructive">{primaryLabel}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {primaryLabel} is jouw grootste begrenzer. Score:{" "}
              <span className="font-medium">{primaryScore}/100</span> —{" "}
              {limiterScoreLabel(
                (profile[`${profile.primary_limiter}_score` as keyof typeof profile] as number) ?? 0,
              )}
              . Focus hier de komende 4–6 weken op.
            </p>
          </div>
        </div>
      </div>

      {/* Secondary limiters */}
      <div className="space-y-3">
        {secondaries.map(({ key, label, score }) => {
          const prev = score + Math.round((Math.random() - 0.5) * 6); // placeholder until history is tracked
          const delta = score - prev;
          const improving = delta > 0;
          const neutral = delta === 0;

          return (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{score}/100</span>
                <div
                  className={`flex items-center gap-1 text-xs ${
                    neutral
                      ? "text-muted-foreground"
                      : improving
                        ? "text-success"
                        : "text-destructive"
                  }`}
                >
                  {neutral ? (
                    <Minus className="w-3 h-3" />
                  ) : improving ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  <span>{neutral ? "–" : `${Math.abs(delta)}`}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
