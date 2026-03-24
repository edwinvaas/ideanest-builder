import Navbar from "@/components/Navbar";
import AthleteTable from "@/components/coach/AthleteTable";
import CoachStats from "@/components/coach/CoachStats";

const CoachDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Coach <span className="text-gradient-fire">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">Overzicht van al je atleten</p>
          </div>

          <CoachStats />
          <AthleteTable />
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
