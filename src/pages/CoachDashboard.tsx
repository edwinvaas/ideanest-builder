import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import RoleBadge from "@/components/RoleBadge";
import CoachStats from "@/components/coach/CoachStats";
import CoachQuickCues from "@/components/coach/CoachQuickCues";
import CoachDeepDive from "@/components/coach/CoachDeepDive";
import CoachIntelligenceBar from "@/components/coach/CoachIntelligenceBar";
import { Button } from "@/components/ui/button";
import { ClipboardList, ArrowRight, Zap, Microscope, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCoachRoster } from "@/hooks/useCoachRoster";
import { useTodaySession } from "@/hooks/useTodaySession";

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { rows, loading, anomalies, openComparison } = useCoachRoster();
  const { session } = useTodaySession();
  // Class size: prefer session.class_size (coach-specified), else roster size
  const classSize = session?.class_size ?? rows.length;
  const autoMode: "quick" | "deep" = classSize > 6 ? "quick" : "deep";
  const [mode, setMode] = useState<"quick" | "deep" | null>(null);
  const activeMode = mode ?? autoMode;

  const modeReason = useMemo(
    () =>
      activeMode === "quick"
        ? `Class size ${classSize} — Quick-Cues actief (Group / Safety view).`
        : `Class size ${classSize} — Deep-Dive actief (Tactical analytics).`,
    [activeMode, classSize],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <RoleBadge
            role="coach"
            hint="Decisions view — group readiness, dominant limiters and pacing cues for your class."
          />
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                Coach <span className="text-gradient-fire">Dashboard</span>
              </h1>
              <p className="text-muted-foreground">{modeReason}</p>
            </div>
            <div className="flex gap-2">
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setMode("quick")}
                  className={`px-3 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeMode === "quick"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> Quick
                </button>
                <button
                  onClick={() => setMode("deep")}
                  className={`px-3 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeMode === "deep"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Microscope className="w-3.5 h-3.5" /> Deep
                </button>
              </div>
              <Button
                onClick={() => navigate("/buddy/coach")}
                className="bg-gradient-fire hover:opacity-90"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Ask Command
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <CoachStats rows={rows} />
              <CoachIntelligenceBar
                anomalies={anomalies}
                openComparison={openComparison}
              />
              {activeMode === "quick" ? (
                <CoachQuickCues rows={rows} />
              ) : (
                <CoachDeepDive rows={rows} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
