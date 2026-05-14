
-- ─── ENUMS ────────────────────────────────────────────────────────────────────
CREATE TYPE public.app_role AS ENUM ('admin', 'coach', 'athlete');
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other');
CREATE TYPE public.experience_level AS ENUM ('beginner', 'intermediate', 'advanced', 'elite');
CREATE TYPE public.movement_category AS ENUM ('olympic_lift', 'power_lift', 'gymnastics', 'monostructural', 'accessory');
CREATE TYPE public.benchmark_category AS ENUM ('girls', 'heroes', 'open', 'quarterfinals', 'semifinals', 'games');
CREATE TYPE public.scoring_type AS ENUM ('for_time', 'amrap', 'for_load', 'for_reps', 'emom');
CREATE TYPE public.scaling_level AS ENUM ('rx', 'scaled', 'foundations');
CREATE TYPE public.mono_modality AS ENUM ('row', 'run', 'ski', 'bike_erg', 'assault_bike', 'echo_bike');

-- ─── HELPER: timestamp trigger ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ─── BOXES ────────────────────────────────────────────────────────────────────
CREATE TABLE public.boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  head_coach_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER boxes_updated BEFORE UPDATE ON public.boxes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  date_of_birth DATE,
  gender public.gender,
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  experience public.experience_level DEFAULT 'beginner',
  box_id UUID REFERENCES public.boxes(id) ON DELETE SET NULL,
  goals TEXT[] DEFAULT '{}',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_profiles_box ON public.profiles(box_id);

-- ─── USER ROLES (separate table — security best practice) ─────────────────────
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  box_id UUID REFERENCES public.boxes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, box_id)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- security definer to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.user_box_id(_user_id UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT box_id FROM public.profiles WHERE id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_coach_of_box(_user_id UUID, _box_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'coach' AND (box_id = _box_id OR box_id IS NULL)
  );
$$;

-- ─── MOVEMENTS DICTIONARY ─────────────────────────────────────────────────────
CREATE TABLE public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category public.movement_category NOT NULL,
  is_max_unbroken BOOLEAN NOT NULL DEFAULT false,
  is_one_rep_max BOOLEAN NOT NULL DEFAULT false,
  rx_load_male_kg NUMERIC(5,2),
  rx_load_female_kg NUMERIC(5,2),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_movements_category ON public.movements(category);

-- ─── BENCHMARK WORKOUTS (Girls / Heroes / Opens) ──────────────────────────────
CREATE TABLE public.benchmark_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category public.benchmark_category NOT NULL,
  scoring public.scoring_type NOT NULL,
  time_cap_seconds INT,
  description TEXT NOT NULL,
  year INT,
  open_code TEXT, -- e.g. "24.1"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_benchmark_category ON public.benchmark_workouts(category);

-- ─── ATHLETE LIFT RECORDS (1RM + rep maxes) ───────────────────────────────────
CREATE TABLE public.athlete_lift_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  movement_id UUID NOT NULL REFERENCES public.movements(id) ON DELETE CASCADE,
  rep_count INT NOT NULL DEFAULT 1, -- 1 = 1RM, 3 = 3RM, etc.
  load_kg NUMERIC(6,2) NOT NULL,
  recorded_on DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lift_athlete ON public.athlete_lift_records(athlete_id, movement_id, recorded_on DESC);

-- ─── ATHLETE GYMNASTICS RECORDS (max unbroken) ────────────────────────────────
CREATE TABLE public.athlete_gymnastics_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  movement_id UUID NOT NULL REFERENCES public.movements(id) ON DELETE CASCADE,
  max_unbroken_reps INT NOT NULL,
  recorded_on DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gym_athlete ON public.athlete_gymnastics_records(athlete_id, movement_id, recorded_on DESC);

-- ─── ATHLETE MONOSTRUCTURAL PACES ─────────────────────────────────────────────
CREATE TABLE public.athlete_mono_paces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  modality public.mono_modality NOT NULL,
  distance_m INT NOT NULL,
  time_seconds INT NOT NULL,
  recorded_on DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mono_athlete ON public.athlete_mono_paces(athlete_id, modality, distance_m, recorded_on DESC);

-- ─── ATHLETE BENCHMARK RESULTS ────────────────────────────────────────────────
CREATE TABLE public.athlete_benchmark_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  benchmark_id UUID NOT NULL REFERENCES public.benchmark_workouts(id) ON DELETE CASCADE,
  scaling public.scaling_level NOT NULL DEFAULT 'rx',
  time_seconds INT,
  total_reps INT,
  total_load_kg NUMERIC(7,2),
  recorded_on DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bench_result_athlete ON public.athlete_benchmark_results(athlete_id, benchmark_id, recorded_on DESC);

-- ─── OPEN PERCENTILE REFERENCE DATA ───────────────────────────────────────────
CREATE TABLE public.open_percentile_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  open_code TEXT NOT NULL,
  gender public.gender NOT NULL,
  age_min INT NOT NULL,
  age_max INT NOT NULL,
  scaling public.scaling_level NOT NULL DEFAULT 'rx',
  percentile INT NOT NULL CHECK (percentile BETWEEN 1 AND 100),
  score_value NUMERIC(8,2) NOT NULL, -- seconds OR reps depending on workout
  score_is_time BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (open_code, gender, age_min, age_max, scaling, percentile)
);
CREATE INDEX idx_open_percentile_lookup ON public.open_percentile_data(open_code, gender, scaling);

