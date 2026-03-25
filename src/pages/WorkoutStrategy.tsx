import Navbar from "@/components/Navbar";
import { useAthlete } from "@/contexts/AthleteContext";
import { Target, Calendar, TrendingUp, Zap, Clock, Flame, Dumbbell, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

const WorkoutStrategy = () => {
  const { profile } = useAthlete();

  const weeklyPlan = [
    { day: "Monday", focus: "Strength", type: "Back Squat 5x5 + Accessory", intensity: "Heavy", icon: Dumbbell },
    { day: "Tuesday", focus: "Engine", type: "30 min AMRAP mixed modality", intensity: "Moderate", icon: Flame },
    { day: "Wednesday", focus: "Gymnastics", type: "Skill work: HSPU & MU progressions", intensity: "Skill", icon: Activity },
    { day: "Thursday", focus: "Olympic Lifting", type: "Clean & Jerk technique + Deadlift", intensity: "Heavy", icon: Dumbbell },
    { day: "Friday", focus: "Metcon", type: "Competition-style WOD", intensity: "High", icon: Zap },
    { day: "Saturday", focus: "Endurance", type: "Long aerobic session (row/run/bike)", intensity: "Low", icon: Clock },
    { day: "Sunday", focus: "Recovery", type: "Mobility & active recovery", intensity: "Rest", icon: Target },
  ];

  const intensityColors: Record<string, string> = {
    Heavy: "bg-destructive/20 text-destructive",
    Moderate: "bg-accent/20 text-accent",
    High: "bg-primary/20 text-primary",
    Skill: "bg-info/20 text-info",
    Low: "bg-success/20 text-success",
    Rest: "bg-secondary text-muted-foreground",
  };

  const predictions = [
    { metric: "Back Squat", current: profile.maxLifts.backSquat, predicted: Math.round(profile.maxLifts.backSquat * 1.07), unit: "kg" },
    { metric: "Deadlift", current: profile.maxLifts.deadlift, predicted: Math.round(profile.maxLifts.deadlift * 1.06), unit: "kg" },
    { metric: "Clean & Jerk", current: profile.maxLifts.cleanAndJerk, predicted: Math.round(profile.maxLifts.cleanAndJerk * 1.08), unit: "kg" },
    { metric: "Fran", current: profile.benchmarks.fran || "N/A", predicted: "~3:55", unit: "" },
    { metric: "Pull-ups", current: profile.gymnastics.maxPullups, predicted: profile.gymnastics.maxPullups + 5, unit: "reps" },
  ];

  const progressionData = [
    { week: "W1", score: 72 },
    { week: "W4", score: 75 },
    { week: "W8", score: 79 },
    { week: "W12", score: 83 },
    { week: "W16", score: 86 },
    { week: "W20", score: 89 },
    { week: "W24", score: 91 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Workout <span className="text-gradient-fire">Strategy</span>
            </h1>
            <p className="text-muted-foreground">
              Personalized training plan & predictions for {profile.name || "Athlete"}
            </p>
          </div>

          {/* Weekly Plan */}
          <div className="rounded-xl bg-gradient-card border border-border p-6 shadow-card mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold text-lg">Weekly Training Plan</h2>
            </div>
            <div className="space-y-3">
              {weeklyPlan.map((day) => (
                <div key={day.day} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <day.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-display font-semibold text-sm">{day.day}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intensityColors[day.intensity]}`}>
                        {day.intensity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{day.focus} — {day.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predictions */}
            <div className="rounded-xl bg-gradient-card border border-border p-6 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="font-display font-semibold text-lg">8-Week Predictions</h2>
                  <p className="text-xs text-muted-foreground">Based on your current data & training plan</p>
                </div>
              </div>
              <div className="space-y-4">
                {predictions.map((pred) => (
                  <div key={pred.metric} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <span className="font-medium text-sm">{pred.metric}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {pred.current}{pred.unit ? ` ${pred.unit}` : ""}
                      </span>
                      <span className="text-primary">→</span>
                      <span className="font-display font-semibold text-sm text-success">
                        {pred.predicted}{pred.unit ? ` ${pred.unit}` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projected Score */}
            <div className="rounded-xl bg-gradient-card border border-border p-6 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="font-display font-semibold text-lg">Projected Overall Score</h2>
                  <p className="text-xs text-muted-foreground">6-month trajectory following this plan</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={progressionData}>
                  <XAxis dataKey="week" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fill: "hsl(220, 10%, 40%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {progressionData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "hsl(220, 15%, 30%)" : `hsl(12, 90%, ${45 + index * 5}%)`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs text-success font-medium">
                  📈 Following this plan, your overall score is projected to increase from 72 to 91 in 24 weeks
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutStrategy;
