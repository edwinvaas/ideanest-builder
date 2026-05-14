import { Activity, Heart, Moon, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Recovery Widget — Mock data placeholder for future Garmin/Whoop integration.
 *
 * The `wearable_readings` table is already provisioned; once an API connector
 * is added, replace the `mock` constant with a real query like:
 *
 *   const { data } = await supabase
 *     .from("wearable_readings")
 *     .select("*")
 *     .eq("athlete_id", userId)
 *     .order("reading_date", { ascending: false })
 *     .limit(1)
 *     .maybeSingle();
 */
const mock = {
  recovery_pct: 78,
  hrv_ms: 64.2,
  resting_hr_bpm: 52,
  sleep_score: 84,
  sleep_hours: 7.6,
  source: "mock",
};

const recoveryColor = (pct: number) =>
  pct >= 75 ? "text-success" : pct >= 50 ? "text-accent" : "text-destructive";

const recoveryLabel = (pct: number) =>
  pct >= 75 ? "Green — go hard" : pct >= 50 ? "Amber — moderate" : "Red — recover";

export const RecoveryWidget = () => {
  return (
    <div className="gradient-card rounded-2xl p-6 border border-white/5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Today's Recovery
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-display font-bold ${recoveryColor(mock.recovery_pct)}`}>
              {mock.recovery_pct}
              <span className="text-lg text-muted-foreground">%</span>
            </span>
            <Badge variant="outline" className="text-xs">
              {recoveryLabel(mock.recovery_pct)}
            </Badge>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase">
          Demo data
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Activity className="w-3.5 h-3.5" />} label="HRV" value={`${mock.hrv_ms} ms`} />
        <Stat icon={<Heart className="w-3.5 h-3.5" />} label="RHR" value={`${mock.resting_hr_bpm} bpm`} />
        <Stat icon={<Moon className="w-3.5 h-3.5" />} label="Sleep" value={`${mock.sleep_hours} h`} />
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingUp className="w-3.5 h-3.5 text-success" />
        <span>Coming soon: live sync with Garmin & Whoop.</span>
      </div>
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-white/5 rounded-xl p-3">
    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
      {icon}
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </div>
    <p className="font-mono font-semibold text-sm">{value}</p>
  </div>
);

export default RecoveryWidget;
