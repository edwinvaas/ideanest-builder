import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAthlete, AthleteProfile } from "@/contexts/AthleteContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, User, Trophy, Dumbbell, Activity } from "lucide-react";

const steps = [
  { title: "Personal Info", icon: User },
  { title: "Benchmark WODs", icon: Trophy },
  { title: "Max Lifts", icon: Dumbbell },
  { title: "Gymnastics", icon: Activity },
];

const experienceLevels = [
  { value: "beginner", label: "Beginner", desc: "< 1 year CrossFit" },
  { value: "intermediate", label: "Intermediate", desc: "1-3 years CrossFit" },
  { value: "advanced", label: "Advanced", desc: "3-5 years CrossFit" },
  { value: "elite", label: "Elite", desc: "5+ years / competition" },
];

const goalOptions = ["Competition", "Strength", "Weight Loss", "Conditioning", "Skill Development", "Health"];

const AthleteOnboarding = () => {
  const navigate = useNavigate();
  const { setProfile, setIsOnboarded } = useAthlete();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AthleteProfile>({
    name: "",
    age: 25,
    gender: "Male",
    experience: "",
    box: "",
    goals: [],
    benchmarks: { fran: "", grace: "", murph: "", helen: "", diane: "" },
    maxLifts: { backSquat: 0, deadlift: 0, cleanAndJerk: 0, snatch: 0, strictPress: 0 },
    gymnastics: { maxPullups: 0, maxHSPU: 0, maxMuscleUps: 0, maxDoubleUnders: 0 },
  });

  const progress = ((step + 1) / steps.length) * 100;

  const toggleGoal = (goal: string) => {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(goal) ? f.goals.filter((g) => g !== goal) : [...f.goals, goal],
    }));
  };

  const handleFinish = () => {
    setProfile(form);
    setIsOnboarded(true);
    navigate("/athlete");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((s, i) => (
                <div key={s.title} className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      i <= step ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-sm font-medium hidden md:block ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="rounded-xl bg-gradient-card border border-border p-8 shadow-card animate-fade-in">
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-2xl mb-1">Welcome to CrossFit AI</h2>
                  <p className="text-muted-foreground">Tell us about yourself so we can personalize your training.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Age</label>
                    <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Gender</label>
                    <div className="flex gap-2">
                      {["Male", "Female", "Other"].map((g) => (
                        <button
                          key={g}
                          onClick={() => setForm({ ...form, gender: g })}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                            form.gender === g ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Box / Gym</label>
                    <Input value={form.box} onChange={(e) => setForm({ ...form, box: e.target.value })} placeholder="CrossFit Amsterdam" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Experience</label>
                  <div className="grid grid-cols-2 gap-3">
                    {experienceLevels.map((lvl) => (
                      <button
                        key={lvl.value}
                        onClick={() => setForm({ ...form, experience: lvl.value })}
                        className={`p-3 rounded-lg text-left transition-colors border ${
                          form.experience === lvl.value
                            ? "border-primary bg-primary/10"
                            : "border-border bg-secondary/50 hover:bg-secondary"
                        }`}
                      >
                        <p className="font-medium text-sm">{lvl.label}</p>
                        <p className="text-xs text-muted-foreground">{lvl.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Goals (select multiple)</label>
                  <div className="flex flex-wrap gap-2">
                    {goalOptions.map((goal) => (
                      <button
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          form.goals.includes(goal)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-2xl mb-1">Benchmark WODs</h2>
                  <p className="text-muted-foreground">Enter your best times (mm:ss). Leave blank if you haven't done one yet.</p>
                </div>
                <div className="space-y-4">
                  {[
                    { key: "fran" as const, label: "Fran", desc: "21-15-9 Thrusters (43/30kg) & Pull-ups" },
                    { key: "grace" as const, label: "Grace", desc: "30 Clean & Jerks (61/43kg)" },
                    { key: "murph" as const, label: "Murph", desc: "1 mile run, 100 pull-ups, 200 push-ups, 300 squats, 1 mile run" },
                    { key: "helen" as const, label: "Helen", desc: "3 rounds: 400m run, 21 KB swings, 12 pull-ups" },
                    { key: "diane" as const, label: "Diane", desc: "21-15-9 Deadlifts (102/70kg) & HSPU" },
                  ].map((wod) => (
                    <div key={wod.key} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
                      <div className="flex-1">
                        <p className="font-medium">{wod.label}</p>
                        <p className="text-xs text-muted-foreground">{wod.desc}</p>
                      </div>
                      <Input
                        className="w-24 text-center"
                        placeholder="mm:ss"
                        value={form.benchmarks[wod.key]}
                        onChange={(e) =>
                          setForm({ ...form, benchmarks: { ...form.benchmarks, [wod.key]: e.target.value } })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-2xl mb-1">Max Lifts</h2>
                  <p className="text-muted-foreground">Enter your 1RM in kilograms. Use 0 if unknown.</p>
                </div>
                <div className="space-y-4">
                  {[
                    { key: "backSquat" as const, label: "Back Squat" },
                    { key: "deadlift" as const, label: "Deadlift" },
                    { key: "cleanAndJerk" as const, label: "Clean & Jerk" },
                    { key: "snatch" as const, label: "Snatch" },
                    { key: "strictPress" as const, label: "Strict Press" },
                  ].map((lift) => (
                    <div key={lift.key} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                      <p className="font-medium">{lift.label}</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-24 text-center"
                          placeholder="0"
                          value={form.maxLifts[lift.key] || ""}
                          onChange={(e) =>
                            setForm({ ...form, maxLifts: { ...form.maxLifts, [lift.key]: Number(e.target.value) } })
                          }
                        />
                        <span className="text-sm text-muted-foreground">kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-2xl mb-1">Gymnastics</h2>
                  <p className="text-muted-foreground">Enter your max unbroken reps.</p>
                </div>
                <div className="space-y-4">
                  {[
                    { key: "maxPullups" as const, label: "Pull-ups (unbroken)" },
                    { key: "maxHSPU" as const, label: "Handstand Push-ups (unbroken)" },
                    { key: "maxMuscleUps" as const, label: "Muscle-ups (unbroken)" },
                    { key: "maxDoubleUnders" as const, label: "Double Unders (unbroken)" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                      <p className="font-medium">{item.label}</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-24 text-center"
                          placeholder="0"
                          value={form.gymnastics[item.key] || ""}
                          onChange={(e) =>
                            setForm({ ...form, gymnastics: { ...form.gymnastics, [item.key]: Number(e.target.value) } })
                          }
                        />
                        <span className="text-sm text-muted-foreground">reps</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {step < steps.length - 1 ? (
                <Button onClick={() => setStep((s) => s + 1)} className="gap-2 bg-gradient-fire hover:opacity-90">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleFinish} className="gap-2 bg-gradient-fire hover:opacity-90">
                  Start my journey 🚀
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteOnboarding;
