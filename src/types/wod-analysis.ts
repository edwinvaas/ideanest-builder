// ─── Enums ────────────────────────────────────────────────────────────────────
// Mirror the PostgreSQL ENUM types in 001_initial_schema.sql.
// Use these as discriminant values in switch/case and conditional rendering.

export type DominantStimulus =
  | "aerobic_capacity"
  | "lactic_threshold"
  | "alactic_power"
  | "strength_endurance"
  | "pure_strength"
  | "gymnastics_skill"
  | "mixed_modal";

export type PacingStrategy =
  | "consistent"
  | "negative_split"
  | "positive_split"
  | "sprint_recover"
  | "front_loaded";

export type LimiterType =
  | "engine"
  | "strength"
  | "gymnastics"
  | "mobility"
  | "pacing"
  | "recovery";

export type ScalingLevel = "rx" | "scaled" | "foundations";

// ─── Sub-objects ──────────────────────────────────────────────────────────────

export interface EnergySystemBreakdown {
  phosphagen: number; // 0–100, % contribution
  glycolytic: number;
  oxidative: number;
}

export interface PacingRisk {
  risk: string;
  consequence: string;
  mitigation: string;
}

export interface WodMovement {
  name: string;
  rep_scheme?: string;
  load?: string;
  primary_limiter: LimiterType;
  technique_notes?: string;
}

export interface ScalingOption {
  level: ScalingLevel;
  modifications: string[];
  target_athlete_profile: string;
}

/** Demand score per limiter, 0.0–1.0. Dot-product with athlete limiter_vector = readiness score. */
export interface LimiterDemands {
  engine: number;
  strength: number;
  gymnastics: number;
  mobility: number;
  pacing: number;
  recovery: number;
}

// ─── Core analysis object ─────────────────────────────────────────────────────
// Matches both the Edge Function JSON response and the wod_analyses table row.

export interface WodAnalysis {
  // Identity — present on DB rows, absent from the raw Edge Function payload
  id?: string;
  wod_id: string;
  box_id?: string;
  analyzed_at?: string; // ISO-8601

  // Model metadata
  model_id?: string;
  model_version?: string;
  prompt_tokens?: number;
  completion_tokens?: number;

  // ── Stimulus ──────────────────────────────────────────────────────────────
  dominant_stimulus: DominantStimulus;
  stimulus_confidence: number; // 0.0–1.0
  estimated_time_domain: string; // e.g. "8–12 minutes"
  energy_system_breakdown: EnergySystemBreakdown;

  // ── Pacing ────────────────────────────────────────────────────────────────
  recommended_pacing: PacingStrategy;
  pacing_rationale: string;
  pacing_risks: PacingRisk[];

  // ── Movements ────────────────────────────────────────────────────────────
  movements: WodMovement[];
  demanding_movements: string[];

  // ── Scaling ───────────────────────────────────────────────────────────────
  scaling_options: ScalingOption[];

  // ── Limiter intelligence ──────────────────────────────────────────────────
  limiter_demands: LimiterDemands;
  high_risk_limiters: LimiterType[];

  // ── Coach brief ───────────────────────────────────────────────────────────
  coach_brief: string; // ≤500 chars, primary UI headline
}

// ─── Edge Function response ───────────────────────────────────────────────────
// Returned by POST /functions/v1/wod-interpreter

export interface WodInterpreterResponse {
  wod_id: string;
  analysis: WodAnalysis;
  meta: {
    model_id: string;
    model_version: string;
    prompt_tokens: number;
    completion_tokens: number;
  };
}

// ─── Realtime broadcast payload ───────────────────────────────────────────────
// Received on channel `wod:{wod_id}`, event `analysis_complete`.
// Lean subset of WodAnalysis — use it for the instant toast/badge update,
// then call refetchAnalysis() to load the full row from wod_analyses.

export interface WodAnalysisBroadcastPayload {
  wod_id: string;
  dominant_stimulus: DominantStimulus;
  coach_brief: string;
  high_risk_limiters: LimiterType[];
}

// ─── Supabase DB row ──────────────────────────────────────────────────────────
// Use this when reading directly from the wod_analyses table via supabase-js.
// Identical to WodAnalysis but all fields are required/nullable as they are in Postgres.

export type WodAnalysisRow = Required<
  Omit<WodAnalysis, "model_version" | "prompt_tokens" | "completion_tokens">
> & {
  model_version: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
};
