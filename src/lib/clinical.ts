import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isFinal, type ClinicalRecord } from "./clinical-model";

type Version = { revision: number; changed_at: string; changed_by: string; reason: string; snapshot: ClinicalRecord };
// Tables are newer than the generated types; use an untyped handle.
const db = supabase as unknown as { from: (t: string) => any };

async function list(): Promise<ClinicalRecord[]> {
  const { data, error } = await db.from("clinical_records").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ClinicalRecord[];
}

export const clinicalQuery = queryOptions({ queryKey: ["clinical-records"], queryFn: list });

export async function fetchVersions(id: string): Promise<Version[]> {
  const { data, error } = await db
    .from("clinical_record_versions")
    .select("revision, changed_at, changed_by, reason, snapshot")
    .eq("record_id", id)
    .order("revision", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Version[];
}

async function writeVersion(r: ClinicalRecord, uid: string, reason: string) {
  const { error } = await db.from("clinical_record_versions").insert({
    record_id: r.id, revision: r.revision, changed_by: uid, reason: reason || "Запис", snapshot: r,
  });
  if (error) throw error;
}

export async function saveClinical(input: Partial<ClinicalRecord>, expected: number | null, reason: string): Promise<ClinicalRecord> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Не сте влезли в системата.");
  const uid = u.user.id;
  const now = new Date().toISOString();
  let saved: ClinicalRecord;
  if (input.id) {
    const { data: old, error: e1 } = await db.from("clinical_records").select("*").eq("id", input.id).maybeSingle();
    if (e1) throw e1;
    if (!old) throw new Error("Записът не е намерен.");
    if (old.revision !== expected) throw new Error("Записът е променен. Обновете.");
    if (old.finalized_at && !reason.trim()) throw new Error("Посочете причина за корекцията.");
    const { data, error } = await db.from("clinical_records").update({
      patient_id: input.patient_id ?? null, title: input.title, status: input.status, data: input.data,
      related_id: input.related_id ?? null, revision: old.revision + 1, updated_at: now,
      finalized_at: old.finalized_at ?? (isFinal(old.kind, input.status!) ? now : null),
    }).eq("id", input.id).eq("revision", old.revision).select().single();
    if (error) throw error;
    saved = data;
  } else {
    const { data, error } = await db.from("clinical_records").insert({
      patient_id: input.patient_id ?? null, owner_id: uid, kind: input.kind, title: input.title, status: input.status,
      data: input.data, related_id: input.related_id ?? null, revision: 1,
      finalized_at: isFinal(input.kind!, input.status!) ? now : null,
    }).select().single();
    if (error) throw error;
    saved = data;
  }
  await writeVersion(saved, uid, reason);
  if (saved.kind === "discharge" && saved.status === "Приключен" && saved.related_id) {
    const { data: adm } = await db.from("clinical_records").select("*").eq("id", saved.related_id).maybeSingle();
    if (adm && adm.status !== "Изписан") {
      const { data: upd } = await db.from("clinical_records")
        .update({ status: "Изписан", revision: adm.revision + 1, updated_at: now }).eq("id", adm.id).select().single();
      if (upd) await writeVersion(upd, uid, "Приключена епикриза");
    }
  }
  return saved;
}
