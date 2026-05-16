// Age-Peer Status — bepaalt de divisie (leeftijdscategorie) en het niveau
// op basis van leeftijd en de huidige snapshot-scores. Pure helper, geen UI.

import type { AthleteSnapshot } from "./fatigueEngine";

export type DivisionId =
  | "14-15"
  | "16-17"
  | "18-34"
  | "35-39"
  | "40-44"
  | "45-49"
  | "50-54"
  | "55-59"
  | "60-64"
  | "65-69"
  | "70+";

export type LevelId = "Beginner" | "Intermediate" | "Advanced-RX";

export interface AgePeerStatus {
  division: DivisionId;
  divisionLabel: string;
  level: LevelId;
  overallScore: number; // 0-100
}

export function divisionForAge(age: number): DivisionId {
  if (age <= 15) return "14-15";
  if (age <= 17) return "16-17";
  if (age <= 34) return "18-34";
  if (age <= 39) return "35-39";
  if (age <= 44) return "40-44";
  if (age <= 49) return "45-49";
  if (age <= 54) return "50-54";
  if (age <= 59) return "55-59";
  if (age <= 64) return "60-64";
  if (age <= 69) return "65-69";
  return "70+";
}

export function divisionLabel(d: DivisionId): string {
  if (d === "14-15" || d === "16-17") return `Teens ${d}`;
  if (d === "18-34") return `Open ${d}`;
  return `Masters ${d}`;
}

export function levelFromSnapshot(s: AthleteSnapshot | null): LevelId {
  if (!s) return "Beginner";
  const overall = (s.engineScore + s.strengthScore + s.gymnasticsScore) / 3;
  if (overall >= 0.7) return "Advanced-RX";
  if (overall >= 0.4) return "Intermediate";
  return "Beginner";
}

export function buildAgePeerStatus(
  snapshot: AthleteSnapshot | null,
  ageFallback?: number,
): AgePeerStatus {
  const age = snapshot?.age ?? ageFallback ?? 30;
  const division = divisionForAge(age);
  const level = levelFromSnapshot(snapshot);
  const overallScore = snapshot
    ? Math.round(
        ((snapshot.engineScore + snapshot.strengthScore + snapshot.gymnasticsScore) / 3) * 100,
      )
    : 0;
  return {
    division,
    divisionLabel: divisionLabel(division),
    level,
    overallScore,
  };
}
