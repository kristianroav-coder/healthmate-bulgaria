import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/hospital/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseEgn } from "@/lib/db";
import { calcAge, formatDateBg, isValidEgn } from "@/lib/patients";

export const Route = createFileRoute("/_authenticated/patients/new")({
  head: () => ({
    meta: [
      { title: "Нов пациент · МБАЛ Балчик" },
      { name: "description", content: "Регистриране на нов пациент с име и ЕГН." },
      { property: "og:title", content: "Нов пациент · МБАЛ Балчик" },
      { property: "og:description", content: "Регистриране на нов пациент." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewPatient,
});

const schema = z.object({
  first_name: z.string().trim().min(2, "Въведете име").max(300),
  middle_name: z.string().trim().max(300),
  last_name: z.string().trim().min(2, "Въведете фамилия").max(300),
  egn: z.string().refine(isValidEgn, "Невалидно ЕГН"),
  phone: z.string().trim().max(300),
  city: z.string().trim().min(2).max(300),
  address: z.string().trim().max(2000),
  blood_type: z.string().max(10),
  allergies: z.string().trim().max(2000),
  gp: z.string().trim().max(300),
  school_name: z.string().trim().max(500),
  school_location: z.string().trim().max(500),
  grade: z.string().trim().max(300),
});

function NewPatient() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [insured, setInsured] = useState(true);
  const [student, setStudent] = useState(false);
  const [f, setF] = useState({
    first_name: "", middle_name: "", last_name: "", egn: "", phone: "+359 ", city: "Балчик", address: "",
    blood_type: "—", allergies: "Не съобщава", gp: "", school_name: "", school_location: "", grade: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const info = parseEgn(f.egn);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success || !info) { toast.error(parsed.error?.issues[0]?.message ?? "Невалидно ЕГН"); return; }
    setBusy(true);
    const d = parsed.data;
    const { data, error } = await supabase.from("patients").insert({
      ...d, birth_date: info.birthDate, sex: info.sex, insured, is_student: student,
      school_name: student ? d.school_name : null, school_location: student ? d.school_location : null,
      grade: student ? d.grade : null,
    }).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "Пациент с това ЕГН вече съществува" : error.message); return; }
    await qc.invalidateQueries({ queryKey: ["patients"] });
    toast.success("Пациентът е регистриран");
    navigate({ to: "/patients/$id/visit", params: { id: data.id } });
  }

  return (
    <AppShell title="нов пациент">
      <Toaster position="top-center" />
      <form onSubmit={save} className="mx-auto max-w-5xl space-y-3 p-4">
        <fieldset className="win-fieldset grid gap-3 sm:grid-cols-3">
          <legend>Идентификация</legend>
          <label className="win-label">Име<input value={f.first_name} onChange={set("first_name")} className="win-input" required /></label>
          <label className="win-label">Презиме<input value={f.middle_name} onChange={set("middle_name")} className="win-input" /></label>
          <label className="win-label">Фамилия<input value={f.last_name} onChange={set("last_name")} className="win-input" required /></label>
          <label className="win-label">ЕГН<input value={f.egn} maxLength={10} inputMode="numeric" onChange={set("egn")} className="win-input tabular-nums" required /></label>
          <div className="win-label sm:col-span-2">От ЕГН
            <div className="win-input bg-secondary">
              {info && isValidEgn(f.egn) ? `Роден(а) ${formatDateBg(info.birthDate)} · ${calcAge(info.birthDate)} г. · ${info.sex}` : f.egn.length === 10 ? "Невалидно ЕГН" : "—"}
            </div>
          </div>
        </fieldset>
        <fieldset className="win-fieldset grid gap-3 sm:grid-cols-3">
          <legend>Контакти и здравни данни</legend>
          <label className="win-label">Телефон<input value={f.phone} onChange={set("phone")} className="win-input" /></label>
          <label className="win-label">Град<input value={f.city} onChange={set("city")} className="win-input" /></label>
          <label className="win-label">Адрес<input value={f.address} onChange={set("address")} className="win-input" /></label>
          <label className="win-label">Кръвна група
            <select value={f.blood_type} onChange={set("blood_type")} className="win-input">
              {["—", "0 Rh+", "0 Rh−", "A Rh+", "A Rh−", "B Rh+", "B Rh−", "AB Rh+", "AB Rh−"].map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
          <label className="win-label">Алергии<input value={f.allergies} onChange={set("allergies")} className="win-input" /></label>
          <label className="win-label">Личен лекар<input value={f.gp} onChange={set("gp")} className="win-input" /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={insured} onChange={(e) => setInsured(e.target.checked)} /> Здравноосигурен</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={student} onChange={(e) => setStudent(e.target.checked)} /> Учащ</label>
        </fieldset>
        {student && (
          <fieldset className="win-fieldset grid gap-3 sm:grid-cols-3">
            <legend>Учебно заведение</legend>
            <label className="win-label">Заведение<input value={f.school_name} onChange={set("school_name")} className="win-input" /></label>
            <label className="win-label">Локация<input value={f.school_location} onChange={set("school_location")} className="win-input" /></label>
            <label className="win-label">Клас / курс<input value={f.grade} onChange={set("grade")} className="win-input" /></label>
          </fieldset>
        )}
        <div className="flex justify-end gap-2">
          <Link to="/registry" className="win-btn">Отказ</Link>
          <button disabled={busy} className="win-btn-primary">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Запиши и към преглед
          </button>
        </div>
      </form>
    </AppShell>
  );
}
