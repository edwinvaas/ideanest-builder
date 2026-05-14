import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BarChart3 } from "lucide-react";
import type { AnomalyAlert } from "@/lib/coachInsights";
import type { OpenComparison } from "@/hooks/useCoachRoster";

interface Props {
  anomalies: AnomalyAlert[];
  openComparison: OpenComparison;
}

const SEVERITY_TONE: Record<AnomalyAlert["severity"], string> = {
  high: "border-destructive/40 bg-destructive/10 text-destructive",
  medium: "border-warning/40 bg-warning/10 text-warning",
  low: "border-border bg-secondary/30 text-foreground",
};

const CoachIntelligenceBar = ({ anomalies, openComparison }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    <div className="rounded-xl bg-gradient-card border border-border p-5 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <p className="font-display font-semibold">Anomaly detection</p>
        <Badge variant="outline" className="ml-auto">
          {anomalies.length}
        </Badge>
      </div>
      {anomalies.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Geen afwijkingen — alle atleten binnen 25% van baseline.
        </p>
      ) : (
        <ul className="space-y-2">
          {anomalies.slice(0, 4).map((a) => (
            <li
              key={a.athlete_id}
              className={`text-xs p-2 rounded-md border ${SEVERITY_TONE[a.severity]}`}
            >
              {a.message}
            </li>
          ))}
        </ul>
      )}
    </div>

    <div className="rounded-xl bg-gradient-card border border-border p-5 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-primary" />
        <p className="font-display font-semibold">Klas vs Open Global</p>
      </div>
      {openComparison.avgPercentile === null ? (
        <p className="text-xs text-muted-foreground">
          Geen Open-benchmark gepland of nog geen resultaten ingevoerd.
        </p>
      ) : (
        <div>
          <div className="flex items-end gap-2">
            <p className="font-display font-bold text-3xl">
              {openComparison.avgPercentile}
              <span className="text-sm text-muted-foreground font-normal">e</span>
            </p>
            <p className="text-xs text-muted-foreground mb-1">
              percentiel ({openComparison.openCode}, n={openComparison.sampleSize})
            </p>
          </div>
          <div className="h-2 mt-3 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-fire"
              style={{ width: `${openComparison.avgPercentile}%` }}
            />
          </div>
        </div>
      )}
    </div>
  </div>
);

export default CoachIntelligenceBar;
