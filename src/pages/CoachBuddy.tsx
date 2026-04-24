import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import RoleBadge from "@/components/RoleBadge";
import { Input } from "@/components/ui/input";
import { BuddyChat } from "@/components/buddy/BuddyChat";
import { COACH_BUDDY } from "@/lib/buddyConfig";
import { boxAthletes } from "@/data/athletes";
import { cn } from "@/lib/utils";

const CoachBuddy = () => {
  const [classType, setClassType] = useState("Conditioning + Strength");
  const [classDuration, setClassDuration] = useState("60 min");
  const [classNotes, setClassNotes] = useState("");
  const [attendees, setAttendees] = useState<string[]>(boxAthletes.map((a) => a.name));

  const stagnating = boxAthletes.filter((a) => a.status === "stagnating").length;

  const welcome = useMemo(
    () =>
      `Hey Coach 👋 — I'm **Command**, your AI assistant coach.

I've loaded your full roster (**${boxAthletes.length} athletes**, ${stagnating} currently stagnating). My job is to save you analysis time and tell you **who to watch and where to focus** before every class.

Set today's class context above, then ask me anything.`,
    [stagnating],
  );

  const toggleAttendee = (name: string) => {
    setAttendees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const contextSlot = (
    <div className="border-t border-border bg-background/40">
      <div className="container mx-auto px-6 py-3 space-y-3">
        <RoleBadge
          role="coach"
          hint="Use this to set pacing cues, scaling tiers and watch-list for the class below."
          className="mb-1"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Class type
            </label>
            <Input
              value={classType}
              onChange={(e) => setClassType(e.target.value)}
              placeholder="e.g. Strength + Metcon"
              className="h-8 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Duration
            </label>
            <Input
              value={classDuration}
              onChange={(e) => setClassDuration(e.target.value)}
              placeholder="60 min"
              className="h-8 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Notes
            </label>
            <Input
              value={classNotes}
              onChange={(e) => setClassNotes(e.target.value)}
              placeholder="e.g. comp prep, beginners present"
              className="h-8 text-sm mt-1"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Attending today ({attendees.length}/{boxAthletes.length})
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAttendees(boxAthletes.map((a) => a.name))}
                className="text-[10px] uppercase tracking-wider text-primary hover:underline font-semibold"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setAttendees([])}
                className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:underline font-semibold"
              >
                None
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {boxAthletes.map((a) => {
              const on = attendees.includes(a.name);
              return (
                <button
                  key={a.name}
                  type="button"
                  onClick={() => toggleAttendee(a.name)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                    on
                      ? "bg-primary/15 text-primary border-primary/40"
                      : "bg-secondary text-muted-foreground border-border hover:text-foreground",
                  )}
                >
                  {a.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 flex flex-col">
        <BuddyChat
          config={COACH_BUDDY}
          welcome={welcome}
          contextSlot={contextSlot}
          buildRequestBody={(messages) => ({
            messages,
            mode: "coach",
            roster: boxAthletes,
            classContext: {
              type: classType,
              duration: classDuration,
              notes: classNotes,
              attendees,
            },
          })}
        />
      </div>
    </div>
  );
};

export default CoachBuddy;
