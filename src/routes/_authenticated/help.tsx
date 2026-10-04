import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hospital/AppShell";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({ meta: [{ title: "Помощ · МБАЛ Балчик" }, { name: "description", content: "Ръководство за работа със системата." },
    { property: "og:title", content: "Помощ · МБАЛ Балчик" }, { property: "og:description", content: "Ръководство за болничната система." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => (
    <AppShell title="Помощ">
      <div className="max-w-3xl space-y-3 p-4 text-sm">
        <h1 className="text-lg font-bold">Ръководство за работа</h1>
        <p><b>Програма</b> – регистър, нов пациент, модули и изход.</p>
        <p><b>База данни</b> – всички модули: отделения, параклиника, аптека, НЗОК/НЗИС/НОИ, финанси.</p>
        <p><b>Команди</b> – обновяване, печат, отчети.</p>
        <p><b>Прозорец</b> – цял екран и скриване на менюто вляво.</p>
        <p>Във всеки модул: натиснете ред за редакция, попълнете формата вдясно и „Запиши“. Бутонът за изтегляне дава CSV за Excel, а при НЗОК/НЗИС/НОИ – XML отчет.</p>
        <p className="text-muted-foreground">Директната връзка с НЗИС, НОИ и СЕСПА изисква сертификат и договор с институциите – дотогава документите се водят тук и се изтеглят като XML.</p>
        <p>МБАЛ – Балчик · версия 2.5.0</p>
      </div>
    </AppShell>
  ),
});