-- ─── WEARABLE READINGS ────────────────────────────────────────────────────────
CREATE TABLE public.wearable_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hrv_ms NUMERIC(5,1),
  resting_hr_bpm INT,
  recovery_pct INT CHECK (recovery_pct BETWEEN 0 AND 100),
  sleep_score INT CHECK (sleep_score BETWEEN 0 AND 100),
  sleep_hours NUMERIC(4,2),
  source TEXT, -- 'garmin' | 'whoop' | 'manual'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, reading_date, source)
);
CREATE INDEX idx_wearable_athlete_date ON public.wearable_readings(athlete_id, reading_date DESC);

-- ─── FATIGUE PROFILES (learned thresholds per athlete) ────────────────────────
CREATE TABLE public.fatigue_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  estimated_max_hr INT NOT NULL,
  redline_pct NUMERIC(4,2) NOT NULL DEFAULT 0.90, -- 90% MHR default
  recovery_factor NUMERIC(4,2) NOT NULL DEFAULT 1.00, -- 1.0 = baseline; ML adjusts
  data_points_used INT NOT NULL DEFAULT 0,
  last_calibrated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id)
);
CREATE TRIGGER fatigue_updated BEFORE UPDATE ON public.fatigue_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── RLS ENABLE ───────────────────────────────────────────────────────────────
ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_lift_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_gymnastics_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_mono_paces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_benchmark_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_percentile_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wearable_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fatigue_profiles ENABLE ROW LEVEL SECURITY;

-- ─── RLS POLICIES ─────────────────────────────────────────────────────────────

