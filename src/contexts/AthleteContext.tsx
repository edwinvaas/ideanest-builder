import { createContext, useContext, useState, ReactNode } from "react";

export interface AthleteProfile {
  name: string;
  age: number;
  gender: string;
  experience: string;
  box: string;
  goals: string[];
  benchmarks: {
    fran: string;
    grace: string;
    murph: string;
    helen: string;
    diane: string;
  };
  maxLifts: {
    backSquat: number;
    deadlift: number;
    cleanAndJerk: number;
    snatch: number;
    strictPress: number;
  };
  gymnastics: {
    maxPullups: number;
    maxHSPU: number;
    maxMuscleUps: number;
    maxDoubleUnders: number;
  };
}

const defaultProfile: AthleteProfile = {
  name: "Sarah",
  age: 28,
  gender: "Female",
  experience: "intermediate",
  box: "CrossFit Amsterdam",
  goals: ["Competition", "Strength"],
  benchmarks: {
    fran: "4:32",
    grace: "3:15",
    murph: "42:30",
    helen: "9:45",
    diane: "6:20",
  },
  maxLifts: {
    backSquat: 95,
    deadlift: 120,
    cleanAndJerk: 70,
    snatch: 55,
    strictPress: 45,
  },
  gymnastics: {
    maxPullups: 12,
    maxHSPU: 5,
    maxMuscleUps: 0,
    maxDoubleUnders: 50,
  },
};

interface AthleteContextType {
  profile: AthleteProfile;
  setProfile: (profile: AthleteProfile) => void;
  isOnboarded: boolean;
  setIsOnboarded: (v: boolean) => void;
}

const AthleteContext = createContext<AthleteContextType | undefined>(undefined);

export const AthleteProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<AthleteProfile>(defaultProfile);
  const [isOnboarded, setIsOnboarded] = useState(false);

  return (
    <AthleteContext.Provider value={{ profile, setProfile, isOnboarded, setIsOnboarded }}>
      {children}
    </AthleteContext.Provider>
  );
};

export const useAthlete = () => {
  const ctx = useContext(AthleteContext);
  if (!ctx) throw new Error("useAthlete must be used within AthleteProvider");
  return ctx;
};
