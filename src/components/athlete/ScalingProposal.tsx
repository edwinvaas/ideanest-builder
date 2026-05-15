import { AlertTriangle, ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ScalingProposal as Proposal } from "@/lib/decisionHierarchy";

interface Props {
  proposal: Proposal;
}

const ScalingProposalCard = ({ proposal }: Props) => {
  const loadDelta = Math.round((proposal.loadScalingPct - 1) * 100);
  const repDelta = Math.round((proposal.repScalingPct - 1) * 100);
  const isUp = loadDelta > 0;

  return (
    <div className="rounded-xl border border-warning/40 bg-warning/5 p-5">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <p className="text-xs uppercase tracking-wide text-warning font-semibold">
          Scaling proposal — stimulus-bescherming
        </p>
      </div>
      <p className="text-sm leading-snug mb-3">{proposal.reason}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-secondary/40 border border-border p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {isUp ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            Gewicht
          </p>
          <p className="font-display font-bold text-2xl mt-1">
            {loadDelta > 0 ? "+" : ""}
            {loadDelta}%
          </p>
        </div>
        <div className="rounded-lg bg-secondary/40 border border-border p-3">
          <p className="text-xs text-muted-foreground">Reps</p>
          <p className="font-display font-bold text-2xl mt-1">
            {repDelta > 0 ? "+" : ""}
            {repDelta}%
          </p>
        </div>
      </div>
      {proposal.substitutions.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {proposal.substitutions.map((s) => (
            <li key={s}>• {s}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ScalingProposalCard;
