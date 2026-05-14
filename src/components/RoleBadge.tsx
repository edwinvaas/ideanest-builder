import { Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: "coach" | "athlete";
  /** Optional one-line microcopy that explains intent of the screen */
  hint?: string;
  /** Alias for `hint` — kept for backwards-compat with older call sites */
  description?: string;
  className?: string;
}

/**
 * Persistent role indicator placed at the top of every role-specific screen.
 * - Coach → cool primary (navy/graphite)
 * - Athlete → warm accent (amber/orange)
 *
 * The colour shift is intentionally subtle: same layout, different signal.
 */
const RoleBadge = ({ role, hint, description, className }: RoleBadgeProps) => {
  const isCoach = role === "coach";
  const Icon = isCoach ? Users : User;
  const label = isCoach ? "Coach View" : "Athlete View";
  const microcopy = hint ?? description;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-6 px-3 py-2 rounded-lg border",
        isCoach
          ? "bg-primary/5 border-primary/20"
          : "bg-accent/10 border-accent/30",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full self-start",
          isCoach
            ? "bg-primary/15 text-primary"
            : "bg-accent/20 text-accent",
        )}
      >
        <Icon className="w-3 h-3" />
        {label}
      </span>
      {hint && (
        <p className="text-xs text-muted-foreground leading-snug">{hint}</p>
      )}
    </div>
  );
};

export default RoleBadge;
