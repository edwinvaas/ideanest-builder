import { Target } from "lucide-react";

interface Props {
  score: number; // 0-100
  goals: string[];
}

const GoalAlignmentBadge = ({ score, goals }: Props) => {
  const tone =
    score >= 80
      ? "border-success/40 text-success bg-success/5"
      : score >= 55
        ? "border-primary/40 text-primary bg-primary/5"
        : "border-warning/40 text-warning bg-warning/5";
  const label = score >= 80 ? "Aligned" : score >= 55 ? "Partial" : "Misaligned";

  return (
    <div
      className={`rounded-xl border p-4 flex items-center gap-4 ${tone}`}
    >
      <div className="relative w-14 h-14 shrink-0">
        <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-display font-bold">
          {score}
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide">
          <Target className="w-3.5 h-3.5" />
          Goal alignment — {label}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {goals.length > 0
            ? `Doelen: ${goals.join(", ")}`
            : "Geen doelen ingesteld — neutrale baseline."}
        </p>
      </div>
    </div>
  );
};

export default GoalAlignmentBadge;
