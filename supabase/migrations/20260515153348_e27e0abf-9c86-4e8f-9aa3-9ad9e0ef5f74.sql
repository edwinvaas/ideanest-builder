
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS intended_stimulus_min INT,
  ADD COLUMN IF NOT EXISTS intended_stimulus_max INT,
  ADD COLUMN IF NOT EXISTS stimulus_description TEXT,
  ADD COLUMN IF NOT EXISTS coaching_goals_text TEXT,
  ADD COLUMN IF NOT EXISTS class_size INT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subjective_wellness INT CHECK (subjective_wellness BETWEEN 1 AND 10);
