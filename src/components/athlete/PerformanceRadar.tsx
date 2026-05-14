import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { AthleteSnapshot } from "@/lib/fatigueEngine";

interface Props {
  snapshot: AthleteSnapshot | null;
}

const PerformanceRadar = ({ snapshot }: Props) => {
  const data = snapshot
    ? [
        { metric: "Engine", value: Math.round(snapshot.engineScore * 100) },
        { metric: "Strength", value: Math.round(snapshot.strengthScore * 100) },
        { metric: "Gymnastics", value: Math.round(snapshot.gymnasticsScore * 100) },
        { metric: "Recovery", value: Math.round(snapshot.recoveryToday * 100) },
        { metric: "Threshold", value: Math.round(snapshot.redlinePct * 100) },
        { metric: "Resilience", value: Math.round(snapshot.recoveryFactor * 60) },
      ]
    : [
        { metric: "Engine", value: 0 },
        { metric: "Strength", value: 0 },
        { metric: "Gymnastics", value: 0 },
        { metric: "Recovery", value: 0 },
        { metric: "Threshold", value: 0 },
        { metric: "Resilience", value: 0 },
      ];

  return (
    <div className="rounded-xl bg-gradient-card border border-border p-6 shadow-card">
      <h3 className="font-display font-semibold text-lg mb-4">Performance Profiel</h3>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="hsl(220, 15%, 20%)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12, fontFamily: "Inter" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "hsl(220, 10%, 40%)", fontSize: 10 }}
          />
          <Radar
            name="Performance"
            dataKey="value"
            stroke="hsl(12, 90%, 55%)"
            fill="hsl(12, 90%, 55%)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceRadar;
