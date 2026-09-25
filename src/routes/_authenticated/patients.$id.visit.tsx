import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/hospital/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { meQuery, patientsQuery } from "@/lib/db";
import { bmi, bmiLabel, formatDateBg } from "@/lib/patients";

export const Route = createFileRoute("/_authenticated/patients/$id/visit")({
  head: () => ({
    meta: [
      { title: "Нов преглед · МБАЛ Балчик" },
      { name: "description", content: "Въвеждане на тегло, ръст, пулс, оплаквания, диагноза и заключение." },
      { property: "og:title", content: "Нов преглед · МБАЛ Балчик" },
      { property: "og:description", content: "Въвеждане на данни от преглед на пациент." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(patientsQuery),
  component: VisitPage,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">Грешка: {error.message}</div>,
});

const DEPARTMENTS = [
  "Вътрешно отделение", "Хирургия", "Педиатрия", "Неврология", "Кардиология", "Спешно отделение",
  "Акушеро-гинекология", "Ортопедия и травматология", "Клинична лаборатория", "Образна диагностика",
];

const schema = z.object({
  visit_date: z.string().min(10),
  department: z.string().min(2).max(100),
  doctor: z.string().trim().min(2).max(100),
  weight_kg: z.number().min(0.5).max(400),
  height_cm: z.number().min(30).max(250),
  pulse: z.number().int().min(20).max(250),
  temperature: z.number().min(30).max(45),
  blood_pressure: z.string().trim().regex(/^\d{2,3}\/\d{2,3}$/, "RR във формат 120/80"),
  complaints: z.string().trim().max(2000),
  diagnosis: z.string().trim().min(2, "Въведете диагноза").max(300),
  icd: z.string().trim().max(20),
  notes: z.string().trim().max(2000),
  final_notes: z.string().trim().max(3000),
});

function VisitPage() {
  const { id } = Route.useParams();
  const { data: patients } = useSuspenseQuery(patientsQuery);
  const { data: me } = useQuery(meQuery);
  const patient = patients.find((p) => p.dbId === id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const last = patient?.lastVisit;

  const [f, setF] = useState({
    visit_date: new Date().toISOString().slice(0, 10),
    department: last && last.department !== "—" ? last.department : DEPARTMENTS[0]!,
    doctor: "",
    weight_kg: last?.weightKg ? String(last.weightKg) : "",
    height_cm: last?.heightCm ? String(last.heightCm) : "",
    pulse: "", temperature: "36.6", blood_pressure: "",
    complaints: "", diagnosis: "", icd: "", notes: "", final_notes: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  if (!patient) return <AppShell title="нов преглед"><p className="p-6">Пациентът не е намерен.</p></AppShell>;

  const doctor = f.doctor || me?.full_name || "";
  const w = Number(f.weight_kg), h = Number(f.height_cm);
  const index = w && h ? bmi(w, h) : null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...f, doctor, weight_kg: Number(f.weight_kg), height_cm: Number(f.height_cm),
      pulse: Number(f.pulse), temperature: Number(f.temperature.replace(",", ".")),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Невалидни данни"); return; }
    setBusy(true);
    const { error } = await supabase.from("visits").insert({ ...parsed.data, patient_id: id, created_by: me?.id ?? null });
    setBusy(false);
    if (error) { toast.error("Грешка при запис: " + error.message); return; }
    await qc.invalidateQueries({ queryKey: ["patients"] });
    toast.success("Прегледът е записан");
    navigate({ to: "/registry" });
  }

  return (
    <AppShell title="нов преглед">
      <Toaster position="top-center" />
      <form onSubmit={save} className="mx-auto max-w-5xl space-y-3 p-4">
        <div className="panel flex flex-wrap items-center justify-between gap-2 p-3">
          <div>
            <div className="text-xs text-muted-foreground">Преглед на пациент · {patient.id}</div>
            <div className="text-lg font-bold">{patient.fullName}</div>
            <div className="text-xs text-muted-foreground">
              ЕГН {patient.egn} · {patient.age} г. · {patient.visits.length ? `последно посещение ${formatDateBg(patient.lastVisit.date)}` : "първо посещение"}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/registry" className="win-btn">Отказ</Link>
            <button disabled={busy} className="win-btn-primary">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Запиши преглед
            </button>
          </div>
        </div>

        <fieldset className="win-fieldset grid gap-3 sm:grid-cols-3">
          <legend>Данни за прегледа</legend>
          <label className="win-label">Дата<input type="date" value={f.visit_date} onChange={set("visit_date")} className="win-input" /></label>
          <label className="win-label">Отделение
            <select value={f.department} onChange={set("department")} className="win-input">
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="win-label">Лекар<input value={doctor} onChange={set("doctor")} className="win-input" /></label>
        </fieldset>

        <fieldset className="win-fieldset grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <legend>Витални показатели</legend>
          <label className="win-label">Тегло (кг)<input inputMode="decimal" value={f.weight_kg} onChange={set("weight_kg")} className="win-input" required /></label>
          <label className="win-label">Ръст (см)<input inputMode="numeric" value={f.height_cm} onChange={set("height_cm")} className="win-input" required /></label>
          <label className="win-label">Пулс (уд./мин)<input inputMode="numeric" value={f.pulse} onChange={set("pulse")} className="win-input" required /></label>
          <label className="win-label">RR (mmHg)<input placeholder="120/80" value={f.blood_pressure} onChange={set("blood_pressure")} className="win-input" required /></label>
          <label className="win-label">Температура (°C)<input inputMode="decimal" value={f.temperature} onChange={set("temperature")} className="win-input" required /></label>
          <div className="win-label">ИТМ<div className="win-input bg-secondary">{index ? `${index} · ${bmiLabel(index)}` : "—"}</div></div>
        </fieldset>

        <fieldset className="win-fieldset grid gap-3 sm:grid-cols-4">
          <legend>Клинична оценка</legend>
          <label className="win-label sm:col-span-4">Оплаквания / какво му има
            <textarea rows={3} value={f.complaints} onChange={set("complaints")} className="win-input" placeholder="Анамнеза, оплаквания, от кога…" />
          </label>
          <label className="win-label sm:col-span-3">Диагноза / заболяване<input value={f.diagnosis} onChange={set("diagnosis")} className="win-input" required /></label>
          <label className="win-label">МКБ-10<input value={f.icd} onChange={set("icd")} className="win-input" placeholder="напр. J06.9" /></label>
          <label className="win-label sm:col-span-4">Терапия и назначения
            <textarea rows={3} value={f.notes} onChange={set("notes")} className="win-input" />
          </label>
          <label className="win-label sm:col-span-4">Заключение / финални бележки
            <textarea rows={4} value={f.final_notes} onChange={set("final_notes")} className="win-input" />
          </label>
        </fieldset>
        <p className="text-xs text-muted-foreground">След запис данните се появяват в картона и във всички документи (амбулаторен лист, удостоверение и др.).</p>
      </form>
    </AppShell>
  );
}
