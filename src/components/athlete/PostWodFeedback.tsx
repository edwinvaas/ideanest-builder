import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, MessageCircle, Zap } from "lucide-react";
import { parseTimeToSeconds } from "@/lib/onboardingSync";

interface Props {
  sessionId: string;
  athleteId: string;
  onSubmitted?: () => void;
}

const LIMITERS = [
  { value: "engine", label: "Engine" },
  { value: "strength", label: "Kracht" },
  { value: "gymnastics", label: "Gymnastiek" },
  { value: "mobility", label: "Mobiliteit" },
  { value: "pacing", label: "Pacing" },
];

const PostWodFeedback = ({ sessionId, athleteId, onSubmitted }: Props) => {
  const { toast } = useToast();
  const [rpe, setRpe] = useState(7);
  const [time, setTime] = useState("");
  const [scaling, setScaling] = useState<"rx" | "scaled" | "foundations">("rx");
  const [perceived, setPerceived] = useState<string>("engine");
  const [fatiguePoint, setFatiguePoint] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const { error } = await (supabase as any)
      .from("athlete_session_results")
      .insert({
        session_id: sessionId,
        athlete_id: athleteId,
        rpe,
        scaling,
        perceived_limiter: perceived,
        time_seconds: parseTimeToSeconds(time),
        fatigue_point_seconds: parseTimeToSeconds(fatiguePoint),
        notes: notes || null,
      });
    setSubmitting(false);
    if (error) {
      toast({
        title: "Kon feedback niet opslaan",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setDone(true);
    toast({
      title: "Feedback geregistreerd",
      description: "Je drempelwaarden zijn aangepast voor de volgende WOD.",
    });
    onSubmitted?.();
  };

  if (done) {
    return (
      <div className="rounded-xl bg-gradient-card border border-success/40 p-6 shadow-card flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-success" />
        <div>
          <p className="font-semibold">Feedback verwerkt</p>
          <p className="text-xs text-muted-foreground">
            Het systeem heeft je redline en herstelfactor bijgewerkt op basis van RPE {rpe}/10.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-card border border-border p-6 shadow-card space-y-5">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">Post-WOD feedback</h3>
        <span className="text-xs text-muted-foreground ml-auto">Verplicht — voedt het systeem</span>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 flex items-center justify-between">
          <span>RPE — hoe zwaar voelde het?</span>
          <span className="font-mono text-primary">{rpe}/10</span>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={rpe}
          onChange={(e) => setRpe(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Easy</span>
          <span>Hard</span>
          <span>Max</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-2 block">Tijd (mm:ss)</label>
          <Input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="bv. 8:42"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Fatigue point</label>
          <Input
            value={fatiguePoint}
            onChange={(e) => setFatiguePoint(e.target.value)}
            placeholder="mm:ss (optioneel)"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Scaling</label>
        <div className="flex gap-2">
          {(["rx", "scaled", "foundations"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScaling(s)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium uppercase transition-colors ${
                scaling === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Wat hield je vandaag tegen?</label>
        <div className="flex flex-wrap gap-2">
          {LIMITERS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setPerceived(l.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                perceived === l.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Notities (optioneel)</label>
        <Textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Coach cue, technische opmerking, blessure…"
        />
      </div>

      <Button
        onClick={submit}
        disabled={submitting}
        className="w-full bg-gradient-fire hover:opacity-90 gap-2"
      >
        <Zap className="w-4 h-4" />
        {submitting ? "Opslaan…" : "Stuur feedback & kalibreer"}
      </Button>
    </div>
  );
};

export default PostWodFeedback;
