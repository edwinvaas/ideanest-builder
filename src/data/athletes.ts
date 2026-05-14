export interface BoxAthlete {
  name: string;
  score: number;
  limiter: string;
  trend: string;
  status: "improving" | "stagnating";
}

export const boxAthletes: BoxAthlete[] = [
  { name: "Sarah van Dijk", score: 72, limiter: "Gymnastics", trend: "+3", status: "improving" },
  { name: "Mark Jansen", score: 81, limiter: "Endurance", trend: "+1", status: "improving" },
  { name: "Lisa de Vries", score: 65, limiter: "Strength", trend: "-2", status: "stagnating" },
  { name: "Tom Bakker", score: 88, limiter: "Mobility", trend: "+5", status: "improving" },
  { name: "Eva Smit", score: 54, limiter: "Engine", trend: "0", status: "stagnating" },
  { name: "Rick van den Berg", score: 76, limiter: "Olympic Lifting", trend: "+2", status: "improving" },
  { name: "Nina Visser", score: 69, limiter: "Gymnastics", trend: "-1", status: "stagnating" },
  { name: "Daan Mulder", score: 83, limiter: "Endurance", trend: "+4", status: "improving" },
];
