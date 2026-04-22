import { Zap } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Coach Dashboard", path: "/coach" },
  { label: "Coach Buddy", path: "/buddy/coach" },
  { label: "Athlete Dashboard", path: "/athlete" },
  { label: "Athlete Buddy", path: "/buddy/athlete" },
  { label: "Strategy", path: "/strategy" },
];

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-fire flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-lg">BoxBrain</span>
            <span className="text-[10px] text-muted-foreground hidden md:block italic">
              The intelligence behind better performance
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-2.5 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors whitespace-nowrap",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
