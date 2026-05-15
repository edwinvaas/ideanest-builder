import { AlertOctagon, Sparkles, Wind } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AnatomyReport } from "@/lib/anatomy";

interface Props {
  anatomy: AnatomyReport;
  transitionBufferSec: number;
}

const SEVERITY_TONE: Record<"info" | "warning" | "critical", string> = {
  info: "border-primary/30 text-primary",
  warning: "border-warning/40 text-warning",
  critical: "border-destructive/40 text-destructive",
};

const BottleneckAlert = ({ anatomy, transitionBufferSec }: Props) => {
  if (!anatomy.bottleneck && anatomy.alerts.length === 0 && !anatomy.flowTip) {
    return null;
  }

  return (
    <div className="rounded-xl bg-gradient-card border border-border p-5 shadow-card space-y-4">
      {anatomy.bottleneck && (
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-2 shrink-0">
            <AlertOctagon className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Bottleneck vandaag
            </p>
            <p className="font-display font-bold text-lg leading-tight">
              {anatomy.bottleneck.label}
            </p>
            {anatomy.fatigueAccumulationBoost > 1 && (
              <p className="text-xs text-warning mt-1">
                Fatigue accumulation +
                {Math.round((anatomy.fatigueAccumulationBoost - 1) * 100)}% — plan
                je breaks vóór de redline.
              </p>
            )}
          </div>
          {transitionBufferSec > 0 && (
            <Badge variant="outline" className="border-warning/40 text-warning">
              Transition {transitionBufferSec}s
            </Badge>
          )}
        </div>
      )}

      {anatomy.flowTip && (
        <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
          <Wind className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm leading-snug">
            <span className="text-primary font-semibold">Movement Flow Tip:</span>{" "}
            {anatomy.flowTip}
          </p>
        </div>
      )}

      {anatomy.alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Anatomical chain alerts
            </p>
          </div>
          <ul className="space-y-1.5">
            {anatomy.alerts.map((a, i) => (
              <li
                key={i}
                className={`text-xs leading-snug border-l-2 pl-2 ${SEVERITY_TONE[a.severity].replace("text-", "border-")}`}
              >
                <span className={SEVERITY_TONE[a.severity].split(" ").slice(-1)[0]}>
                  ●
                </span>{" "}
                {a.cue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BottleneckAlert;
