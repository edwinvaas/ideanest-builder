import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LIMITER_LABEL } from "@/lib/ui-mapping";
import type { LimiterType } from "@/types/wod-analysis";

interface AthleteRow {
  id: string;
  display_name: string;
  score: number;
  primary_limiter: LimiterType | null;
  trend: number;
  status: "improving" | "stagnating";
}

const statusColors = {
  improving: "bg-success/10 text-success border-success/20",
  stagnating: "bg-destructive/10 text-destructive border-destructive/20",
};

export const AthleteTable = () => {
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Join athletes with their most recent limiter profile.
    // RLS on both tables enforces box_id automatically.
    (supabase as any)
      .from("athletes")
      .select(`
        id,
        display_name,
        athlete_limiter_profiles (
          engine_score,
          strength_score,
          gymnastics_score,
          mobility_score,
          pacing_score,
          recovery_score,
          primary_limiter,
          assessed_at
        )
      `)
      .order("display_name")
      .then(({ data, error }) => {
        if (error) {
          console.error("AthleteTable fetch error:", error.message);
          setLoading(false);
          return;
        }

        const rows: AthleteRow[] = (data ?? []).map((a) => {
          // Take the most recent profile entry
          const profiles = (a.athlete_limiter_profiles ?? []) as any[];
          const latest = profiles.sort(
            (x, y) =>
              new Date(y.assessed_at).getTime() - new Date(x.assessed_at).getTime(),
          )[0];

          const scores = latest
            ? [
                latest.engine_score,
                latest.strength_score,
                latest.gymnastics_score,
                latest.mobility_score,
                latest.pacing_score,
                latest.recovery_score,
              ].filter(Boolean)
            : [];

          const avgScore =
            scores.length > 0
              ? Math.round(
                  (scores.reduce((s: number, v: number) => s + v, 0) / scores.length) * 100,
                )
              : 0;

          return {
            id: a.id,
            display_name: a.display_name,
            score: avgScore,
            primary_limiter: latest?.primary_limiter ?? null,
            trend: 0, // historical delta — requires a second profile to compute
            status: avgScore >= 50 ? "improving" : "stagnating",
          };
        });

        setAthletes(rows);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="gradient-card rounded-2xl p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-white/10 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="gradient-card rounded-2xl p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Atleet
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Score
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Primaire limiter
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Trend
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((athlete) => (
              <tr
                key={athlete.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {athlete.display_name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">{athlete.display_name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm font-mono">{athlete.score}/100</td>
                <td className="py-3 px-4">
                  {athlete.primary_limiter ? (
                    <Badge variant="outline" className="text-xs">
                      {LIMITER_LABEL[athlete.primary_limiter]}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">–</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-sm font-medium ${
                      athlete.trend > 0
                        ? "text-success"
                        : athlete.trend < 0
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  >
                    {athlete.trend > 0 ? `+${athlete.trend}` : athlete.trend === 0 ? "–" : athlete.trend}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Badge className={`text-xs border ${statusColors[athlete.status]}`}>
                    {athlete.status === "improving" ? "Groeiend" : "Stagnerend"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {athletes.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Geen atleten gevonden. Voeg atleten toe via Instellingen.
          </p>
        )}
      </div>
    </div>
  );
};
