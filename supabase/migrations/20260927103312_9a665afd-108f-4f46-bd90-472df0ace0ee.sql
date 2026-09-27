CREATE TABLE public.clinical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  status text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  related_id uuid REFERENCES public.clinical_records(id) ON DELETE SET NULL,
  revision int NOT NULL DEFAULT 1,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.clinical_record_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.clinical_records(id) ON DELETE CASCADE,
  revision int NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid NOT NULL,
  reason text NOT NULL DEFAULT '',
  snapshot jsonb NOT NULL
);
GRANT SELECT, INSERT, UPDATE ON public.clinical_records TO authenticated;
GRANT SELECT, INSERT ON public.clinical_record_versions TO authenticated;
GRANT ALL ON public.clinical_records TO service_role;
GRANT ALL ON public.clinical_record_versions TO service_role;
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_record_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinicians read records" ON public.clinical_records FOR SELECT TO authenticated
  USING ((kind <> 'profile' AND kind <> 'tasks') OR owner_id = auth.uid());
CREATE POLICY "Clinicians add records" ON public.clinical_records FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'doctor')));
CREATE POLICY "Clinicians update records" ON public.clinical_records FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'doctor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'doctor'));
CREATE POLICY "Read versions" ON public.clinical_record_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clinical_records r WHERE r.id = record_id));
CREATE POLICY "Add versions" ON public.clinical_record_versions FOR INSERT TO authenticated
  WITH CHECK (changed_by = auth.uid() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'doctor')));
CREATE INDEX ON public.clinical_records(patient_id);
CREATE INDEX ON public.clinical_record_versions(record_id);