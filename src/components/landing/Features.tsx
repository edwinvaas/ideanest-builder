import { Target, BarChart3, Users, Brain } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Automatic analysis of your performance data to discover patterns and areas for improvement.",
  },
  {
    icon: Target,
    title: "Limiter Detection",
    description: "Identify your weakest link — the factor that limits you the most in WODs.",
  },
  {
    icon: BarChart3,
    title: "Performance Profile",
    description: "Visual overview of engine, strength, gymnastics and more in one dashboard.",
  },
  {
    icon: Users,
    title: "Coach Dashboard",
    description: "Overview of all athletes, trends and stagnation. Prioritize coaching where it's needed.",
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
            Not just another tracking app. We tell you what to do.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl bg-gradient-card border border-border hover:border-primary/30 transition-all duration-300 shadow-card"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                <feature.icon className="w-6 h-6 text-primary" />
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
