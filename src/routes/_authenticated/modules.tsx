import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/hospital/AppShell";
import { GROUPS, MODULES, allModulesQuery } from "@/lib/modules";
import { patientsQuery } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/modules")({
  head: () => ({ meta: [{ title: "Модули и справки · МБАЛ Балчик" }, { name: "description", content: "Всички модули и справки за ръководството." },
    { property: "og:title", content: "Модули и справки · МБАЛ Балчик" }, { property: "og:description", content: "Справки за ръководството на МБАЛ Балчик." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ModulesPage,
});

function ModulesPage() {
  const { data: rows = [] } = useQuery(allModulesQuery);
  const { data: patients = [] } = useQuery(patientsQuery);
  const count = (k: string) => rows.filter((r) => r.module === k).length;
  const sum = (k: string, st?: string) => rows.filter((r) => r.module === k && (!st || r.status === st))
    .reduce((s, r) => s + (Number(r.data.amount ?? r.data.price) || 0), 0);
  const busyBeds = rows.filter((r) => r.module === "beds" && r.status === "Заето").length;
  const stats = [
    ["Пациенти", patients.length], ["Заети легла", `${busyBeds} / ${count("beds")}`],
    ["Активни хоспитализации", rows.filter((r) => r.module === "hospitalizations" && r.status === "Активна").length],
    ["Чакащи изследвания", rows.filter((r) => ["lab", "micro", "patho", "imaging"].includes(r.module) && r.status !== "Готово").length],
    ["Фактурирано", `${sum("invoices").toFixed(2)} лв.`], ["Неплатени фактури", `${sum("invoices", "Неплатена").toFixed(2)} лв.`],
    ["Каса приход", `${rows.filter((r) => r.module === "cashbox" && r.data.type === "Приход").reduce((s, r) => s + (Number(r.data.amount) || 0), 0).toFixed(2)} лв.`],
    ["Платен прием", `${sum("paid", "Платено").toFixed(2)} лв.`],
  ];
  return (
    <AppShell title="Модули и справки">
      <div className="space-y-3 p-3">
        <fieldset className="win-fieldset bg-card">
          <legend className="px-1 text-sm font-semibold">Справка за ръководството</legend>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {stats.map(([l, v]) => <div key={l as string} className="border border-border bg-secondary p-2"><div className="text-xs text-muted-foreground">{l}</div><div className="text-lg font-bold">{v}</div></div>)}
          </div>
        </fieldset>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {GROUPS.map((g) => (
            <fieldset key={g} className="win-fieldset bg-card">
              <legend className="px-1 text-sm font-semibold">{g}</legend>
              {g === "Пациенти" && <>
                <Link to="/registry" className="tree-item">Пациентско досие (регистър)</Link>
                <Link to="/patients/new" className="tree-item">Ново досие</Link>
              </>}
              {MODULES.filter((m) => m.group === g).map((m) => (
                <Link key={m.key} to="/m/$module" params={{ module: m.key }} className="tree-item justify-between">
                  <span>{m.title}</span><span className="text-xs text-muted-foreground">{count(m.key)}</span>
                </Link>
              ))}
            </fieldset>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
