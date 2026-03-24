import { AlertTriangle, ArrowDown } from "lucide-react";

const LimiterCard = () => {
  return (
    <div className="rounded-xl bg-gradient-card border border-border p-6 shadow-card">
      <h3 className="font-display font-semibold text-lg mb-4">Limiter Analyse</h3>

      <div className="space-y-4">
        {/* Primary Limiter */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-primary font-medium uppercase tracking-wider">Primaire Limiter</p>
              <p className="font-display font-bold text-xl">Gymnastics</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Gymnastics is je zwakste punt en beperkt je het meest in metcons met
            bodyweight movements. Focus hier de komende 4-6 weken op.
          </p>
        </div>

        {/* Secondary Limiters */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Secundaire aandachtspunten</p>

          {[
            { name: "Mobility", score: 55, trend: -3 },
            { name: "Strength", score: 62, trend: 2 },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="font-medium text-sm">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-display font-semibold">{item.score}/100</span>
                <span className={`text-xs flex items-center gap-1 ${item.trend < 0 ? "text-destructive" : "text-success"}`}>
                  {item.trend < 0 && <ArrowDown className="w-3 h-3" />}
                  {item.trend > 0 ? `+${item.trend}` : item.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LimiterCard;
