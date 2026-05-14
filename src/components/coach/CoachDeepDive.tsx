import { Badge } from "@/components/ui/badge";
import type { CoachAthleteRow } from "@/hooks/useCoachRoster";

interface Props {
  rows: CoachAthleteRow[];
}

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return "vandaag";
  if (days === 1) return "1 dag";
  return `${days} d`;
}

/**
 * Deep-dive mode: optimized for small classes ≤6 athletes.
 * Full per-athlete row with RPE trend, limiter, recovery and last session.
 */
const CoachDeepDive = ({ rows }: Props) => (
  <div className="rounded-xl bg-gradient-card border border-border shadow-card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-secondary/30">
            {[
              "Atleet",
              "Ervaring",
              "Laatste RPE",
              "Limiter",
              "Recovery",
              "Laatste sessie",
            ].map((h) => (
              <th
                key={h}
                className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/20">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-fire flex items-center justify-center text-xs font-bold text-white">
                    {r.display_name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-medium text-sm">{r.display_name}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-muted-foreground capitalize">
                {r.experience ?? "—"}
              </td>
              <td className="py-3 px-4">
                {r.latestRpe ? (
                  <Badge
                    variant="outline"
                    className={`font-mono text-xs ${
                      r.latestRpe >= 9
                        ? "border-destructive/40 text-destructive"
                        : r.latestRpe >= 7
                          ? "border-orange-500/40 text-orange-400"
                          : "border-success/40 text-success"
                    }`}
                  >
                    {r.latestRpe}/10
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-3 px-4">
                {r.latestPerceivedLimiter ? (
                  <Badge variant="outline" className="text-xs capitalize">
                    {r.latestPerceivedLimiter}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-3 px-4">
                {r.latestRecovery !== null ? (
                  <span
                    className={`font-mono text-sm ${
                      r.latestRecovery >= 70
                        ? "text-success"
                        : r.latestRecovery >= 50
                          ? "text-orange-400"
                          : "text-destructive"
                    }`}
                  >
                    {r.latestRecovery}%
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-3 px-4 text-xs text-muted-foreground">
                {timeAgo(r.latestSessionAt)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                Geen atleten gekoppeld aan jouw box.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default CoachDeepDive;
