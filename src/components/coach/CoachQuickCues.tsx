import { Badge } from "@/components/ui/badge";
import { AlertCircle, Flame, Snowflake } from "lucide-react";
import type { CoachAthleteRow } from "@/hooks/useCoachRoster";

interface Props {
  rows: CoachAthleteRow[];
}

const limiterColor: Record<string, string> = {
  engine: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  strength: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  gymnastics: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  mobility: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pacing: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

/**
 * Quick-cues mode: optimized for classes >12 athletes.
 * Coach sees only the names + dominant limiter colour-strip + risk flags.
 */
const CoachQuickCues = ({ rows }: Props) => {
  // Group by perceived limiter for batch coaching cues
  const byLimiter = new Map<string, CoachAthleteRow[]>();
  rows.forEach((r) => {
    const key = r.latestPerceivedLimiter ?? "unknown";
    if (!byLimiter.has(key)) byLimiter.set(key, []);
    byLimiter.get(key)!.push(r);
  });

  const redFlags = rows.filter(
    (r) => (r.latestRpe ?? 0) >= 9 || (r.latestRecovery ?? 100) < 50,
  );
  const fresh = rows.filter((r) => (r.latestRecovery ?? 0) >= 80);

  return (
    <div className="space-y-4">
      {/* Risk + fresh callouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="font-semibold text-sm">Red flags ({redFlags.length})</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Hoog RPE of laag herstel — scaling adviseren.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {redFlags.map((r) => (
              <Badge key={r.id} variant="outline" className="text-xs border-destructive/30">
                {r.display_name}
              </Badge>
            ))}
            {redFlags.length === 0 && (
              <span className="text-xs text-muted-foreground">Geen — class kan vol gas.</span>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-success/5 border border-success/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-success" />
            <p className="font-semibold text-sm">Fris ({fresh.length})</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Herstel ≥ 80% — push voor PR's.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {fresh.map((r) => (
              <Badge key={r.id} variant="outline" className="text-xs border-success/30">
                {r.display_name}
              </Badge>
            ))}
            {fresh.length === 0 && (
              <span className="text-xs text-muted-foreground">Niemand top-fresh.</span>
            )}
          </div>
        </div>
      </div>

      {/* Limiter buckets */}
      <div className="rounded-xl bg-gradient-card border border-border p-5 shadow-card">
        <p className="font-display font-semibold mb-4">Coach cues per limiter</p>
        <div className="space-y-3">
          {Array.from(byLimiter.entries()).map(([limiter, list]) => (
            <div key={limiter} className="flex items-start gap-3">
              <Badge
                variant="outline"
                className={`shrink-0 text-xs uppercase ${
                  limiterColor[limiter] ?? "border-border"
                }`}
              >
                {limiter}
              </Badge>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {list.map((r) => (
                  <span
                    key={r.id}
                    className="text-xs px-2 py-0.5 rounded-md bg-secondary text-foreground"
                  >
                    {r.display_name}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {byLimiter.size === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Snowflake className="w-4 h-4" />
              Nog geen post-WOD data — cues verschijnen na de eerste sessie.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachQuickCues;
