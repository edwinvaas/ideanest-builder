/**
 * Coach-side intelligence: anomaly detection vs personal baseline + box
 * comparison vs CrossFit Open globals. Pure functions.
 */

export interface AthleteResultLike {
  athlete_id: string;
  display_name?: string;
  time_seconds: number | null;
  rpe: number | null;
  recorded_on?: string | null;
}

export interface AthleteBaseline {
  athlete_id: string;
  display_name: string;
  /** Median time of last N sessions in seconds */
  baselineTimeSec: number | null;
  /** Average RPE of last N sessions */
  baselineRpe: number | null;
}

export interface AnomalyAlert {
  athlete_id: string;
  display_name: string;
  severity: "low" | "medium" | "high";
  message: string;
  deltaPct: number;
}

export function buildBaseline(
  athleteId: string,
  displayName: string,
  history: AthleteResultLike[],
): AthleteBaseline {
  const times = history
    .map((h) => h.time_seconds)
    .filter((t): t is number => typeof t === "number" && t > 0)
    .sort((a, b) => a - b);
  const median = times.length
    ? times[Math.floor(times.length / 2)]
    : null;
  const rpes = history.map((h) => h.rpe).filter((r): r is number => typeof r === "number");
  const avgRpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null;
  return {
    athlete_id: athleteId,
    display_name: displayName,
    baselineTimeSec: median,
    baselineRpe: avgRpe,
  };
}

export function detectAnomaly(
  baseline: AthleteBaseline,
  latest: AthleteResultLike | null,
): AnomalyAlert | null {
  if (!latest || !baseline.baselineTimeSec || !latest.time_seconds) return null;
  const delta =
    (latest.time_seconds - baseline.baselineTimeSec) / baseline.baselineTimeSec;
  const absDelta = Math.abs(delta);
  if (absDelta < 0.25) return null;
  const severity: "low" | "medium" | "high" =
    absDelta > 0.5 ? "high" : absDelta > 0.35 ? "medium" : "low";
  const direction = delta > 0 ? "trager" : "sneller";
  return {
    athlete_id: baseline.athlete_id,
    display_name: baseline.display_name,
    severity,
    deltaPct: Math.round(delta * 100),
    message: `Check ${baseline.display_name}: ${Math.abs(Math.round(delta * 100))}% ${direction} dan baseline — mogelijk blessure of slecht herstel.`,
  };
}

// ───────────── Open Global comparison ─────────────

export interface OpenPercentileRow {
  open_code: string;
  gender: string;
  age_min: number;
  age_max: number;
  scaling: string;
  percentile: number;
  score_value: number;
  score_is_time: boolean;
}

/**
 * Given a class' results and the Open percentile distribution, return the
 * average percentile of the class. Lower time = better when score_is_time.
 */
export function compareToOpenGlobal(
  results: AthleteResultLike[],
  percentiles: OpenPercentileRow[],
): { avgPercentile: number | null; sampleSize: number } {
  if (percentiles.length === 0) return { avgPercentile: null, sampleSize: 0 };
  const isTime = percentiles[0].score_is_time;
  const sorted = [...percentiles].sort((a, b) =>
    isTime ? a.score_value - b.score_value : b.score_value - a.score_value,
  );
  const buckets = sorted.map((p) => ({ pct: p.percentile, val: p.score_value }));

  const valid = results
    .map((r) => r.time_seconds)
    .filter((t): t is number => typeof t === "number" && t > 0);
  if (valid.length === 0) return { avgPercentile: null, sampleSize: 0 };

  const percentilesForResults = valid.map((time) => {
    // find first bucket where the athlete's time beats the bucket value
    const hit = buckets.find((b) => (isTime ? time <= b.val : time >= b.val));
    return hit?.pct ?? 0;
  });
  const avg =
    percentilesForResults.reduce((a, b) => a + b, 0) /
    percentilesForResults.length;
  return { avgPercentile: Math.round(avg), sampleSize: valid.length };
}
