import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import PerformanceRadar from "@/components/athlete/PerformanceRadar";
import MetricCards from "@/components/athlete/MetricCards";
import RecoveryWidget from "@/components/athlete/RecoveryWidget";
import RoleBadge from "@/components/RoleBadge";
import { DemoBanner } from "@/components/DemoBanner";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useAthleteSnapshot } from "@/hooks/useAthleteSnapshot";
import { useTodaySession } from "@/hooks/useTodaySession";
import { isDemoMode } from "@/lib/demoMode";

const AthleteDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useCurrentProfile();
  const { snapshot, benchmarkTimes, displayName, isMock } = useAthleteSnapshot(user?.id ?? null);
  const { session } = useTodaySession();
  const demo = isDemoMode();

  useEffect(() => {
    if (demo) return;
    if (!profileLoading && profile && !profile.onboarded) navigate("/onboarding");
  }, [profile, profileLoading, navigate, demo]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed top-16 left-0 right-0 h-0.5 bg-gradient-fire z-40 opacity-70" />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {(demo || isMock) && (
            <DemoBanner
              reason={
                demo
                  ? "you're previewing without an account."
                  : "no benchmarks logged yet — sample athlete loaded."
              }
            />
          )}
          <RoleBadge
            role="athlete"
            hint="Your personal view — what to focus on today and how to approach it."
          />
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                Welcome,{" "}
                <span className="text-gradient-fire">
                  {profile?.display_name || displayName}
                </span>
              </h1>
              <p className="text-muted-foreground">Your personal performance overview</p>
            </div>
            <div className="flex gap-2">
              {session && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/strategy")}
                  className="self-start md:self-auto"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Vandaag's strategie
                </Button>
              )}
              <Button
                onClick={() => navigate("/buddy/athlete")}
                className="bg-gradient-fire hover:opacity-90 self-start md:self-auto"
              >
                <Target className="w-4 h-4 mr-2" />
                Ask Focus
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <MetricCards snapshot={snapshot} fran={benchmarkTimes["fran"]} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <PerformanceRadar snapshot={snapshot} />
            <RecoveryWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteDashboard;
