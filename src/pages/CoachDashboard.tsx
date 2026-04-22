import Navbar from "@/components/Navbar";
import AthleteTable from "@/components/coach/AthleteTable";
import CoachStats from "@/components/coach/CoachStats";
import { Button } from "@/components/ui/button";
import { ClipboardList, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CoachDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                Coach <span className="text-gradient-fire">Dashboard</span>
              </h1>
              <p className="text-muted-foreground">Overview of all your athletes</p>
            </div>
            <Button
              onClick={() => navigate("/buddy/coach")}
              className="bg-gradient-fire hover:opacity-90 self-start md:self-auto"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Ask Command
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <CoachStats />
          <AthleteTable />
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
