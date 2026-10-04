CREATE TABLE public.module_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '',
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_records TO authenticated;
GRANT ALL ON public.module_records TO service_role;
ALTER TABLE public.module_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read module records" ON public.module_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff add module records" ON public.module_records FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Staff edit module records" ON public.module_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins delete module records" ON public.module_records FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX module_records_module_idx ON public.module_records(module, updated_at DESC);
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER module_records_touch BEFORE UPDATE ON public.module_records FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();