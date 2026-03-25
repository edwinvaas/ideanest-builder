import { Lightbulb, ChevronRight } from "lucide-react";

const adviceItems = [
  {
    category: "Gymnastics",
    title: "Focus on strict pull-ups",
    description: "Build strength with 3x8 strict pull-ups before your WOD. This improves kipping efficiency and reduces fatigue in metcons.",
    priority: "High",
  },
  {
    category: "Mobility",
    title: "Daily overhead mobility",
    description: "10 minutes per day on shoulder mobility. This improves your overhead squat position and snatch technique.",
    priority: "Medium",
  },
  {
    category: "Engine",
    title: "Add interval training",
    description: "2x per week 20 min EMOM with mixed modality. This builds your aerobic base further.",
    priority: "Low",
  },
];

const priorityColors: Record<string, string> = {
  High: "bg-primary/20 text-primary",
  Medium: "bg-accent/20 text-accent",
  Low: "bg-info/20 text-info",
};

const AdviceSection = () => {
  return (
    <div className="mt-6 rounded-xl bg-gradient-card border border-border p-6 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg">Improvement Advice</h3>
          <p className="text-sm text-muted-foreground">Personalized based on your profile</p>
        </div>
      </div>

      <div className="space-y-4">
        {adviceItems.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">{item.category}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[item.priority]}`}>
                  {item.priority}
                </span>
              </div>
              <p className="font-medium mb-1">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground mt-1 group-hover:text-foreground transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdviceSection;
