import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FieldType = "text" | "number" | "date" | "select" | "textarea" | "patient";
export type Field = { name: string; label: string; type?: FieldType; options?: string[]; required?: boolean };
export type ModuleDef = {
  key: string; group: string; title: string; description: string;
  fields: Field[]; statuses: string[]; titleField: string; export?: "xml";
};

const LABS = ["Клинична лаборатория", "Микробиология", "Патоанатомия", "Образна диагностика (PACS)"];
const WARDS = ["Вътрешно отделение", "Хирургия", "Педиатрия", "АГ отделение", "Неврология", "ОАИЛ", "Спешно отделение"];
const P: Field = { name: "patient", label: "Пациент", type: "patient" };
const labFields = (lab: string): Field[] => [
  P, { name: "test", label: "Изследване", required: true }, { name: "lab", label: "Звено", type: "select", options: [lab] },
  { name: "ward", label: "Заявено от", type: "select", options: WARDS }, { name: "date", label: "Дата", type: "date" },
  { name: "priority", label: "Приоритет", type: "select", options: ["Рутинно", "Спешно"] },
  { name: "result", label: "Резултат", type: "textarea" },
];
const LAB_ST = ["Заявено", "В процес", "Готово", "Отказано"];

export const GROUPS = [
  "Пациенти", "Клиники и отделения", "Параклиника и лаборатории", "Аптека и склад",
  "НЗОК / НЗИС / НОИ", "Финанси и каса",
];

