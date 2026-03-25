import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="relative rounded-2xl bg-gradient-card border border-border p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-fire opacity-5" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              Check out the demo and discover how your athletes can progress faster.
            </p>
            <Button
              size="lg"
              className="bg-gradient-fire text-primary-foreground font-display font-semibold text-lg px-8 py-6 shadow-glow hover:opacity-90 transition-opacity"
              onClick={() => navigate("/onboarding")}
            >
              Start Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
