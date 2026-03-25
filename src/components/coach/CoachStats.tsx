import { Users, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

const stats = [
  { label: "Total Athletes", value: "24", icon: Users, color: "text-primary" },
  { label: "Limiters Identified", value: "18", icon: AlertTriangle, color: "text-accent" },
  { label: "Avg. Progress", value: "+4.2", icon: TrendingUp, color: "text-success" },
  { label: "Stagnating", value: "3", icon: TrendingDown, color: "text-destructive" },
];

const CoachStats = () => {
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
