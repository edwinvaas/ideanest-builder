import { Badge } from "@/components/ui/badge";
import { boxAthletes as athletes } from "@/data/athletes";

const statusColors: Record<string, string> = {
  improving: "bg-success/20 text-success border-success/30",
  stagnating: "bg-destructive/20 text-destructive border-destructive/30",
};

const AthleteTable = () => {
  return (
    <div className="rounded-xl bg-gradient-card border border-border shadow-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="font-display font-semibold text-lg">Athletes Overview</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Athlete</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Score</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Primary Limiter</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Trend</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((athlete) => (
              <tr key={athlete.name} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-fire flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {athlete.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <span className="font-medium text-sm">{athlete.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-display font-semibold">{athlete.score}</span>
                  <span className="text-muted-foreground text-sm">/100</span>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="font-normal border-primary/30 text-primary bg-primary/5">
                    {athlete.limiter}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${
                    athlete.trend.startsWith("+") ? "text-success" :
                    athlete.trend.startsWith("-") ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {athlete.trend}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[athlete.status]}`}>
                    {athlete.status === "improving" ? "Improving" : "Stagnating"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AthleteTable;
