import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ClipboardPlus, GraduationCap, Search, X } from "lucide-react";
import { AppShell } from "@/components/hospital/AppShell";
import { PatientDetail } from "@/components/hospital/PatientDetail";
import { WordViewer } from "@/components/hospital/WordViewer";
import { patientsQuery } from "@/lib/db";
import { formatDateBg, searchPatients } from "@/lib/patients";
import { buildDocument, type DocumentKind } from "@/lib/documents";

export const Route = createFileRoute("/_authenticated/registry")({
  head: () => ({
    meta: [
      { title: "Пациентски регистър · МБАЛ Балчик" },
      { name: "description", content: "Търсене на пациенти по ЕГН и име, досиета, прегледи и документи." },
      { property: "og:title", content: "Пациентски регистър · МБАЛ Балчик" },
      { property: "og:description", content: "Търсене по ЕГН и име, досиета и документи в Word." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(patientsQuery),
  component: Registry,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">Грешка: {error.message}</div>,
});

function Registry() {
  const { data: patients } = useSuspenseQuery(patientsQuery);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(patients[0]?.id ?? "");
  const [docKind, setDocKind] = useState<DocumentKind | null>(null);

  const results = useMemo(() => searchPatients(query, patients), [query, patients]);
  const selected = patients.find((p) => p.id === selectedId) ?? results[0] ?? patients[0];
  const doc = docKind && selected ? buildDocument(selected, docKind) : null;
  const now = Date.now();

  return (
    <AppShell
      title="регистър"
      toolbar={
        selected && (
          <Link to="/patients/$id/visit" params={{ id: selected.dbId! }} className="tool-btn gap-1 px-2 text-xs">
            <ClipboardPlus className="size-4 text-success" /> Нов преглед
          </Link>
        )
      }
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border bg-card px-2 py-1.5">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Търсене по ЕГН, име, телефон, град, училище…"
            className="win-input max-w-md py-1"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="tool-btn" aria-label="Изчисти"><X className="size-4" /></button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            Записи: <strong className="tabular-nums">{results.length}</strong> / {patients.length}
          </span>
        </div>

        <div className="h-[38vh] min-h-48 overflow-auto border-b-4 border-double border-border bg-card">
          <table className="grid-table">
            <thead>
              <tr>
                <th /><th>Код</th><th>Пациент</th><th>ЕГН</th><th>Възраст</th><th>Телефон</th><th>Град</th>
                <th>Посл. посещение</th><th>Отделение</th><th className="text-right">Тегло</th><th className="text-right">Ръст</th><th>Учащ</th>
              </tr>
            </thead>
            <tbody>
              {results.map((p) => {
                const days = (now - new Date(p.lastVisit.date).getTime()) / 86400000;
                const tone = !p.insured ? "row-danger" : days <= 30 ? "row-success" : p.isStudent ? "row-warning" : "";
                const active = p.id === selected?.id;
                return (
                  <tr key={p.id} onClick={() => setSelectedId(p.id)} className={`${tone} ${active ? "row-active" : ""}`}>
                    <td className="w-4 text-primary">{active ? "▸" : ""}</td>
                    <td className="tabular-nums">{p.id}</td>
                    <td className="font-medium">{p.fullName}</td>
                    <td className="tabular-nums">{p.egn}</td>
                    <td className="tabular-nums">{p.age}</td>
                    <td className="whitespace-nowrap tabular-nums">{p.phone}</td>
                    <td>{p.city}</td>
                    <td className="tabular-nums">{p.visits.length ? formatDateBg(p.lastVisit.date) : "—"}</td>
                    <td>{p.lastVisit.department}</td>
                    <td className="text-right tabular-nums">{p.lastVisit.weightKg ? p.lastVisit.weightKg.toFixed(1) : "—"}</td>
                    <td className="text-right tabular-nums">{p.lastVisit.heightCm || "—"}</td>
                    <td>{p.isStudent && <GraduationCap className="size-4 text-accent" />}</td>
                  </tr>
                );
              })}
              {results.length === 0 && (
                <tr><td colSpan={12} className="p-4 text-muted-foreground">Няма намерени пациенти.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex-1 p-3">
          {selected && <PatientDetail patient={selected} onOpenDocument={setDocKind} />}
        </div>
      </div>
      {doc && docKind && <WordViewer doc={doc} kind={docKind} onKindChange={setDocKind} onClose={() => setDocKind(null)} />}
    </AppShell>
  );
}