-- Reference data: world-readable
CREATE POLICY "movements readable" ON public.movements FOR SELECT USING (true);
CREATE POLICY "benchmarks readable" ON public.benchmark_workouts FOR SELECT USING (true);
CREATE POLICY "open percentile readable" ON public.open_percentile_data FOR SELECT USING (true);
CREATE POLICY "boxes readable" ON public.boxes FOR SELECT USING (true);
CREATE POLICY "admin manage movements" ON public.movements FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage benchmarks" ON public.benchmark_workouts FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage open data" ON public.open_percentile_data FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage boxes" ON public.boxes FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Profiles
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_coach_of_box(auth.uid(), box_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- User roles: users can see their own roles; admins manage all
CREATE POLICY "own roles select" ON public.user_roles FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Athlete-owned data: athlete CRUD own; coach of same box read; admin all
-- Macro pattern repeated per table
CREATE POLICY "lifts athlete crud" ON public.athlete_lift_records
  FOR ALL USING (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "lifts coach read" ON public.athlete_lift_records FOR SELECT
  USING (public.is_coach_of_box(auth.uid(), public.user_box_id(athlete_id)));

CREATE POLICY "gym athlete crud" ON public.athlete_gymnastics_records
  FOR ALL USING (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "gym coach read" ON public.athlete_gymnastics_records FOR SELECT
  USING (public.is_coach_of_box(auth.uid(), public.user_box_id(athlete_id)));

CREATE POLICY "mono athlete crud" ON public.athlete_mono_paces
  FOR ALL USING (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "mono coach read" ON public.athlete_mono_paces FOR SELECT
  USING (public.is_coach_of_box(auth.uid(), public.user_box_id(athlete_id)));

CREATE POLICY "bench athlete crud" ON public.athlete_benchmark_results
  FOR ALL USING (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "bench coach read" ON public.athlete_benchmark_results FOR SELECT
  USING (public.is_coach_of_box(auth.uid(), public.user_box_id(athlete_id)));

CREATE POLICY "wearable athlete crud" ON public.wearable_readings
  FOR ALL USING (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "wearable coach read" ON public.wearable_readings FOR SELECT
  USING (public.is_coach_of_box(auth.uid(), public.user_box_id(athlete_id)));

CREATE POLICY "fatigue athlete crud" ON public.fatigue_profiles
  FOR ALL USING (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (athlete_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "fatigue coach read" ON public.fatigue_profiles FOR SELECT
  USING (public.is_coach_of_box(auth.uid(), public.user_box_id(athlete_id)));

-- ─── AUTO-CREATE PROFILE + DEFAULT ATHLETE ROLE ON SIGNUP ─────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'athlete');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── SEED: core movements ─────────────────────────────────────────────────────
INSERT INTO public.movements (slug, name, category, is_one_rep_max, rx_load_male_kg, rx_load_female_kg) VALUES
  ('back-squat','Back Squat','power_lift',true,null,null),
  ('front-squat','Front Squat','power_lift',true,null,null),
  ('overhead-squat','Overhead Squat','olympic_lift',true,null,null),
  ('deadlift','Deadlift','power_lift',true,null,null),
  ('strict-press','Strict Press','power_lift',true,null,null),
  ('push-press','Push Press','power_lift',true,null,null),
  ('bench-press','Bench Press','power_lift',true,null,null),
  ('clean','Clean','olympic_lift',true,null,null),
  ('clean-and-jerk','Clean & Jerk','olympic_lift',true,null,null),
  ('snatch','Snatch','olympic_lift',true,null,null),
  ('thruster','Thruster','olympic_lift',false,43,30),
  ('wall-ball','Wall Ball','olympic_lift',false,9,6);

INSERT INTO public.movements (slug, name, category, is_max_unbroken) VALUES
  ('pull-up','Pull-up','gymnastics',true),
  ('chest-to-bar','Chest-to-Bar Pull-up','gymnastics',true),
  ('bar-muscle-up','Bar Muscle-up','gymnastics',true),
  ('ring-muscle-up','Ring Muscle-up','gymnastics',true),
  ('handstand-push-up','Handstand Push-up','gymnastics',true),
  ('strict-handstand-push-up','Strict HSPU','gymnastics',true),
  ('handstand-walk','Handstand Walk (m)','gymnastics',true),
  ('toes-to-bar','Toes-to-Bar','gymnastics',true),
  ('double-under','Double Under','gymnastics',true),
  ('rope-climb','Rope Climb','gymnastics',true),
  ('pistol','Pistol Squat','gymnastics',true),
  ('burpee','Burpee','gymnastics',false);

INSERT INTO public.movements (slug, name, category) VALUES
  ('row','Row','monostructural'),
  ('run','Run','monostructural'),
  ('ski-erg','Ski Erg','monostructural'),
  ('bike-erg','Bike Erg','monostructural'),
  ('assault-bike','Assault Bike','monostructural'),
  ('echo-bike','Echo Bike','monostructural');

-- ─── SEED: classic Girls benchmarks ───────────────────────────────────────────
INSERT INTO public.benchmark_workouts (slug,name,category,scoring,description) VALUES
  ('fran','Fran','girls','for_time','21-15-9 Thrusters (43/30kg) and Pull-ups'),
  ('grace','Grace','girls','for_time','30 Clean & Jerks for time (61/43kg)'),
  ('helen','Helen','girls','for_time','3 RFT: 400m Run, 21 KB Swings (24/16kg), 12 Pull-ups'),
  ('diane','Diane','girls','for_time','21-15-9 Deadlifts (102/70kg) and Handstand Push-ups'),
  ('elizabeth','Elizabeth','girls','for_time','21-15-9 Cleans (61/43kg) and Ring Dips'),
  ('isabel','Isabel','girls','for_time','30 Snatches for time (61/43kg)'),
  ('karen','Karen','girls','for_time','150 Wall Balls for time (9/6kg)'),
  ('annie','Annie','girls','for_time','50-40-30-20-10 Double Unders and Sit-ups'),
  ('jackie','Jackie','girls','for_time','1000m Row, 50 Thrusters (20kg empty bar), 30 Pull-ups'),
  ('cindy','Cindy','girls','amrap','20 min AMRAP: 5 Pull-ups, 10 Push-ups, 15 Air Squats'),
  ('mary','Mary','girls','amrap','20 min AMRAP: 5 HSPU, 10 Pistols, 15 Pull-ups'),
  ('angie','Angie','girls','for_time','100 Pull-ups, 100 Push-ups, 100 Sit-ups, 100 Squats'),
  ('barbara','Barbara','girls','for_time','5 RFT (3 min rest between): 20 Pull-ups, 30 Push-ups, 40 Sit-ups, 50 Squats'),
  ('chelsea','Chelsea','girls','emom','EMOM 30 min: 5 Pull-ups, 10 Push-ups, 15 Squats'),
  ('nancy','Nancy','girls','for_time','5 RFT: 400m Run, 15 Overhead Squats (43/30kg)');

INSERT INTO public.benchmark_workouts (slug,name,category,scoring,description) VALUES
  ('murph','Murph','heroes','for_time','1 mile Run, 100 Pull-ups, 200 Push-ups, 300 Squats, 1 mile Run (with vest)'),
  ('dt','DT','heroes','for_time','5 RFT: 12 Deadlifts, 9 Hang Power Cleans, 6 Push Jerks (70/47kg)'),
  ('jt','JT','heroes','for_time','21-15-9 HSPU, Ring Dips, Push-ups'),
  ('michael','Michael','heroes','for_time','3 RFT: 800m Run, 50 Back Extensions, 50 Sit-ups'),
  ('the-seven','The Seven','heroes','for_time','7 RFT: 7 HSPU, 7 Thrusters (61/43kg), 7 Knees-to-Elbows, 7 Deadlifts (111/75kg), 7 Burpees, 7 KB Swings (32/24kg), 7 Pull-ups');

-- ─── SEED: a few CrossFit Open WODs ───────────────────────────────────────────
INSERT INTO public.benchmark_workouts (slug,name,category,scoring,description,year,open_code) VALUES
  ('open-11-1','11.1','open','amrap','10 min AMRAP: 30 Double Unders, 15 Power Snatches (34/25kg)',2011,'11.1'),
  ('open-14-5','14.5','open','for_time','21-18-15-12-9-6-3 Thrusters (43/30kg) and Bar-facing Burpees',2014,'14.5'),
  ('open-17-5','17.5','open','for_time','10 RFT: 9 Thrusters (43/30kg), 35 Double Unders',2017,'17.5'),
  ('open-19-5','19.5','open','for_time','33-27-21-15-9 Thrusters (43/30kg) and Chest-to-Bar Pull-ups',2019,'19.5'),
  ('open-22-1','22.1','open','amrap','15 min AMRAP: 3 Wall Walks, 12 DB Snatches (22.5/15kg), 15 Box Jump-overs',2022,'22.1'),
  ('open-23-1','23.1','open','for_time','For time: 60 Wall Balls, 60 DUs, 30 Cleans, 60 DUs, 30 Toes-to-Bar, 60 DUs, 30 DB Snatches, 60 DUs, 30 Burpee Pull-ups',2023,'23.1'),
  ('open-24-1','24.1','open','for_time','21-15-9 reps, alternating arms: DB Snatches and Burpee Box Jump-overs',2024,'24.1'),
  ('open-24-2','24.2','open','amrap','20 min AMRAP: 300m Row, 10 DLs (84/61kg), 50 DUs',2024,'24.2'),
  ('open-24-3','24.3','open','for_time','5 RFT (12 min cap): 10 Thrusters, 10 C2B Pull-ups, then 7-7 BMU/Front Squats',2024,'24.3');
