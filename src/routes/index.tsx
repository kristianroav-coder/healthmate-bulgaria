import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Users, GraduationCap, CalendarClock, ShieldAlert, X } from "lucide-react";
import logo from "@/assets/logo-nmtb.png";
import { PATIENTS, REGISTRY_STATS, searchPatients, formatDateBg, type Patient } from "@/lib/patients";
import { buildDocument, DOCUMENT_LABELS, type DocumentKind } from "@/lib/documents";
import { PatientDetail } from "@/components/hospital/PatientDetail";
import { WordViewer } from "@/components/hospital/WordViewer";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "НМТБ · Болнична информационна система — пациентски регистър" },
      {
        name: "description",
        content:
          "Болнична информационна система: търсене по ЕГН или име, пациентски картони с тегло и ръст от последното посещение, учебни заведения и издаване на документи във формат Word.",
      },
      { property: "og:title", content: "НМТБ · Болнична информационна система" },
      {
        property: "og:description",
        content:
          "Пациентски регистър с търсене по ЕГН и име, медицински показатели и печат на документи в Word.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="panel flex items-center gap-3 px-4 py-3">
      <div className="rounded-md bg-secondary p-2 text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-xl font-bold tabular-nums leading-none">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function Index() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(PATIENTS[0]!.id);
  const [docKind, setDocKind] = useState<DocumentKind | null>(null);

  const results = useMemo(() => searchPatients(query), [query]);
  const selected: Patient = useMemo(
    () => PATIENTS.find((p) => p.id === selectedId) ?? results[0] ?? PATIENTS[0]!,
    [selectedId, results],
  );

  const doc = docKind ? buildDocument(selected, docKind) : null;

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />

      <header className="app-header text-primary-foreground">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-5 py-4">
          <div className="rounded-md bg-white p-1.5">
            <img src={logo} alt="Лого на болницата" className="h-11 w-auto" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight sm:text-lg">
              Национална многопрофилна транспортна болница „Цар Борис III“
            </h1>
            <p className="text-xs text-primary-foreground/75">
              Болнична информационна система · Регистратура и пациентски досиета
            </p>
          </div>
          <div className="ml-auto hidden text-right text-xs text-primary-foreground/80 sm:block">
            <div>Оператор: рег. Мария Стоянова</div>
            <div>Смяна: 08:00 – 20:00 ч.</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-6">
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Регистрирани пациенти" value={REGISTRY_STATS.total} />
          <StatCard icon={GraduationCap} label="Учащи" value={REGISTRY_STATS.students} />
          <StatCard icon={CalendarClock} label="Посещения последните 30 дни" value={REGISTRY_STATS.visitsLast30} />
          <StatCard icon={ShieldAlert} label="Без активно осигуряване" value={REGISTRY_STATS.uninsured} />
        </div>

        <div className="panel mb-5 p-4">
          <label htmlFor="search" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Търсене на пациент по ЕГН, име, телефон, град или учебно заведение
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="напр. 0442104423 или Георги Иванов"
              className="w-full rounded-md border border-input bg-card py-3 pl-11 pr-10 text-base outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-ring/25"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Изчисти търсенето"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Намерени резултати: <strong className="tabular-nums">{results.length}</strong> от {PATIENTS.length}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="panel flex max-h-[76vh] flex-col overflow-hidden">
            <div className="border-b border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-primary">
              Пациентски регистър
            </div>
            <div className="flex-1 overflow-y-auto">
              {results.length === 0 && (
                <p className="p-5 text-sm text-muted-foreground">Няма намерени пациенти по зададените критерии.</p>
              )}
              {results.map((p) => {
                const active = p.id === selected.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`block w-full border-b border-border/70 px-4 py-3 text-left transition-colors ${
                      active ? "bg-secondary" : "hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{p.fullName}</span>
                      {p.isStudent && <GraduationCap className="size-4 shrink-0 text-accent" />}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="tabular-nums">ЕГН {p.egn}</span>
                      <span>{p.age} г.</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Посл. посещение: {formatDateBg(p.lastVisit.date)}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section>
            <PatientDetail patient={selected} onOpenDocument={(k) => setDocKind(k)} />
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Демонстрационна система. Всички пациентски данни са генерирани и не се отнасят до реални лица.
          Документите се отварят в Word-изглед преди печат или изтегляне —{" "}
          {Object.values(DOCUMENT_LABELS).join(", ")}.
        </p>
      </main>

      {doc && docKind && (
        <WordViewer doc={doc} kind={docKind} onKindChange={setDocKind} onClose={() => setDocKind(null)} />
      )}
    </div>
  );
}
