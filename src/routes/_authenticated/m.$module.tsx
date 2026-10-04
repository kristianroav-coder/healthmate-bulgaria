import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileCode2, Plus, Save, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/hospital/AppShell";
import { patientsQuery, meQuery } from "@/lib/db";
import { getModule, moduleQuery, saveRecord, deleteRecord, toCsv, toXml, download, type ModuleRecord } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/m/$module")({
  beforeLoad: ({ params }) => { if (!getModule(params.module)) throw notFound(); },
  head: ({ params }) => {
    const t = `${getModule(params.module)?.title ?? "Модул"} · МБАЛ Балчик`;
    return { meta: [{ title: t }, { name: "description", content: "Модул на болничната информационна система." },
      { property: "og:title", content: t }, { property: "og:description", content: "Модул на МБАЛ Балчик." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  notFoundComponent: () => <div className="p-6">Модулът не съществува.</div>,
  component: ModulePage,
});

function rowClass(status: string, statuses: string[]) {
  const i = statuses.indexOf(status);
  return i === 0 ? "" : i === 1 ? "row-success" : i === 2 ? "row-warning" : "row-danger";
}

function ModulePage() {
  const { module } = Route.useParams();
  const def = getModule(module)!;
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery(moduleQuery(module));
  const { data: patients = [] } = useQuery(patientsQuery);
  const { data: me } = useQuery(meQuery);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ModuleRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [status, setStatus] = useState(def.statuses[0]!);
  const [patientId, setPatientId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [lastKey, setLastKey] = useState(module);

  if (lastKey !== module) { setLastKey(module); setEditing(null); setForm({}); setStatus(def.statuses[0]!); setPatientId(""); }

  const pName = (id: string | null) => patients.find((p) => p.dbId === id)?.fullName ?? "";
  const cols = def.fields.slice(0, 5);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => [r.status, pName(r.patient_id), ...Object.values(r.data)].join(" ").toLowerCase().includes(s));
  }, [rows, q, patients]);

  function startNew() { setEditing(null); setForm({}); setStatus(def.statuses[0]!); setPatientId(""); }
  function edit(r: ModuleRecord) { setEditing(r); setForm(r.data); setStatus(r.status); setPatientId(r.patient_id ?? ""); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const miss = def.fields.find((f) => f.required && !form[f.name]?.trim());
    if (miss) { toast.error(`Попълнете „${miss.label}“.`); return; }
    setBusy(true);
    try {
      await saveRecord(def, editing?.id ?? null, status, patientId || null, form);
      toast.success("Записано.");
      await qc.invalidateQueries({ queryKey: ["module"] });
      startNew();
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }

  async function remove() {
    if (!editing || !confirm("Изтриване на записа?")) return;
    try { await deleteRecord(editing.id); await qc.invalidateQueries({ queryKey: ["module"] }); startNew(); toast.success("Изтрито."); }
    catch (err) { toast.error((err as Error).message); }
  }

  const total = def.fields.some((f) => ["amount", "price"].includes(f.name))
    ? filtered.reduce((s, r) => s + (Number(r.data["amount"] ?? r.data["price"]) || 0), 0) : null;

  const toolbar = (
    <>
      <button className="tool-btn" title="Нов запис" onClick={startNew}><Plus className="size-4" /></button>
      <button className="tool-btn" title="Експорт CSV" onClick={() => download(`${def.key}.csv`, toCsv(def, filtered, pName), "text/csv")}><Download className="size-4" /></button>
      {def.export === "xml" && (
        <button className="tool-btn gap-1 px-2 text-xs" title="XML отчет" onClick={() => download(`${def.key}-${new Date().toISOString().slice(0, 10)}.xml`, toXml(def, filtered, pName), "application/xml")}>
          <FileCode2 className="size-4" /> XML
        </button>
      )}
    </>
  );

  return (
    <AppShell title={def.title} toolbar={toolbar}>
      <div className="flex h-full flex-col gap-2 p-2 lg:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-secondary px-2 py-1">
            <b className="text-sm">{def.group} › {def.title}</b>
            <span className="text-xs text-muted-foreground">{def.description}</span>
            <div className="ml-auto flex items-center gap-1">
              <Search className="size-4 text-muted-foreground" />
              <input className="win-input w-48" placeholder="Търсене…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="grid-table w-full">
              <thead><tr>{cols.map((c) => <th key={c.name}>{c.label}</th>)}<th>Статус</th></tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} onClick={() => edit(r)} className={`cursor-pointer ${editing?.id === r.id ? "row-active" : rowClass(r.status, def.statuses)}`}>
                    {cols.map((c) => <td key={c.name}>{c.type === "patient" ? pName(r.patient_id) : r.data[c.name]}</td>)}
                    <td>{r.status}</td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={cols.length + 1} className="p-4 text-center text-muted-foreground">Няма записи. Добавете първия от формата.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border bg-secondary px-2 py-1 text-xs">
            Записи: {filtered.length}{total !== null && <> · Общо: <b>{total.toFixed(2)} лв.</b></>}
          </div>
        </section>

        <form onSubmit={submit} className="win-fieldset w-full shrink-0 space-y-2 overflow-auto bg-card lg:w-80">
          <legend className="px-1 text-sm font-semibold">{editing ? "Редакция" : "Нов запис"}</legend>
          {def.fields.map((f) => (
            <label key={f.name} className="block">
              <span className="win-label">{f.label}{f.required && " *"}</span>
              {f.type === "patient" ? (
                <select className="win-input w-full" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                  <option value="">— няма —</option>
                  {patients.map((p) => <option key={p.dbId} value={p.dbId}>{p.fullName} ({p.egn})</option>)}
                </select>
              ) : f.type === "select" ? (
                <select className="win-input w-full" value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                  <option value="">—</option>
                  {f.options!.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : f.type === "textarea" ? (
                <textarea className="win-input min-h-20 w-full" value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
              ) : (
                <input className="win-input w-full" type={f.type ?? "text"} step="any" value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
              )}
            </label>
          ))}
          <label className="block">
            <span className="win-label">Статус</span>
            <select className="win-input w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
              {def.statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <div className="flex gap-2 pt-1">
            <button disabled={busy} className="win-btn win-btn-primary flex items-center gap-1"><Save className="size-4" /> Запиши</button>
            {editing && <button type="button" onClick={startNew} className="win-btn">Отказ</button>}
            {editing && me?.isAdmin && <button type="button" onClick={remove} className="win-btn ml-auto" title="Изтрий"><Trash2 className="size-4" /></button>}
          </div>
        </form>
      </div>
    </AppShell>
  );
}
