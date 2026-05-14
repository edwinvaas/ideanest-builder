import { supabase } from "@/integrations/supabase/client";

export interface OnboardingPayload {
  userId: string;
  displayName: string;
  age: number;
  gender: "male" | "female" | "other";
  experience: "beginner" | "intermediate" | "advanced" | "elite";
  boxName: string;
  goals: string[];
  /** keys are benchmark slugs (fran, grace, …); values are mm:ss strings */
  benchmarks: Record<string, string>;
  /** keys are movement slugs (back-squat, …); values are kg */
  maxLifts: Record<string, number>;
  /** keys are movement slugs (pull-up, …); values are unbroken reps */
  gymnastics: Record<string, number>;
}

export function parseTimeToSeconds(s: string): number | null {
  if (!s) return null;
  const trimmed = s.trim();
  const m = trimmed.match(/^(\d+):([0-5]?\d)$/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  return null;
}

export function formatSeconds(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function persistOnboarding(p: OnboardingPayload): Promise<void> {
  const sb = supabase as any;

  // Derive a date_of_birth from age (mid-year so age math stays correct)
  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - p.age);
  dob.setMonth(5, 15);
  const dobStr = dob.toISOString().slice(0, 10);

  // 1. Resolve or create the box
  let boxId: string | null = null;
  if (p.boxName.trim()) {
    const { data: existing } = await sb
      .from("boxes")
      .select("id")
      .ilike("name", p.boxName.trim())
      .maybeSingle();
    if (existing) {
      boxId = existing.id;
    } else {
      const { data: created } = await sb
        .from("boxes")
        .insert({ name: p.boxName.trim() })
        .select("id")
        .maybeSingle();
      boxId = created?.id ?? null;
    }
  }

  // 2. Update profile
  await sb
    .from("profiles")
    .update({
      display_name: p.displayName,
      gender: p.gender,
      date_of_birth: dobStr,
      experience: p.experience,
      goals: p.goals,
      box_id: boxId,
      onboarded: true,
    })
    .eq("id", p.userId);

  // 3. Resolve dictionaries
  const [{ data: movements }, { data: benchmarks }] = await Promise.all([
    sb.from("movements").select("id, slug"),
    sb.from("benchmark_workouts").select("id, slug"),
  ]);
  const movMap = new Map<string, string>(
    ((movements ?? []) as any[]).map((m) => [m.slug, m.id]),
  );
  const bmMap = new Map<string, string>(
    ((benchmarks ?? []) as any[]).map((b) => [b.slug, b.id]),
  );

  // 4. Lifts
  const liftRows = Object.entries(p.maxLifts)
    .filter(([, kg]) => Number(kg) > 0)
    .map(([slug, kg]) => ({
      athlete_id: p.userId,
      movement_id: movMap.get(slug),
      load_kg: kg,
      rep_count: 1,
    }))
    .filter((r) => r.movement_id);
  if (liftRows.length) await sb.from("athlete_lift_records").insert(liftRows);

  // 5. Gymnastics
  const gymRows = Object.entries(p.gymnastics)
    .filter(([, reps]) => Number(reps) > 0)
    .map(([slug, reps]) => ({
      athlete_id: p.userId,
      movement_id: movMap.get(slug),
      max_unbroken_reps: reps,
    }))
    .filter((r) => r.movement_id);
  if (gymRows.length) await sb.from("athlete_gymnastics_records").insert(gymRows);

  // 6. Benchmarks
  const bmRows = Object.entries(p.benchmarks)
    .map(([slug, value]) => ({
      slug,
      seconds: parseTimeToSeconds(value),
    }))
    .filter((r) => r.seconds !== null && bmMap.has(r.slug))
    .map((r) => ({
      athlete_id: p.userId,
      benchmark_id: bmMap.get(r.slug)!,
      time_seconds: r.seconds!,
      scaling: "rx" as const,
    }));
  if (bmRows.length) await sb.from("athlete_benchmark_results").insert(bmRows);
}
