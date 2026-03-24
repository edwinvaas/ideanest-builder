import Navbar from "@/components/Navbar";
import PerformanceRadar from "@/components/athlete/PerformanceRadar";
import LimiterCard from "@/components/athlete/LimiterCard";
import MetricCards from "@/components/athlete/MetricCards";
import AdviceSection from "@/components/athlete/AdviceSection";
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Welkom, <span className="text-gradient-fire">{profile.name || "Atleet"}</span>
            </h1>
            <p className="text-muted-foreground">Je persoonlijke performance overzicht</p>
          </div>

          {/* Metrics */}
          <MetricCards />

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <PerformanceRadar />
            <LimiterCard />
          </div>

          {/* Advice */}
          <AdviceSection />
        </div>
      </div>
    </div>
  );
};

export default AthleteDashboard;
