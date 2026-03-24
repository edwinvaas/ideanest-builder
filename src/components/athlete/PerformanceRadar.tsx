import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const data = [
  { metric: "Engine", value: 78, fullMark: 100 },
  { metric: "Strength", value: 62, fullMark: 100 },
  { metric: "Gymnastics", value: 45, fullMark: 100 },
  { metric: "Olympic Lifting", value: 70, fullMark: 100 },
  { metric: "Endurance", value: 85, fullMark: 100 },
  { metric: "Mobility", value: 55, fullMark: 100 },
];

const PerformanceRadar = () => {
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
