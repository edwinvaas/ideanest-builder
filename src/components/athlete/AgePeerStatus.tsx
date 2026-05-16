import { Trophy, ShieldCheck } from "lucide-react";
import type { AthleteSnapshot } from "@/lib/fatigueEngine";
import { buildAgePeerStatus } from "@/lib/agePeerStatus";

interface Props {
  snapshot: AthleteSnapshot | null;
  ageFallback?: number;
}

const LEVEL_TONE: Record<string, string> = {
  Beginner: "text-success border-success/30 bg-success/5",
  Intermediate: "text-primary border-primary/30 bg-primary/5",
  "Advanced-RX": "text-warning border-warning/40 bg-warning/5",
};

const AgePeerStatus = ({ snapshot, ageFallback }: Props) => {
  const status = buildAgePeerStatus(snapshot, ageFallback);
  const tone = LEVEL_TONE[status.level] ?? LEVEL_TONE.Beginner;

  return (
    <div className="rounded-xl bg-gradient-card border border-border p-5 shadow-card mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 border border-primary/30 p-2.5 shrink-0">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Jouw Divisie
            </p>
            <p className="font-display font-bold text-xl leading-tight">
              {status.divisionLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`rounded-lg border p-2.5 shrink-0 ${tone}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Berekend Niveau
            </p>
            <p className="font-display font-bold text-xl leading-tight">
              {status.level}
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Automatisch bepaald op basis van jouw data.
            </p>
          </div>
        </div>

        <div className="ml-auto text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Overall
          </p>
          <p className="font-display font-bold text-3xl text-gradient-fire leading-none">
            {status.overallScore}
            <span className="text-sm text-muted-foreground font-normal">/100</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgePeerStatus;
