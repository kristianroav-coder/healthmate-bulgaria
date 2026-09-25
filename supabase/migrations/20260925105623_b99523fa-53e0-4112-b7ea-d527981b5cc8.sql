CREATE TYPE public.app_role AS ENUM ('admin','doctor','nurse','registrar');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL,
  position text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Staff read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Read own roles or admin" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE SEQUENCE public.patient_code_seq START 1;
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT ('PAT-' || lpad(nextval('public.patient_code_seq')::text, 4, '0')),
  egn text NOT NULL UNIQUE,
  first_name text NOT NULL,
  middle_name text NOT NULL DEFAULT '',
  last_name text NOT NULL,
  sex text NOT NULL DEFAULT 'Мъж',
  birth_date date NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT 'Балчик',
  blood_type text NOT NULL DEFAULT '—',
  allergies text NOT NULL DEFAULT 'Не съобщава',
  insurer text NOT NULL DEFAULT 'НЗОК',
  insured boolean NOT NULL DEFAULT true,
  is_student boolean NOT NULL DEFAULT false,
  school_name text,
  school_location text,
  grade text,
  gp text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
GRANT USAGE ON SEQUENCE public.patient_code_seq TO authenticated, service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff add patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff edit patients" ON public.patients FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_date date NOT NULL DEFAULT current_date,
  department text NOT NULL DEFAULT '',
  doctor text NOT NULL DEFAULT '',
  complaints text NOT NULL DEFAULT '',
  diagnosis text NOT NULL DEFAULT '',
  icd text NOT NULL DEFAULT '',
  weight_kg numeric NOT NULL,
  height_cm numeric NOT NULL,
  blood_pressure text NOT NULL DEFAULT '',
  pulse integer NOT NULL DEFAULT 0,
  temperature numeric NOT NULL DEFAULT 36.6,
  notes text NOT NULL DEFAULT '',
  final_notes text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX visits_patient_idx ON public.visits(patient_id, visit_date DESC);
GRANT SELECT, INSERT ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read visits" ON public.visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff add visits" ON public.visits FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);