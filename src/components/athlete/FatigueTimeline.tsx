import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildTimeline, type StrategyPlan } from "@/lib/fatigueEngine";
import { formatSeconds } from "@/lib/onboardingSync";
import { Flame } from "lucide-react";

interface Props {
  plan: StrategyPlan;
}

const FatigueTimeline = ({ plan }: Props) => {
  const data = useMemo(
    () =>
      buildTimeline(plan).map((p) => ({
        ...p,
        label: formatSeconds(p.t),
      })),
    [plan],
  );

  return (
    <div className="rounded-xl bg-gradient-card border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-lg">Fatigue Point Timeline</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Voorspelde HR-curve. Crossover ≈ {formatSeconds(plan.fatiguePointSeconds)}.
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground space-y-0.5">
          <div>Drempel: <span className="text-foreground font-mono">{plan.anaerobicThresholdBpm} bpm</span></div>
          <div>Redline: <span className="text-foreground font-mono">{plan.redlineBpm} bpm</span></div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="hrFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(12, 90%, 55%)" stopOpacity={0.6} />
              <stop offset="100%" stopColor="hsl(12, 90%, 55%)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(220, 15%, 20%)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 10 }}
            interval={Math.max(0, Math.floor(data.length / 6))}
          />
          <YAxis
            domain={[80, plan.estimatedMaxHr + 10]}
            tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(220, 20%, 10%)",
              border: "1px solid hsl(220, 15%, 22%)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "hsl(220, 10%, 75%)" }}
            formatter={(v: number) => [`${v} bpm`, "HR"]}
          />
          <ReferenceLine
            y={plan.anaerobicThresholdBpm}
            stroke="hsl(45, 95%, 55%)"
            strokeDasharray="4 4"
            label={{ value: "Drempel", position: "right", fill: "hsl(45, 95%, 55%)", fontSize: 10 }}
          />
          <ReferenceLine
            y={plan.redlineBpm}
            stroke="hsl(0, 85%, 60%)"
            strokeDasharray="4 4"
            label={{ value: "Redline", position: "right", fill: "hsl(0, 85%, 60%)", fontSize: 10 }}
          />
          <ReferenceLine
            x={formatSeconds(plan.fatiguePointSeconds)}
            stroke="hsl(12, 90%, 55%)"
            strokeWidth={2}
            label={{
              value: "Fatigue Point",
              position: "top",
              fill: "hsl(12, 90%, 55%)",
              fontSize: 10,
            }}
          />
          <Area
            type="monotone"
            dataKey="hr"
            stroke="hsl(12, 90%, 55%)"
            strokeWidth={2}
            fill="url(#hrFill)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {plan.splits.map((split) => (
          <div
            key={split.label}
            className="rounded-lg bg-secondary/40 border border-border p-3"
          >
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {formatSeconds(split.startSec)} – {formatSeconds(split.endSec)}
            </p>
            <p className="font-semibold text-sm mt-0.5">{split.label}</p>
            <p className="text-xs text-primary font-mono mt-1">{split.intensityPct}% HRmax</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{split.cue}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FatigueTimeline;
