import { Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { setDemoMode } from "@/lib/demoMode";

export const DemoBanner = ({ reason }: { reason?: string }) => {
  const navigate = useNavigate();
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm">
      <div className="flex items-center gap-2 text-primary">
        <Eye className="w-4 h-4" />
        <span className="font-semibold">Demo mode</span>
        <span className="text-muted-foreground hidden md:inline">
          — {reason ?? "showing sample data so you can preview the engine."}
        </span>
      </div>
      <button
        onClick={() => {
          setDemoMode(false);
          navigate("/auth", { replace: true });
        }}
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        Exit <X className="w-3 h-3" />
      </button>
    </div>
  );
};
