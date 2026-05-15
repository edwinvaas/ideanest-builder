import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Radio } from "lucide-react";
import {
  PROGRAMMING_SOURCES,
  type ProgrammingSourceId,
} from "@/lib/programmingSources";
import { formatSeconds } from "@/lib/onboardingSync";

interface Props {
  source: ProgrammingSourceId;
  onSourceChange: (id: ProgrammingSourceId) => void;
  benchmarkSlug?: string;
  benchmarkLabel?: string;
  /** Personal best in seconds (from DB / onboarding) */
  prSeconds: number | null;
  /** Athlete's most recent or override "current" attempt (mm:ss) */
  currentInput: string;
  onCurrentInputChange: (v: string) => void;
}

export default function ProgrammingSourceSelector({
  source,
  onSourceChange,
  benchmarkSlug,
  benchmarkLabel,
  prSeconds,
  currentInput,
  onCurrentInputChange,
}: Props) {
  return (
    <div className="rounded-xl bg-gradient-card border border-border p-5 shadow-card space-y-4">
      <div className="flex items-center gap-2">
        <Radio className="w-4 h-4 text-primary" />
        <p className="font-display font-semibold">Kies je programmering</p>
      </div>

      <Select value={source} onValueChange={(v) => onSourceChange(v as ProgrammingSourceId)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Bron selecteren" />
        </SelectTrigger>
        <SelectContent>
          {PROGRAMMING_SOURCES.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-xs text-muted-foreground">
        {PROGRAMMING_SOURCES.find((s) => s.id === source)?.blurb}
      </p>

      {benchmarkSlug && (
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">
              {benchmarkLabel ?? benchmarkSlug} —{" "}
              <span className="text-muted-foreground font-normal">
                jouw historie
              </span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Jouw PR
              </label>
              <Badge variant="outline" className="font-mono text-base px-3 py-1.5">
                {prSeconds ? formatSeconds(prSeconds) : "—"}
              </Badge>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Jouw laatste tijd (mm:ss)
              </label>
              <Input
                value={currentInput}
                onChange={(e) => onCurrentInputChange(e.target.value)}
                placeholder={prSeconds ? formatSeconds(prSeconds) : "mm:ss"}
                className="font-mono"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            De StrategyEngine gebruikt jouw werkelijke tijd als hoogste prioriteit
            voor finishvoorspelling en goal-alignment.
          </p>
        </div>
      )}
    </div>
  );
}
