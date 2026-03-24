import { Flame, Dumbbell, Timer, TrendingUp } from "lucide-react";

const metrics = [
  { label: "Overall Score", value: "72", icon: TrendingUp, change: "+3", suffix: "/100" },
  { label: "Engine", value: "78", icon: Flame, change: "+5", suffix: "/100" },
  { label: "Strength", value: "62", icon: Dumbbell, change: "+2", suffix: "/100" },
  { label: "Fran Time", value: "4:32", icon: Timer, change: "-0:12", suffix: "" },
];

const MetricCards = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-xl bg-gradient-card border border-border p-4 shadow-card"
        >
          <div className="flex items-center justify-between mb-3">
            <metric.icon className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-success font-medium">{metric.change}</span>
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
