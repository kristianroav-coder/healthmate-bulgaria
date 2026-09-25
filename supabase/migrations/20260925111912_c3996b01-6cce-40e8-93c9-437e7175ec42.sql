CREATE TABLE public.school_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  school_name text NOT NULL DEFAULT '',
  school_location text NOT NULL DEFAULT '',
  grade text NOT NULL DEFAULT '',
  weight_kg numeric,
  height_cm numeric,
  diseases text NOT NULL DEFAULT '',
  allergies text NOT NULL DEFAULT '',
  vaccinations text NOT NULL DEFAULT '',
  pe_group text NOT NULL DEFAULT '',
  conclusion text NOT NULL DEFAULT '',
  doctor text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.school_notes TO authenticated;
GRANT ALL ON public.school_notes TO service_role;
ALTER TABLE public.school_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read school notes" ON public.school_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff add school notes" ON public.school_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE INDEX ON public.school_notes(patient_id);