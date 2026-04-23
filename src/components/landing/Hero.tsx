import heroBg from "@/assets/hero-bg.jpg";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-dark opacity-70" />
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="animate-slide-up max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Built for CrossFit box owners &amp; coaches
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">
            BoxBrain
            <span className="block mt-4 text-2xl md:text-3xl font-display font-medium italic text-gradient-fire tracking-normal">
              The intelligence behind better performance.
            </span>
          </h1>

          <p className="text-sm text-muted-foreground/80 max-w-xl mx-auto mb-10 italic">
            From data → to one concrete next action. For every athlete in your box.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-fire text-primary-foreground font-display font-semibold text-lg px-8 py-6 shadow-glow hover:opacity-90 transition-opacity"
              onClick={() => navigate("/coach")}
            >
              See the coach dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-display font-semibold text-lg px-8 py-6 border-border hover:bg-secondary"
              onClick={() => navigate("/onboarding")}
            >
              Try the athlete demo
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
