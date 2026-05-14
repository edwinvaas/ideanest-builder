import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AthleteProvider } from "@/contexts/AthleteContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import AthleteDashboard from "./pages/AthleteDashboard.tsx";
import AthleteOnboarding from "./pages/AthleteOnboarding.tsx";
import CoachDashboard from "./pages/CoachDashboard.tsx";
import AthleteBuddy from "./pages/AthleteBuddy.tsx";
import CoachBuddy from "./pages/CoachBuddy.tsx";
import WorkoutStrategy from "./pages/WorkoutStrategy.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AthleteProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<ProtectedRoute><AthleteOnboarding /></ProtectedRoute>} />
              <Route path="/athlete" element={<ProtectedRoute><AthleteDashboard /></ProtectedRoute>} />
              <Route path="/coach" element={<ProtectedRoute><CoachDashboard /></ProtectedRoute>} />
              <Route path="/buddy/athlete" element={<ProtectedRoute><AthleteBuddy /></ProtectedRoute>} />
              <Route path="/buddy/coach" element={<ProtectedRoute><CoachBuddy /></ProtectedRoute>} />
              <Route path="/chat" element={<Navigate to="/buddy/athlete" replace />} />
              <Route path="/strategy" element={<ProtectedRoute><WorkoutStrategy /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AthleteProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
