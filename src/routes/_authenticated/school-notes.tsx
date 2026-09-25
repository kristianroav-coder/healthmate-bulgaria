import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileText, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/hospital/AppShell";
import { WordViewer } from "@/components/hospital/WordViewer";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { meQuery, patientsQuery } from "@/lib/db";
import type { HospitalDocument } from "@/lib/documents";
import type { Patient } from "@/lib/patients";
import { buildSchoolNote, PE_GROUPS, SCHOOL_LIST } from "@/lib/school-notes";

export const Route = createFileRoute("/_authenticated/school-notes")({
  head: () => ({
    meta: [
      { title: "Ученически бележки · МБАЛ Балчик" },
      { name: "description", content: "Профилактични медицински бележки за ученици под 18 години." },
      { property: "og:title", content: "Ученически бележки · МБАЛ Балчик" },
      { property: "og:description", content: "Профилактични бележки за училище." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(patientsQuery),
  component: SchoolNotes,
});

function SchoolNotes() {
  const { data: patients } = useSuspenseQuery(patientsQuery);
  const { data: me } = useQuery(meQuery);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Patient | null>(null);
  const [doc, setDoc] = useState<HospitalDocument | null>(null);

  const pupils = useMemo(() => {
    const s = q.trim().toLowerCase();
    return patients
      .filter((p) => p.age < 18)
      .filter((p) => !s || p.egn.includes(s) || p.fullName.toLowerCase().includes(s));
  }, [patients, q]);

  return (
    <AppShell title="ученически бележки">
      <Toaster position="top-center" />
      <div className="grid gap-3 p-3 lg:grid-cols-[360px_1fr]">
        <div className="panel flex min-h-0 flex-col">
          <div className="flex items-center gap-2 border-b border-border p-2">
            <Search className="size-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Име или ЕГН на ученик…" className="win-input flex-1" />
          </div>
          <div className="px-2 py-1 text-xs text-muted-foreground">Ученици под 18 г.: {pupils.length}</div>
          <div className="max-h-[70vh] overflow-auto">
            {pupils.map((p) => (
              <button key={p.dbId} onClick={() => setSel(p)}
                className={`block w-full border-b border-border px-2 py-1.5 text-left text-sm hover:bg-secondary ${sel?.dbId === p.dbId ? "bg-secondary font-semibold" : ""}`}>
                {p.fullName}
                <div className="text-xs text-muted-foreground">{p.egn} · {p.age} г. · {p.schoolName ?? "—"}</div>
              </button>
            ))}
          </div>
        </div>
        {sel ? (
          <NoteForm key={sel.dbId} p={sel} doctorDefault={me?.full_name ?? ""} userId={me?.id ?? null} onDone={setDoc} />
        ) : (
          <div className="panel p-6 text-sm text-muted-foreground">Изберете ученик от списъка вляво.</div>
        )}
      </div>
      {doc && <WordViewer doc={doc} onClose={() => setDoc(null)} />}
    </AppShell>
  );
}

function NoteForm({ p, doctorDefault, userId, onDone }: { p: Patient; doctorDefault: string; userId: string | null; onDone: (d: HospitalDocument) => void }) {
  const v = p.visits[0];
  const knownIdx = SCHOOL_LIST.findIndex((s) => s.name === p.schoolName);
  const [f, setF] = useState({
    note_date: new Date().toISOString().slice(0, 10),
    school_name: p.schoolName ?? "", school_location: p.schoolLocation ?? "", grade: p.grade ?? "",
    weight_kg: v?.weightKg ? String(v.weightKg) : "", height_cm: v?.heightCm ? String(v.heightCm) : "",
    diseases: "", allergies: p.allergies === "Не съобщава" ? "" : p.allergies, vaccinations: "Съгласно имунизационния календар",
    pe_group: PE_GROUPS[0]!, conclusion: "Ученикът е клинично здрав и може да посещава учебни занятия, включително по физическо възпитание.",
    doctor: doctorDefault,
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const num = (s: string) => (s.trim() ? Number(s.replace(",", ".")) || null : null);

  function pickSchool(e: React.ChangeEvent<HTMLSelectElement>) {
    const s = SCHOOL_LIST[Number(e.target.value)];
    if (s) setF({ ...f, school_name: s.name, school_location: s.location });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.doctor.trim()) { toast.error("Въведете лекар"); return; }
    setBusy(true);
    const row = { ...f, weight_kg: num(f.weight_kg), height_cm: num(f.height_cm) };
    const { data, error } = await supabase.from("school_notes")
      .insert({ ...row, patient_id: p.dbId!, created_by: userId }).select("id").single();
    setBusy(false);
    if (error) { toast.error("Грешка при запис: " + error.message); return; }
    toast.success("Бележката е записана");
    onDone(buildSchoolNote(p, { ...row, number: `УБ-${data.id.slice(0, 6).toUpperCase()}/${f.note_date.slice(0, 4)}` }));
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="panel flex flex-wrap items-center justify-between gap-2 p-3">
        <div>
          <div className="text-xs text-muted-foreground">Профилактична бележка за училище</div>
          <div className="text-lg font-bold">{p.fullName}</div>
          <div className="text-xs text-muted-foreground">ЕГН {p.egn} · {p.age} г.</div>
        </div>
        <button disabled={busy} className="win-btn-primary">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />} Запиши и отвори в Word
        </button>
      </div>
      <fieldset className="win-fieldset grid gap-3 sm:grid-cols-3">
        <legend>Училище</legend>
        <label className="win-label sm:col-span-3">Избери от списъка
          <select defaultValue={knownIdx >= 0 ? knownIdx : ""} onChange={pickSchool} className="win-input">
            <option value="" disabled>— изберете училище —</option>
            {SCHOOL_LIST.map((s, i) => <option key={i} value={i}>{s.name} — {s.location}</option>)}
          </select>
        </label>
        <label className="win-label">Училище<input value={f.school_name} onChange={set("school_name")} className="win-input" /></label>
        <label className="win-label">Местоположение<input value={f.school_location} onChange={set("school_location")} className="win-input" /></label>
        <label className="win-label">Клас<input value={f.grade} onChange={set("grade")} className="win-input" placeholder="напр. 5 клас" /></label>
      </fieldset>
      <fieldset className="win-fieldset grid gap-3 sm:grid-cols-4">
        <legend>Преглед</legend>
        <label className="win-label">Дата<input type="date" value={f.note_date} onChange={set("note_date")} className="win-input" /></label>
        <label className="win-label">Тегло (кг)<input inputMode="decimal" value={f.weight_kg} onChange={set("weight_kg")} className="win-input" /></label>
        <label className="win-label">Ръст (см)<input inputMode="decimal" value={f.height_cm} onChange={set("height_cm")} className="win-input" /></label>
        <label className="win-label">Физическо
          <select value={f.pe_group} onChange={set("pe_group")} className="win-input">{PE_GROUPS.map((g) => <option key={g}>{g}</option>)}</select>
        </label>
        <label className="win-label sm:col-span-2">Заболявания<textarea rows={3} value={f.diseases} onChange={set("diseases")} className="win-input" placeholder="Хронични / прекарани заболявания…" /></label>
        <label className="win-label sm:col-span-2">Алергии<textarea rows={3} value={f.allergies} onChange={set("allergies")} className="win-input" placeholder="Не съобщава" /></label>
        <label className="win-label sm:col-span-4">Имунизации<input value={f.vaccinations} onChange={set("vaccinations")} className="win-input" /></label>
        <label className="win-label sm:col-span-4">Заключение<textarea rows={3} value={f.conclusion} onChange={set("conclusion")} className="win-input" /></label>
        <label className="win-label sm:col-span-2">Лекар<input value={f.doctor} onChange={set("doctor")} className="win-input" /></label>
      </fieldset>
    </form>
  );
}
