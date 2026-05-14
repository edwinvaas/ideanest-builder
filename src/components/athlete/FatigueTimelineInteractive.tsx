import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildTimeline,
  type ProtocolId,
  type StrategyPlan,
} from "@/lib/fatigueEngine";
import { formatSeconds } from "@/lib/onboardingSync";
import { Flame, Wind, Zap, AlertTriangle } from "lucide-react";

interface Props {
  plan: StrategyPlan;
  protocolId: ProtocolId;
}

const ZONE_META = {
  z1: {
    label: "Zone 1 — Aeroob",
    color: "hsl(var(--success))",
    icon: Wind,
    fillVar: "hsl(142, 71%, 45%, 0.08)",
  },
  z2: {
    label: "Zone 2 — Threshold",
    color: "hsl(45, 95%, 55%)",
    icon: Zap,
    fillVar: "hsl(45, 95%, 55%, 0.10)",
  },
  z3: {
    label: "Zone 3 — Redline",
    color: "hsl(var(--destructive))",
    icon: AlertTriangle,
    fillVar: "hsl(0, 85%, 60%, 0.10)",
  },
};

const FatigueTimelineInteractive = ({ plan, protocolId }: Props) => {
  const data = useMemo(
    () =>
      buildTimeline(plan, protocolId).map((p) => ({
        ...p,
        label: formatSeconds(p.t),
      })),
    [plan, protocolId],
  );

  const [scrubT, setScrubT] = useState(0);
  const point =
    data.find((d) => d.t >= scrubT) ?? data[data.length - 1] ?? null;
  const meta = point ? ZONE_META[point.zone] : ZONE_META.z1;
  const Icon = meta.icon;

  // Z3 minute count for "danger zone exposure"
  const dangerSecs = data.filter((d) => d.zone === "z3").length * 5;

  return (
    <div className="rounded-xl bg-gradient-card border border-border p-6 shadow-card">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-lg">
              Fatigue Timeline
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Crossover ≈ {formatSeconds(plan.fatiguePointSeconds)} • Danger Zone:{" "}
            {formatSeconds(dangerSecs)}
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground space-y-0.5">
          <div>
            Drempel:{" "}
            <span className="text-foreground font-mono">
              {plan.anaerobicThresholdBpm} bpm
            </span>
          </div>
          <div>
            Redline:{" "}
            <span className="text-foreground font-mono">{plan.redlineBpm} bpm</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -10 }}
        >
          <defs>
            <linearGradient id="hrFillAdv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(12, 90%, 55%)" stopOpacity={0.6} />
              <stop offset="100%" stopColor="hsl(12, 90%, 55%)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(220, 15%, 20%)" strokeDasharray="3 3" />
          {/* Zone bands */}
          <ReferenceArea
            y1={0}
            y2={plan.anaerobicThresholdBpm * 0.8}
            fill={ZONE_META.z1.fillVar}
            ifOverflow="extendDomain"
          />
          <ReferenceArea
            y1={plan.anaerobicThresholdBpm * 0.8}
            y2={plan.anaerobicThresholdBpm * 0.95}
            fill={ZONE_META.z2.fillVar}
          />
          <ReferenceArea
            y1={plan.anaerobicThresholdBpm * 0.95}
            y2={plan.estimatedMaxHr + 10}
            fill={ZONE_META.z3.fillVar}
          />
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
          />
          <ReferenceLine
            y={plan.redlineBpm}
            stroke="hsl(0, 85%, 60%)"
            strokeDasharray="4 4"
          />
          <ReferenceLine
            x={formatSeconds(plan.fatiguePointSeconds)}
            stroke="hsl(12, 90%, 55%)"
            strokeWidth={2}
          />
          {point && (
            <ReferenceLine
              x={point.label}
              stroke="hsl(var(--foreground))"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          )}
          <Area
            type="monotone"
            dataKey="hr"
            stroke="hsl(12, 90%, 55%)"
            strokeWidth={2}
            fill="url(#hrFillAdv)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Scrubber */}
      <div className="mt-3 px-1">
        <input
          type="range"
          min={0}
          max={plan.predictedTimeSeconds}
          step={5}
          value={scrubT}
          onChange={(e) => setScrubT(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label="Tijdlijn scrubber"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
          <span>0:00</span>
          <span className="text-foreground">
            {point ? formatSeconds(point.t) : "0:00"}
          </span>
          <span>{formatSeconds(plan.predictedTimeSeconds)}</span>
        </div>
      </div>

      {/* Now playing panel */}
      {point && (
        <div
          className="mt-4 rounded-lg border p-4"
          style={{ borderColor: meta.color, background: meta.fillVar }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4" style={{ color: meta.color }} />
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              {point.hr} bpm • {point.intensityPct}% HRmax
            </span>
          </div>
          <p className="text-sm leading-snug">{point.cue}</p>
        </div>
      )}
    </div>
  );
};

export default FatigueTimelineInteractive;
