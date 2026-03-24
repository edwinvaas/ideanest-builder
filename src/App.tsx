import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AthleteProvider } from "@/contexts/AthleteContext";
import Index from "./pages/Index.tsx";
import AthleteDashboard from "./pages/AthleteDashboard.tsx";
import AthleteOnboarding from "./pages/AthleteOnboarding.tsx";
import CoachDashboard from "./pages/CoachDashboard.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AthleteProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<AthleteOnboarding />} />
            <Route path="/athlete" element={<AthleteDashboard />} />
            <Route path="/coach" element={<CoachDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AthleteProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