export const MODULES: ModuleDef[] = [
  { key: "hospitalizations", group: "Пациенти", title: "Хоспитализации", description: "История на хоспитализациите и престоя.", titleField: "diagnosis",
    statuses: ["Активна", "Изписан", "Преведен", "Починал"],
    fields: [P, { name: "ward", label: "Отделение", type: "select", options: WARDS }, { name: "admitted", label: "Приет на", type: "date" },
      { name: "discharged", label: "Изписан на", type: "date" }, { name: "diagnosis", label: "Диагноза", required: true },
      { name: "pathway", label: "Клинична пътека №" }, { name: "doctor", label: "Лекуващ лекар" }] },
  { key: "insurance", group: "Пациенти", title: "Здравноосигурителен статус", description: "Проверка и история на осигурителния статус.", titleField: "source",
    statuses: ["Осигурен", "Неосигурен", "Прекъснати права"],
    fields: [P, { name: "date", label: "Дата на проверка", type: "date" }, { name: "source", label: "Източник", type: "select", options: ["НЗОК", "НАП", "Ръчна проверка"] },
      { name: "notes", label: "Бележки", type: "textarea" }] },

  { key: "beds", group: "Клиники и отделения", title: "Легла", description: "Управление на леглата по отделения.", titleField: "bed",
    statuses: ["Свободно", "Заето", "Почистване", "Ремонт"],
    fields: [{ name: "bed", label: "Легло №", required: true }, { name: "ward", label: "Отделение", type: "select", options: WARDS },
      { name: "room", label: "Стая" }, { name: "type", label: "Тип", type: "select", options: ["Стандартно", "Интензивно", "Детско", "Изолатор"] }, P] },
  { key: "movements", group: "Клиники и отделения", title: "Движение на пациенти", description: "Прием, преместване и изписване.", titleField: "type",
    statuses: ["Изпълнено", "Планирано", "Отказано"],
    fields: [P, { name: "type", label: "Движение", type: "select", options: ["Прием", "Преместване", "Изписване"], required: true },
      { name: "from", label: "От отделение", type: "select", options: ["—", ...WARDS] }, { name: "to", label: "Към отделение", type: "select", options: ["—", ...WARDS] },
      { name: "date", label: "Дата", type: "date" }, { name: "doctor", label: "Лекар" }] },
  { key: "ehr", group: "Клиники и отделения", title: "История на заболяването", description: "Електронна история на болестта и декурзуси.", titleField: "diagnosis",
    statuses: ["Отворена", "Приключена"],
    fields: [P, { name: "ward", label: "Отделение", type: "select", options: WARDS }, { name: "diagnosis", label: "Диагноза", required: true },
      { name: "icd", label: "МКБ-10" }, { name: "date", label: "Дата", type: "date" }, { name: "decursus", label: "Декурзус / ход на заболяването", type: "textarea" }] },
  { key: "therapies", group: "Клиники и отделения", title: "Назначени терапии", description: "Лекарства и процедури, назначени на пациенти.", titleField: "medication",
    statuses: ["Активна", "Спряна", "Завършена"],
    fields: [P, { name: "medication", label: "Медикамент / процедура", required: true }, { name: "dose", label: "Доза" },
      { name: "frequency", label: "Честота" }, { name: "start", label: "От", type: "date" }, { name: "end", label: "До", type: "date" }, { name: "doctor", label: "Назначил" }] },
  { key: "schedules", group: "Клиники и отделения", title: "Графици и дежурства", description: "Графици за лекари, сестри и дежурства.", titleField: "employee",
    statuses: ["Планирано", "Потвърдено", "Отменено"],
    fields: [{ name: "employee", label: "Служител", required: true }, { name: "role", label: "Длъжност", type: "select", options: ["Лекар", "Медицинска сестра", "Санитар", "Акушерка"] },
      { name: "date", label: "Дата", type: "date" }, { name: "shift", label: "Смяна", type: "select", options: ["Дневна 08–20", "Нощна 20–08", "Дежурство 24ч"] },
      { name: "ward", label: "Отделение", type: "select", options: WARDS }] },

  { key: "lab", group: "Параклиника и лаборатории", title: "Клинична лаборатория", description: "Заявки и резултати.", titleField: "test", statuses: LAB_ST, fields: labFields(LABS[0]!) },
  { key: "micro", group: "Параклиника и лаборатории", title: "Микробиология", description: "Посявки и антибиограми.", titleField: "test", statuses: LAB_ST, fields: labFields(LABS[1]!) },
  { key: "patho", group: "Параклиника и лаборатории", title: "Патоанатомия", description: "Хистология и цитология.", titleField: "test", statuses: LAB_ST, fields: labFields(LABS[2]!) },
  { key: "imaging", group: "Параклиника и лаборатории", title: "Образна диагностика (PACS)", description: "Рентген, КТ, ЯМР, ехография.", titleField: "test", statuses: LAB_ST, fields: labFields(LABS[3]!) },

  { key: "stock", group: "Аптека и склад", title: "Наличности", description: "Лекарства, консумативи и медицински изделия.", titleField: "item",
    statuses: ["Налично", "Под минимум", "Изчерпано", "Изтекъл срок"],
    fields: [{ name: "item", label: "Артикул", required: true }, { name: "type", label: "Вид", type: "select", options: ["Лекарство", "Консуматив", "Медицинско изделие"] },
      { name: "batch", label: "Партида" }, { name: "expiry", label: "Годен до", type: "date" }, { name: "qty", label: "Количество", type: "number" },
      { name: "unit", label: "Мярка", type: "select", options: ["бр.", "оп.", "мл", "амп.", "фл."] }, { name: "min", label: "Минимум", type: "number" }, { name: "sespa", label: "Код СЕСПА" }] },
  { key: "dispensing", group: "Аптека и склад", title: "Изписване на медикаменти", description: "Към пациенти или отделения.", titleField: "item",
    statuses: ["Заявено", "Изписано", "Отказано"],
    fields: [P, { name: "ward", label: "Отделение", type: "select", options: WARDS }, { name: "item", label: "Артикул", required: true },
      { name: "qty", label: "Количество", type: "number" }, { name: "date", label: "Дата", type: "date" }] },
  { key: "sespa", group: "Аптека и склад", title: "СЕСПА проследяване", description: "Верификация и деактивиране на уникални идентификатори.", titleField: "product",
    statuses: ["Чака", "Верифициран", "Деактивиран", "Грешка"],
    fields: [{ name: "product", label: "Продукт", required: true }, { name: "gtin", label: "GTIN" }, { name: "serial", label: "Сериен №" },
      { name: "batch", label: "Партида" }, { name: "action", label: "Операция", type: "select", options: ["Верификация", "Деактивиране", "Реактивиране"] }] },

  { key: "nzok", group: "НЗОК / НЗИС / НОИ", title: "НЗОК отчети (XML)", description: "Клинични пътеки и процедури за отчет.", titleField: "pathway", export: "xml",
    statuses: ["Чернова", "Изпратен", "Приет", "Отхвърлен"],
    fields: [P, { name: "period", label: "Период (ГГГГ-ММ)" }, { name: "pathway", label: "КП / процедура №", required: true },
      { name: "procedure", label: "Наименование" }, { name: "amount", label: "Сума (лв.)", type: "number" }] },
  { key: "nzis", group: "НЗОК / НЗИС / НОИ", title: "НЗИС рецепти и направления", description: "Електронни рецепти, направления и КЕП.", titleField: "content", export: "xml",
    statuses: ["Чернова", "Подписан с КЕП", "Изпратен", "Изпълнен"],
    fields: [P, { name: "type", label: "Документ", type: "select", options: ["е-Рецепта", "е-Направление", "е-Имунизация"] },
      { name: "content", label: "Медикамент / изследване", required: true }, { name: "nrn", label: "НРН №" }, { name: "date", label: "Дата", type: "date" }] },
  { key: "noi", group: "НЗОК / НЗИС / НОИ", title: "НОИ болнични листове", description: "Електронни болнични листове.", titleField: "number", export: "xml",
    statuses: ["Чернова", "Изпратен", "Приет"],
    fields: [P, { name: "number", label: "Болничен лист №", required: true }, { name: "from", label: "От", type: "date" },
      { name: "to", label: "До", type: "date" }, { name: "days", label: "Дни", type: "number" }, { name: "icd", label: "МКБ-10" }] },

  { key: "invoices", group: "Финанси и каса", title: "Фактури", description: "Издаване и проследяване на фактури.", titleField: "number",
    statuses: ["Неплатена", "Платена", "Анулирана"],
    fields: [{ name: "number", label: "Фактура №", required: true }, { name: "client", label: "Получател" }, P,
      { name: "date", label: "Дата", type: "date" }, { name: "amount", label: "Сума без ДДС (лв.)", type: "number" },
      { name: "payment", label: "Плащане", type: "select", options: ["В брой", "Карта", "Банков превод"] }] },
  { key: "cashbox", group: "Финанси и каса", title: "Каса", description: "Приходи и разходи по касови апарати.", titleField: "description",
    statuses: ["Приключено", "Отворено"],
    fields: [{ name: "type", label: "Вид", type: "select", options: ["Приход", "Разход"] }, { name: "description", label: "Основание", required: true },
      { name: "amount", label: "Сума (лв.)", type: "number" }, { name: "date", label: "Дата", type: "date" }, { name: "register", label: "Касов апарат", type: "select", options: ["Каса 1 – Регистратура", "Каса 2 – Спешно"] }] },
  { key: "paid", group: "Финанси и каса", title: "Платен прием", description: "Платени прегледи и услуги.", titleField: "service",
    statuses: ["Чака плащане", "Платено", "Отказано"],
    fields: [P, { name: "service", label: "Услуга", required: true }, { name: "price", label: "Цена (лв.)", type: "number" }, { name: "date", label: "Дата", type: "date" }] },
];

