import { Users, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import type { CoachAthleteRow } from "@/hooks/useCoachRoster";

interface Props {
  rows: CoachAthleteRow[];
}

const CoachStats = ({ rows }: Props) => {
  const total = rows.length;
  const withFeedback = rows.filter((r) => r.latestRpe !== null).length;
  const avgRpe =
    withFeedback > 0
      ? (
          rows.reduce((s, r) => s + (r.latestRpe ?? 0), 0) / withFeedback
        ).toFixed(1)
      : "—";
  const lowRecovery = rows.filter(
    (r) => r.latestRecovery !== null && r.latestRecovery < 60,
  ).length;

  const stats = [
    { label: "Atleten", value: total, icon: Users, color: "text-primary" },
    { label: "Gemiddeld RPE", value: avgRpe, icon: TrendingUp, color: "text-accent" },
    { label: "Met feedback", value: withFeedback, icon: Activity, color: "text-success" },
    { label: "Laag herstel", value: lowRecovery, icon: AlertTriangle, color: "text-destructive" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl bg-gradient-card border border-border p-4 shadow-card">
          <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
          <p className="font-display font-bold text-2xl">{stat.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default CoachStats;
