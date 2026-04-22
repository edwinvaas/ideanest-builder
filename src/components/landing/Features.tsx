import { Target, BarChart3, Users, Brain, ClipboardList, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Roster overview",
    description:
      "Every athlete in your box on one screen — score, trend, biggest limiter and stagnation flags.",
    audience: "For coaches",
  },
  {
    icon: ClipboardList,
    title: "Smarter class prep",
    description:
      "Coach Buddy tells you who to watch today, where to focus the class and how to scale — in seconds.",
    audience: "For coaches",
  },
  {
    icon: TrendingUp,
    title: "Spot stagnation early",
    description:
      "Trend tracking surfaces members who stopped progressing, so you can intervene before they drop off.",
    audience: "For coaches",
  },
  {
    icon: Target,
    title: "Limiter detection",
    description:
      "Each athlete gets one clear next focus — the single weakest link blocking their progress.",
    audience: "For athletes",
  },
  {
    icon: Brain,
    title: "Athlete Buddy",
    description:
      "A personal AI assistant that turns benchmarks and lifts into concrete weekly actions.",
    audience: "For athletes",
  },
  {
    icon: BarChart3,
    title: "Performance profile",
    description:
      "Engine, strength, gymnastics and more — visualized so progress is obvious to athlete and coach.",
    audience: "Shared",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-gradient-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            From data to <span className="text-gradient-fire">action</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Most apps just show numbers. BoxBrain tells your coaches and
            athletes exactly what to do next.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl bg-gradient-card border border-border hover:border-primary/30 transition-all duration-300 shadow-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:shadow-glow transition-shadow">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-secondary/60 border border-border rounded-full px-2 py-1">
                  {feature.audience}
                </span>
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
