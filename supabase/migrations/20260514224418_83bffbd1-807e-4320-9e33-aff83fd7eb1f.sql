
-- Add correction factor + mental resilience to fatigue_profiles
ALTER TABLE public.fatigue_profiles
  ADD COLUMN IF NOT EXISTS correction_factor numeric NOT NULL DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS mental_resilience_score numeric NOT NULL DEFAULT 0.50;

-- Track which protocol the athlete picked
ALTER TABLE public.athlete_strategies
  ADD COLUMN IF NOT EXISTS chosen_protocol text NOT NULL DEFAULT 'smart_engine';

-- Coach alerts table
CREATE TABLE IF NOT EXISTS public.coach_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL,
  session_id uuid,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts athlete read own"
  ON public.coach_alerts FOR SELECT
  USING (athlete_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "alerts coach read box"
  ON public.coach_alerts FOR SELECT
  USING (is_coach_of_box(auth.uid(), user_box_id(athlete_id)));

CREATE POLICY "alerts system insert"
  ON public.coach_alerts FOR INSERT
  WITH CHECK (athlete_id = auth.uid() OR is_coach_of_box(auth.uid(), user_box_id(athlete_id)) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "alerts coach resolve"
  ON public.coach_alerts FOR UPDATE
  USING (is_coach_of_box(auth.uid(), user_box_id(athlete_id)) OR has_role(auth.uid(), 'admin'::app_role));

-- Upgraded adaptive trigger: now also adapts correction_factor + mental_resilience
CREATE OR REPLACE FUNCTION public.adapt_fatigue_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_age INT;
  v_max_hr INT;
  v_redline NUMERIC;
  v_recovery NUMERIC;
  v_predicted_fp INT;
  v_actual_fp INT;
  v_correction NUMERIC;
  v_resilience NUMERIC;
BEGIN
  SELECT EXTRACT(YEAR FROM age(date_of_birth))::INT INTO v_age
  FROM public.profiles WHERE id = NEW.athlete_id;
  v_max_hr := COALESCE(208 - (0.7 * COALESCE(v_age, 30))::INT, 190);

  v_redline := CASE
    WHEN NEW.rpe >= 9 THEN 0.87
    WHEN NEW.rpe >= 7 THEN 0.90
    WHEN NEW.rpe >= 5 THEN 0.92
    ELSE 0.94
  END;

  v_recovery := CASE
    WHEN NEW.rpe >= 9 THEN 0.85
    WHEN NEW.rpe >= 7 THEN 1.00
    ELSE 1.10
  END;

  -- Pull what we predicted, vs what the athlete reported
  SELECT fatigue_point_seconds INTO v_predicted_fp
  FROM public.athlete_strategies
  WHERE session_id = NEW.session_id AND athlete_id = NEW.athlete_id
  LIMIT 1;
  v_actual_fp := NEW.fatigue_point_seconds;

  -- Correction factor: <1 means athlete sours earlier than we thought, so
  -- next time we tighten the threshold; >1 means they hold longer.
  IF v_predicted_fp IS NOT NULL AND v_actual_fp IS NOT NULL AND v_predicted_fp > 0 THEN
    v_correction := GREATEST(0.7, LEAST(1.3, v_actual_fp::NUMERIC / v_predicted_fp::NUMERIC));
  ELSE
    v_correction := 1.0;
  END IF;

  -- Mental resilience: held high HR with low RPE = resilient.
  -- RPE 1-10; lower RPE relative to predicted load = higher resilience.
  v_resilience := GREATEST(0.0, LEAST(1.0, (10 - NEW.rpe)::NUMERIC / 10.0));

  INSERT INTO public.fatigue_profiles (
    athlete_id, estimated_max_hr, redline_pct, recovery_factor,
    correction_factor, mental_resilience_score,
    last_calibrated_at, data_points_used
  ) VALUES (
    NEW.athlete_id, v_max_hr, v_redline, v_recovery,
    v_correction, v_resilience, now(), 1
  )
  ON CONFLICT (athlete_id) DO UPDATE SET
    estimated_max_hr = v_max_hr,
    redline_pct = ROUND((public.fatigue_profiles.redline_pct * 0.7 + v_redline * 0.3)::NUMERIC, 3),
    recovery_factor = ROUND((public.fatigue_profiles.recovery_factor * 0.7 + v_recovery * 0.3)::NUMERIC, 3),
    correction_factor = ROUND((public.fatigue_profiles.correction_factor * 0.7 + v_correction * 0.3)::NUMERIC, 3),
    mental_resilience_score = ROUND((public.fatigue_profiles.mental_resilience_score * 0.7 + v_resilience * 0.3)::NUMERIC, 3),
    last_calibrated_at = now(),
    data_points_used = public.fatigue_profiles.data_points_used + 1,
    updated_at = now();

  -- Anomaly detector: if predicted vs actual diverges hard, raise an alert
  IF v_predicted_fp IS NOT NULL AND v_actual_fp IS NOT NULL
     AND ABS(v_actual_fp - v_predicted_fp)::NUMERIC / GREATEST(v_predicted_fp, 1) > 0.30 THEN
    INSERT INTO public.coach_alerts (athlete_id, session_id, alert_type, severity, message)
    VALUES (
      NEW.athlete_id,
      NEW.session_id,
      'fatigue_anomaly',
      CASE WHEN ABS(v_actual_fp - v_predicted_fp)::NUMERIC / GREATEST(v_predicted_fp, 1) > 0.5 THEN 'high' ELSE 'medium' END,
      'Prestatie wijkt sterk af van baseline — mogelijk blessure of slecht herstel.'
    );
  END IF;

  RETURN NEW;
END $$;

-- Make sure the trigger is wired (was missing per supabase-info)
DROP TRIGGER IF EXISTS adapt_fatigue_after_result ON public.athlete_session_results;
CREATE TRIGGER adapt_fatigue_after_result
  AFTER INSERT ON public.athlete_session_results
  FOR EACH ROW EXECUTE FUNCTION public.adapt_fatigue_profile();
