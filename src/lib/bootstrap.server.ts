
import { PATIENTS } from "./patients";

// One-time setup: only runs while no administrator exists.
export async function bootstrapHospital() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if ((count ?? 0) > 0) return { ok: false, reason: "already initialised" };

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: "kristiyandimitrov@gmail.com",
    password: "Kristian2500",
    email_confirm: true,
    user_metadata: { full_name: "Кристиан Димитров" },
  });
  if (error || !created.user) throw new Error(error?.message ?? "create failed");
  const uid = created.user.id;
  await supabaseAdmin.from("profiles").insert({
    id: uid, full_name: "Кристиан Димитров", position: "Управител, Главен лекар", email: "kristiyandimitrov@gmail.com",
  });
  await supabaseAdmin.from("user_roles").insert([{ user_id: uid, role: "admin" }, { user_id: uid, role: "doctor" }]);

  const { count: pc } = await supabaseAdmin.from("patients").select("id", { count: "exact", head: true });
  if ((pc ?? 0) === 0) {
    const rows = PATIENTS.map((x) => ({
      code: x.id, egn: x.egn, first_name: x.firstName, middle_name: x.middleName, last_name: x.lastName,
      sex: x.sex, birth_date: x.birthDate, phone: x.phone, email: x.email, address: x.address,
      city: x.city, blood_type: x.bloodType, allergies: x.allergies, insurer: x.insurer, insured: x.insured,
      is_student: x.isStudent, school_name: x.schoolName ?? null, school_location: x.schoolLocation ?? null,
      grade: x.grade ?? null, gp: x.gp,
    }));
    const { data: ins, error: e1 } = await supabaseAdmin.from("patients").insert(rows).select("id, code");
    if (e1) throw new Error(e1.message);
    const idByCode = new Map(ins!.map((r) => [r.code, r.id]));
    const visits = PATIENTS.flatMap((x) =>
      x.visits.map((v) => ({
        patient_id: idByCode.get(x.id)!, visit_date: v.date, department: v.department, doctor: v.doctor,
        diagnosis: v.diagnosis, icd: v.icd, weight_kg: v.weightKg, height_cm: v.heightCm,
        blood_pressure: v.bloodPressure, pulse: v.pulse, temperature: v.temperature, notes: v.notes,
      })),
    );
    const { error: e2 } = await supabaseAdmin.from("visits").insert(visits);
    if (e2) throw new Error(e2.message);
  }
  return { ok: true };
}