export const getModule = (key: string) => MODULES.find((m) => m.key === key);

export type ModuleRecord = {
  id: string; module: string; title: string; status: string; patient_id: string | null;
  data: Record<string, string>; created_at: string; updated_at: string;
};

const db = supabase as unknown as { from: (t: string) => any };

export const moduleQuery = (key: string) => queryOptions({
  queryKey: ["module", key],
  queryFn: async (): Promise<ModuleRecord[]> => {
    const { data, error } = await db.from("module_records").select("*").eq("module", key).order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const allModulesQuery = queryOptions({
  queryKey: ["module", "__all"],
  queryFn: async (): Promise<ModuleRecord[]> => {
    const { data, error } = await db.from("module_records").select("*");
    if (error) throw error;
    return data ?? [];
  },
});

export async function saveRecord(def: ModuleDef, id: string | null, status: string, patientId: string | null, data: Record<string, string>) {
  const title = data[def.titleField] || def.title;
  if (id) {
    const { error } = await db.from("module_records").update({ status, patient_id: patientId, data, title }).eq("id", id);
    if (error) throw error;
  } else {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Не сте влезли в системата.");
    const { error } = await db.from("module_records").insert({ module: def.key, status, patient_id: patientId, data, title, created_by: u.user.id });
    if (error) throw error;
  }
}

export async function deleteRecord(id: string) {
  const { error } = await db.from("module_records").delete().eq("id", id);
  if (error) throw error;
}

const esc = (s: string) => String(s ?? "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);

export function toXml(def: ModuleDef, rows: ModuleRecord[], patientName: (id: string | null) => string) {
  const items = rows.map((r) => {
    const f = def.fields.filter((x) => x.type !== "patient").map((x) => `    <${x.name}>${esc(r.data[x.name] ?? "")}</${x.name}>`).join("\n");
    return `  <record id="${r.id}" status="${esc(r.status)}">\n    <patient>${esc(patientName(r.patient_id))}</patient>\n${f}\n  </record>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<report institution="МБАЛ – Балчик" module="${def.key}" generated="${new Date().toISOString()}">\n${items}\n</report>\n`;
}

export function toCsv(def: ModuleDef, rows: ModuleRecord[], patientName: (id: string | null) => string) {
  const q = (s: string) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const head = [...def.fields.map((f) => f.label), "Статус"].map(q).join(";");
  const body = rows.map((r) => [...def.fields.map((f) => (f.type === "patient" ? patientName(r.patient_id) : r.data[f.name] ?? "")), r.status].map(q).join(";"));
  return "\uFEFF" + [head, ...body].join("\n");
}

export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
