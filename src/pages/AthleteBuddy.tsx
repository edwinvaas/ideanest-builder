import Navbar from "@/components/Navbar";
import { BuddyChat } from "@/components/buddy/BuddyChat";
import { ATHLETE_BUDDY } from "@/lib/buddyConfig";
import { useAthlete } from "@/contexts/AthleteContext";

const AthleteBuddy = () => {
  const { profile } = useAthlete();

  const welcome = `Hey ${profile.name || "Athlete"} 👋 — I'm **Focus**, your personal AI performance assistant.

I've already studied your profile, benchmarks, lifts and gymnastics. My job is simple: tell you **exactly where to focus** so you improve faster.

Ask me anything — or pick a starting point below.`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 flex flex-col">
        <BuddyChat
          config={ATHLETE_BUDDY}
          welcome={welcome}
          buildRequestBody={(messages) => ({
            messages,
            mode: "athlete",
            profile,
          })}
        />
      </div>
    </div>
  );
};

export default AthleteBuddy;
