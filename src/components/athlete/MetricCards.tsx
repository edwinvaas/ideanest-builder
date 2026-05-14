import { Flame, Dumbbell, Timer, TrendingUp } from "lucide-react";
import type { AthleteSnapshot } from "@/lib/fatigueEngine";
import { formatSeconds } from "@/lib/onboardingSync";

interface Props {
  snapshot: AthleteSnapshot | null;
  fran?: number;
}

const MetricCards = ({ snapshot, fran }: Props) => {
  const overall = snapshot
    ? Math.round(
        ((snapshot.engineScore + snapshot.strengthScore + snapshot.gymnasticsScore) / 3) * 100,
      )
    : 0;
  const metrics = [
    { label: "Overall", value: overall, icon: TrendingUp, suffix: "/100" },
    { label: "Engine", value: Math.round((snapshot?.engineScore ?? 0) * 100), icon: Flame, suffix: "/100" },
    { label: "Strength", value: Math.round((snapshot?.strengthScore ?? 0) * 100), icon: Dumbbell, suffix: "/100" },
    { label: "Fran", value: fran ? formatSeconds(fran) : "—", icon: Timer, suffix: "" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-xl bg-gradient-card border border-border p-4 shadow-card"
        >
          <div className="flex items-center justify-between mb-3">
            <metric.icon className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="font-display font-bold text-2xl">
            {metric.value}
            <span className="text-sm text-muted-foreground font-normal">{metric.suffix}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
        </div>
      ))}
    </div>
  );
};

export default MetricCards;
