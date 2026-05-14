
-- ─── workout_sessions ────────────────────────────────────────────────────────
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID REFERENCES public.boxes(id) ON DELETE CASCADE,
  benchmark_id UUID REFERENCES public.benchmark_workouts(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  scheduled_for DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  dominant_stimulus TEXT,
  primary_limiter TEXT,
  energy_phosphagen INTEGER NOT NULL DEFAULT 0,
  energy_glycolytic INTEGER NOT NULL DEFAULT 0,
  energy_oxidative INTEGER NOT NULL DEFAULT 0,
  expected_time_seconds INTEGER,
  time_cap_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_box_date ON public.workout_sessions(box_id, scheduled_for DESC);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions box read" ON public.workout_sessions FOR SELECT
USING (box_id IS NULL OR box_id = public.user_box_id(auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "sessions coach write" ON public.workout_sessions FOR ALL
USING (public.is_coach_of_box(auth.uid(), box_id) OR public.has_role(auth.uid(),'admin'))
WITH CHECK (public.is_coach_of_box(auth.uid(), box_id) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON public.workout_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── athlete_strategies ──────────────────────────────────────────────────────
CREATE TABLE public.athlete_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL,
  anaerobic_threshold_bpm INTEGER,
  redline_bpm INTEGER,
  fatigue_point_seconds INTEGER,
  splits JSONB NOT NULL DEFAULT '[]'::jsonb,
  advice TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, athlete_id)
);
CREATE INDEX idx_strategies_athlete ON public.athlete_strategies(athlete_id);

ALTER TABLE public.athlete_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "strat athlete crud" ON public.athlete_strategies FOR ALL
USING (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
WITH CHECK (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "strat coach read" ON public.athlete_strategies FOR SELECT
USING (public.is_coach_of_box(auth.uid(), public.user_box_id(athlete_id)));

-- ─── athlete_session_results ─────────────────────────────────────────────────
CREATE TABLE public.athlete_session_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL,
  scaling public.scaling_level NOT NULL DEFAULT 'rx',
  time_seconds INTEGER,
  total_reps INTEGER,
  rpe INTEGER NOT NULL CHECK (rpe BETWEEN 1 AND 10),
  perceived_limiter TEXT,
  fatigue_point_seconds INTEGER,
  notes TEXT,
  recorded_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, athlete_id)
);
CREATE INDEX idx_results_athlete ON public.athlete_session_results(athlete_id, recorded_on DESC);

ALTER TABLE public.athlete_session_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "result athlete crud" ON public.athlete_session_results FOR ALL
USING (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
WITH CHECK (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "result coach read" ON public.athlete_session_results FOR SELECT
USING (public.is_coach_of_box(auth.uid(), public.user_box_id(athlete_id)));

-- ─── Adaptive fatigue trigger ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.adapt_fatigue_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_age INT;
  v_max_hr INT;
  v_redline NUMERIC;
  v_recovery NUMERIC;
  v_data_points INT;
BEGIN
  SELECT EXTRACT(YEAR FROM age(date_of_birth))::INT INTO v_age
  FROM public.profiles WHERE id = NEW.athlete_id;
  v_max_hr := COALESCE(208 - (0.7 * COALESCE(v_age, 30))::INT, 190);

  -- Adaptive redline: RPE 9-10 = pushed past redline, lower threshold
  -- RPE <=6 = under-paced, raise threshold
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

  INSERT INTO public.fatigue_profiles (
    athlete_id, estimated_max_hr, redline_pct, recovery_factor,
    last_calibrated_at, data_points_used
  ) VALUES (
    NEW.athlete_id, v_max_hr, v_redline, v_recovery, now(), 1
  )
  ON CONFLICT (athlete_id) DO UPDATE SET
    estimated_max_hr = v_max_hr,
    -- exponential moving average over previous values
    redline_pct = ROUND((public.fatigue_profiles.redline_pct * 0.7 + v_redline * 0.3)::NUMERIC, 3),
    recovery_factor = ROUND((public.fatigue_profiles.recovery_factor * 0.7 + v_recovery * 0.3)::NUMERIC, 3),
    last_calibrated_at = now(),
    data_points_used = public.fatigue_profiles.data_points_used + 1,
    updated_at = now();

  RETURN NEW;
END $$;

-- need unique constraint on athlete_id for ON CONFLICT
ALTER TABLE public.fatigue_profiles ADD CONSTRAINT fatigue_profiles_athlete_unique UNIQUE (athlete_id);

CREATE TRIGGER trg_adapt_fatigue
AFTER INSERT ON public.athlete_session_results
FOR EACH ROW EXECUTE FUNCTION public.adapt_fatigue_profile();
