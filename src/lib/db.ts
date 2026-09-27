import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calcAge, type Patient, type Sex, type Visit } from "./patients";

type VisitRow = {
  visit_date: string; department: string; doctor: string; diagnosis: string; icd: string;
  weight_kg: number; height_cm: number; blood_pressure: string; pulse: number; temperature: number;
  notes: string; complaints: string; final_notes: string; created_at: string;
};

function toVisit(v: VisitRow): Visit {
  return {
    date: v.visit_date, department: v.department, doctor: v.doctor, diagnosis: v.diagnosis, icd: v.icd,
    weightKg: Number(v.weight_kg), heightCm: Number(v.height_cm), bloodPressure: v.blood_pressure,
    pulse: v.pulse, temperature: Number(v.temperature), notes: v.notes, complaints: v.complaints,
    finalNotes: v.final_notes,
  };
}

const EMPTY_VISIT: Visit = {
  date: new Date().toISOString().slice(0, 10), department: "—", doctor: "—", diagnosis: "Няма прегледи",
  icd: "—", weightKg: 0, heightCm: 0, bloodPressure: "—", pulse: 0, temperature: 0, notes: "",
};

export async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from("patients")
    .select("*, visits(*)")
    .order("last_name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => {
    const visits = ((p.visits ?? []) as VisitRow[])
      .sort((a, b) => (b.visit_date + b.created_at).localeCompare(a.visit_date + a.created_at))
      .map(toVisit);
    return {
      id: p.code, dbId: p.id, egn: p.egn, firstName: p.first_name, middleName: p.middle_name,
      lastName: p.last_name, fullName: [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" "),
      sex: p.sex as Sex, birthDate: p.birth_date, age: calcAge(p.birth_date), phone: p.phone, email: p.email,
      address: p.address, city: p.city, bloodType: p.blood_type, allergies: p.allergies, insurer: p.insurer,
      insured: p.insured, isStudent: p.is_student, schoolName: p.school_name ?? undefined,
      schoolLocation: p.school_location ?? undefined, grade: p.grade ?? undefined, gp: p.gp,
      visits, lastVisit: visits[0] ?? EMPTY_VISIT,
    };
  });
}

export const patientsQuery = queryOptions({ queryKey: ["patients"], queryFn: fetchPatients });

export type StaffProfile = { id: string; full_name: string; position: string; email: string; isDoctor: boolean; isAdmin: boolean };

export async function fetchMe(): Promise<StaffProfile | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const [{ data: prof }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", u.user.id),
  ]);
  return {
    id: u.user.id,
    full_name: prof?.full_name ?? u.user.email ?? "",
    position: prof?.position ?? "",
    email: u.user.email ?? "",
    isDoctor: (roles ?? []).some((r) => r.role === "doctor"),
    isAdmin: (roles ?? []).some((r) => r.role === "admin"),
  };
}

export const meQuery = queryOptions({ queryKey: ["me"], queryFn: fetchMe });

/** EGN → birth date + sex (Bulgarian rules). */
export function parseEgn(egn: string): { birthDate: string; sex: Sex } | null {
  if (!/^\d{10}$/.test(egn)) return null;
  let y = Number(egn.slice(0, 2));
  let m = Number(egn.slice(2, 4));
  const d = Number(egn.slice(4, 6));
  if (m > 40) { m -= 40; y += 2000; } else if (m > 20) { m -= 20; y += 1800; } else y += 1900;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return null;
  const sex: Sex = Number(egn[8]) % 2 === 0 ? "Мъж" : "Жена";
  return { birthDate: dt.toISOString().slice(0, 10), sex };
}
