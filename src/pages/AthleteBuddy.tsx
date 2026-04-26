import Navbar from "@/components/Navbar";
import RoleBadge from "@/components/RoleBadge";
import { BuddyChat } from "@/components/buddy/BuddyChat";
import { ATHLETE_BUDDY } from "@/lib/buddyConfig";
import { useAthlete } from "@/contexts/AthleteContext";

const AthleteBuddy = () => {
  const { profile } = useAthlete();

  const welcome = `Hey ${profile.name || "Athlete"} 👋 — I'm **Focus**, your personal AI performance assistant.

I've already studied your profile, benchmarks, lifts and gymnastics. My job is simple: tell you **exactly where to focus** so you improve faster.

Ask me anything — or pick a starting point below.`;

  const contextSlot = (
    <div className="border-t border-border bg-background/40">
      <div className="container mx-auto px-6 py-3">
        <RoleBadge
          role="athlete"
          hint="This is how to approach today's training. After your workout, tell Focus how the strategy felt so your next advice gets sharper."
          className="mb-0"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      {/* Subtle warm accent strip — Athlete zone */}
      <div className="fixed top-16 left-0 right-0 h-0.5 bg-gradient-fire z-40 opacity-70" />
      <div className="flex-1 pt-16 flex flex-col">
        <BuddyChat
          config={ATHLETE_BUDDY}
          welcome={welcome}
          contextSlot={contextSlot}
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
