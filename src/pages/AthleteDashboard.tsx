import Navbar from "@/components/Navbar";
import PerformanceRadar from "@/components/athlete/PerformanceRadar";
import LimiterCard from "@/components/athlete/LimiterCard";
import MetricCards from "@/components/athlete/MetricCards";
import AdviceSection from "@/components/athlete/AdviceSection";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight } from "lucide-react";
import { useAthlete } from "@/contexts/AthleteContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const AthleteDashboard = () => {
  const { profile, isOnboarded } = useAthlete();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOnboarded) navigate("/onboarding");
  }, [isOnboarded, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                Welcome, <span className="text-gradient-fire">{profile.name || "Athlete"}</span>
              </h1>
              <p className="text-muted-foreground">Your personal performance overview</p>
            </div>
            <Button
              onClick={() => navigate("/buddy/athlete")}
              className="bg-gradient-fire hover:opacity-90 self-start md:self-auto"
            >
              <Target className="w-4 h-4 mr-2" />
              Ask Focus
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <MetricCards />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <PerformanceRadar />
            <LimiterCard />
          </div>

          <AdviceSection />
        </div>
      </div>
    </div>
  );
};

export default AthleteDashboard;
