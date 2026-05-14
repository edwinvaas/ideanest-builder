// Intelligence Layer types — LimiterCluster and CoachStrategy.
// These are derived/computed concepts that sit on top of the raw wod_analyses
// and athlete_limiter_profiles tables.

import type { LimiterType, LimiterDemands, ScalingLevel, WodAnalysis } from "./wod-analysis";

// ─── Limiter Cluster ──────────────────────────────────────────────────────────
// A cluster is a group of athletes with a similar limiter profile.
// Rows come from the athlete_limiter_profiles table, grouped server-side.

export interface LimiterProfile {
  engine: number;    // 0.0–1.0 scores per limiter
  strength: number;
  gymnastics: number;
  mobility: number;
  pacing: number;
  recovery: number;
}

export interface ClusterMember {
  athlete_id: string;
  display_name: string;
  profile: LimiterProfile;
  /** Dot-product of athlete profile vs current WOD's limiter_demands. 0.0–1.0. */
  readiness_score: number;
  recommended_scaling: ScalingLevel;
}

export interface LimiterCluster {
  /** Deterministic label derived from primary + secondary limiter, e.g. "Engine / Gymnastics" */
  label: string;
  primary_limiter: LimiterType;
  secondary_limiter: LimiterType | null;
  /** Centroid of all athlete profiles in this cluster (average per limiter). */
  centroid: LimiterProfile;
  members: ClusterMember[];
  athlete_count: number;
}

// ─── Coach Strategy ───────────────────────────────────────────────────────────
// One strategy object per cluster, derived by combining the WOD analysis with
// the cluster's centroid profile. Computed client-side via deriveCoachStrategies().

export interface CoachStrategy {
  cluster: LimiterCluster;

  /** 0.0–1.0. Average of member readiness scores within this cluster. */
  cluster_readiness: number;

  /** Which scaling tier the majority of this cluster should target. */
  recommended_scaling: ScalingLevel;

  /**
   * The one coaching cue most relevant to this cluster for this WOD.
   * Derived from the WOD's pacing_risks and high_risk_limiters vs the cluster's primary limiter.
   * This is the "coaches see decisions" surface — direct, tactical, no fluff.
   */
  focus_cue: string;

  /**
   * Movements the coach should watch most closely for this cluster.
   * Intersection of wod_analysis.demanding_movements and movements where
   * cluster.primary_limiter is the primary_limiter.
   */
  watch_movements: string[];

  /**
   * Athletes in this cluster who are significantly below the WOD's limiter demands
   * (readiness_score < 0.5). These need a pre-class conversation.
   */
  flag_for_check_in: ClusterMember[];
}

// ─── Derivation helpers ───────────────────────────────────────────────────────

/**
 * Compute readiness score for a single athlete profile vs a WOD's limiter demands.
 * Uses dot-product normalised to 0–1. Higher = better match.
 */
export function computeReadinessScore(
  profile: LimiterProfile,
  demands: LimiterDemands,
): number {
  const LIMITERS: LimiterType[] = [
    "engine", "strength", "gymnastics", "mobility", "pacing", "recovery",
  ];
  const dot = LIMITERS.reduce(
    (sum, key) => sum + profile[key] * demands[key],
    0,
  );
  // Max possible dot-product is 6 (all scores 1.0 × all demands 1.0)
  return Math.min(dot / 6, 1);
}

/**
 * Derive one CoachStrategy per LimiterCluster for a given WOD analysis.
 * Call this after you have fetched both clusters and the wod_analysis from Supabase.
 */
export function deriveCoachStrategies(
  clusters: LimiterCluster[],
  analysis: WodAnalysis,
): CoachStrategy[] {
  return clusters.map((cluster) => {
    const members = cluster.members.map((m) => ({
      ...m,
      readiness_score: computeReadinessScore(m.profile, analysis.limiter_demands),
      recommended_scaling: resolveScaling(
        computeReadinessScore(m.profile, analysis.limiter_demands),
      ),
    }));

    const cluster_readiness =
      members.reduce((sum, m) => sum + m.readiness_score, 0) / members.length;

    const watch_movements = analysis.movements
      .filter((mv) => mv.primary_limiter === cluster.primary_limiter)
      .map((mv) => mv.name)
      .filter((name) => analysis.demanding_movements.includes(name));

    const focus_cue = deriveFocusCue(cluster, analysis);

    return {
      cluster,
      cluster_readiness,
      recommended_scaling: resolveScaling(cluster_readiness),
      focus_cue,
      watch_movements,
      flag_for_check_in: members.filter((m) => m.readiness_score < 0.5),
    };
  });
}

function resolveScaling(readiness: number): ScalingLevel {
  if (readiness >= 0.7) return "rx";
  if (readiness >= 0.4) return "scaled";
  return "foundations";
}

function deriveFocusCue(cluster: LimiterCluster, analysis: WodAnalysis): string {
  const limiter = cluster.primary_limiter;

  // If this limiter is high-risk in the WOD, surface the relevant pacing risk mitigation
  if (analysis.high_risk_limiters.includes(limiter)) {
    const relevantRisk = analysis.pacing_risks.find((r) =>
      r.mitigation.toLowerCase().includes(limiter) ||
      r.risk.toLowerCase().includes(limiter),
    );
    if (relevantRisk) return relevantRisk.mitigation;
  }

  // Fallback: generic cue derived from stimulus + limiter combination
  return `${cluster.label}-beperkte atleten: focus op ${analysis.recommended_pacing.replace("_", " ")} tempo — behoud beweegkwaliteit boven intensiteit.`;
}
