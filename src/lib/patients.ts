/**
 * Deterministic patient registry for the hospital information system.
 * Data is generated with a seeded PRNG so server and client render identically.
 */

export type Sex = "Мъж" | "Жена";

export interface Visit {
  date: string; // ISO yyyy-mm-dd
  department: string;
  doctor: string;
  diagnosis: string;
  icd: string;
  weightKg: number;
  heightCm: number;
  bloodPressure: string;
  pulse: number;
  temperature: number;
  notes: string;
}

export interface Patient {
  id: string;
  egn: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  sex: Sex;
  birthDate: string; // ISO
  age: number;
  phone: string;
  email: string;
  address: string;
  city: string;
  bloodType: string;
  allergies: string;
  insurer: string;
  insured: boolean;
  isStudent: boolean;
  schoolName?: string | undefined;
  schoolLocation?: string | undefined;
  grade?: string | undefined;
  gp: string;
  visits: Visit[];
  lastVisit: Visit;
}

/* ------------------------------------------------------------------ */
/* seeded PRNG                                                         */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* reference data                                                      */
/* ------------------------------------------------------------------ */

const MALE_FIRST = [
  "Георги", "Иван", "Димитър", "Николай", "Петър", "Христо", "Стефан", "Александър",
  "Мартин", "Васил", "Тодор", "Кирил", "Борис", "Емил", "Стоян", "Ангел", "Здравко",
  "Любомир", "Пламен", "Радослав", "Симеон", "Цветан", "Явор", "Огнян", "Калоян",
];
const FEMALE_FIRST = [
  "Мария", "Елена", "Иванка", "Десислава", "Габриела", "Виктория", "Николета",
  "Теодора", "Ралица", "Станислава", "Йоана", "Петя", "Радка", "Цветелина", "Даниела",
  "Емилия", "Веселина", "Магдалена", "Силвия", "Кристина", "Аделина", "Борислава",
  "Румяна", "Снежана", "Пенка",
];
const SURNAME_STEMS = [
  "Иванов", "Петров", "Димитров", "Георгиев", "Николов", "Христов", "Стоянов",
  "Тодоров", "Василев", "Атанасов", "Ангелов", "Марков", "Колев", "Костадинов",
  "Илиев", "Йорданов", "Симеонов", "Павлов", "Станев", "Радев",
  "Кирилов", "Борисов", "Захариев", "Цветков", "Митев", "Желязков", "Добрев",
  "Русев", "Влахов", "Панайотов",
];

const CITIES: { city: string; streets: string[] }[] = [
  { city: "София", streets: ["ул. Граф Игнатиев", "бул. Витоша", "ул. Раковски", "ж.к. Младост 3", "ж.к. Люлин 7"] },
  { city: "Пловдив", streets: ["ул. Капитан Райчо", "бул. Марица", "ж.к. Тракия", "ул. Иван Вазов"] },
  { city: "Варна", streets: ["бул. Сливница", "ул. Дунав", "ж.к. Чайка", "ул. Преслав"] },
  { city: "Бургас", streets: ["ул. Александровска", "бул. Демокрация", "ж.к. Славейков"] },
  { city: "Русе", streets: ["ул. Борисова", "бул. Цар Освободител", "ж.к. Дружба 3"] },
  { city: "Стара Загора", streets: ["ул. Цар Симеон Велики", "бул. Руски", "ж.к. Железник"] },
  { city: "Плевен", streets: ["ул. Данаил Попов", "бул. Христо Ботев", "ж.к. Сторгозия"] },
  { city: "Велико Търново", streets: ["ул. Стефан Стамболов", "бул. България", "ж.к. Бузлуджа"] },
  { city: "Благоевград", streets: ["ул. Тодор Александров", "ж.к. Еленово"] },
  { city: "Шумен", streets: ["бул. Славянски", "ул. Цар Освободител"] },
];

const SCHOOLS: { name: string; location: string; kind: "school" | "uni" }[] = [
  { name: "СУ „Св. Климент Охридски“ — Ректорат", location: "гр. София, бул. Цар Освободител 15", kind: "uni" },
  { name: "Технически университет — София", location: "гр. София, бул. Кл. Охридски 8", kind: "uni" },
  { name: "Медицински университет — Плевен", location: "гр. Плевен, ул. Св. Климент Охридски 1", kind: "uni" },
  { name: "УНСС", location: "гр. София, Студентски град, ул. 8-ми декември 19", kind: "uni" },
  { name: "ПУ „Паисий Хилендарски“", location: "гр. Пловдив, ул. Цар Асен 24", kind: "uni" },
  { name: "ИУ — Варна", location: "гр. Варна, бул. Княз Борис I 77", kind: "uni" },
  { name: "1-во СУ „Пенчо П. Славейков“", location: "гр. София, ул. Стара планина 11", kind: "school" },
  { name: "НПМГ „Акад. Л. Чакалов“", location: "гр. София, ул. Бигла 52", kind: "school" },
  { name: "ГПЧЕ „Йоан Екзарх“", location: "гр. Враца, ул. Никола Войводов 3", kind: "school" },
  { name: "ЕГ „Гео Милев“", location: "гр. Бургас, ул. Брегалница 2", kind: "school" },
  { name: "МГ „Д-р Петър Берон“", location: "гр. Варна, ул. Стефан Караджа 34", kind: "school" },
  { name: "ПГЕЕ „Мария Кюри“", location: "гр. Свищов, ул. Патриарх Евтимий 12", kind: "school" },
  { name: "СУ „Иван Вазов“", location: "гр. Стара Загора, ул. Ген. Столетов 96", kind: "school" },
  { name: "ОУ „Христо Ботев“", location: "гр. Русе, ул. Плиска 12", kind: "school" },
];

const DEPARTMENTS = [
  "Вътрешно отделение", "Кардиология", "Хирургия", "Ортопедия и травматология",
  "Неврология", "Педиатрия", "Ушно-носно-гърлени болести", "Очно отделение",
  "Спешно приемно отделение", "Образна диагностика", "Ендокринология", "Гастроентерология",
];

const DOCTORS = [
  "д-р Николай Петров", "д-р Мария Стоянова", "д-р Иван Георгиев", "д-р Радка Илиева",
  "д-р Стефан Колев", "д-р Веселина Тодорова", "д-р Петър Ангелов", "д-р Емилия Василева",
  "доц. д-р Христо Маринов", "д-р Калоян Димитров",
];

const DIAGNOSES: { icd: string; text: string }[] = [
  { icd: "J06.9", text: "Остра инфекция на горните дихателни пътища" },
  { icd: "I10", text: "Есенциална (първична) хипертония" },
  { icd: "E11.9", text: "Захарен диабет тип 2 без усложнения" },
  { icd: "K29.7", text: "Гастрит, неуточнен" },
  { icd: "M54.5", text: "Болки в кръста" },
  { icd: "S52.5", text: "Фрактура на дисталната част на радиуса" },
  { icd: "J45.9", text: "Астма, неуточнена" },
  { icd: "N39.0", text: "Инфекция на пикочните пътища" },
  { icd: "H10.9", text: "Конюнктивит, неуточнен" },
  { icd: "R51", text: "Главоболие" },
  { icd: "E78.5", text: "Хиперлипидемия, неуточнена" },
  { icd: "Z00.0", text: "Общ медицински преглед" },
  { icd: "J03.9", text: "Остър тонзилит" },
  { icd: "I48", text: "Предсърдно мъждене и трептене" },
  { icd: "K80.2", text: "Холелитиаза без холецистит" },
];

const NOTES = [
  "Пациентът е в добро общо състояние. Назначена контролна консултация.",
  "Проведена антибиотична терапия. Препоръчан домашен режим 5 дни.",
  "Взета кръв за ПКК и биохимия. Резултатите в норма.",
  "Назначена ЕКГ и ехокардиография. Продължава досегашната терапия.",
  "Извършена превръзка. Контролен преглед след 10 дни.",
  "Препоръчана диета и двигателен режим. Контрол на теглото.",
  "Издаден болничен лист за 7 дни.",
  "Насочен за консултация със специалист.",
];

const BLOOD = ["0 Rh(+)", "0 Rh(−)", "A Rh(+)", "A Rh(−)", "B Rh(+)", "B Rh(−)", "AB Rh(+)", "AB Rh(−)"];
const ALLERGIES = ["Няма данни", "Пеницилин", "Прашец / полени", "Лактоза", "Ацетилсалицилова киселина", "Ядки", "Йодни контрастни вещества"];
const INSURERS = ["НЗОК", "НЗОК + ДЗИ Здраве", "НЗОК + Булстрад Живот", "НЗОК + Дженерали Застраховане"];

/* ------------------------------------------------------------------ */
/* EGN                                                                 */
/* ------------------------------------------------------------------ */

const EGN_WEIGHTS = [2, 4, 8, 5, 10, 9, 7, 3, 6];

export function buildEgn(birth: Date, order: number): string {
  const y = birth.getFullYear();
  const yy = String(y % 100).padStart(2, "0");
  let month = birth.getMonth() + 1;
  if (y < 1900) month += 20;
  else if (y >= 2000) month += 40;
  const mm = String(month).padStart(2, "0");
  const dd = String(birth.getDate()).padStart(2, "0");
  const ooo = String(order).padStart(3, "0");
  const base = `${yy}${mm}${dd}${ooo}`;
  const sum = base.split("").reduce((acc, d, i) => acc + Number(d) * (EGN_WEIGHTS[i] ?? 0), 0);
  const check = sum % 11 === 10 ? 0 : sum % 11;
  return `${base}${check}`;
}

export function isValidEgn(egn: string): boolean {
  if (!/^\d{10}$/.test(egn)) return false;
  const sum = egn
    .slice(0, 9)
    .split("")
    .reduce((acc, d, i) => acc + Number(d) * (EGN_WEIGHTS[i] ?? 0), 0);
  const check = sum % 11 === 10 ? 0 : sum % 11;
  return check === Number(egn[9]);
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const pick = <T,>(rnd: () => number, arr: T[]): T => arr[Math.floor(rnd() * arr.length)] as T;
const between = (rnd: () => number, min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function calcAge(birthIso: string, ref: Date = new Date()): number {
  const b = new Date(birthIso + "T00:00:00Z");
  let age = ref.getUTCFullYear() - b.getUTCFullYear();
  const m = ref.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && ref.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

export function formatDateBg(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y} г.`;
}

export function bmi(weightKg: number, heightCm: number): number {
  return Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10;
}

export function bmiLabel(value: number): string {
  if (value < 18.5) return "Поднормено тегло";
  if (value < 25) return "Нормално тегло";
  if (value < 30) return "Наднормено тегло";
  return "Затлъстяване";
}

function femaleSurname(stem: string) {
  return stem.endsWith("ов") || stem.endsWith("ев") ? stem + "а" : stem;
}

/* ------------------------------------------------------------------ */
/* generation                                                          */
/* ------------------------------------------------------------------ */

const REFERENCE_DATE = new Date("2026-09-25T00:00:00Z");

function makePatient(rnd: () => number, index: number): Patient {
  const sex: Sex = rnd() < 0.5 ? "Мъж" : "Жена";

  // age profile: plenty of pupils/students plus adults
  const r = rnd();
  const age = r < 0.28 ? between(rnd, 7, 18) : r < 0.5 ? between(rnd, 19, 26) : between(rnd, 27, 88);

  const birthYear = REFERENCE_DATE.getUTCFullYear() - age;
  const birthMonth = between(rnd, 0, 11);
  const birthDay = between(rnd, 1, 28);
  const birth = new Date(Date.UTC(birthYear, birthMonth, birthDay));

  // 9th digit parity encodes sex
  let order = between(rnd, 0, 499) * 2 + (sex === "Мъж" ? 0 : 1);
  if (order > 999) order -= 2;
  const egn = buildEgn(new Date(birthYear, birthMonth, birthDay), order);

  const stem = pick(rnd, SURNAME_STEMS);
  const fatherStem = pick(rnd, SURNAME_STEMS);
  const firstName = sex === "Мъж" ? pick(rnd, MALE_FIRST) : pick(rnd, FEMALE_FIRST);
  const middleName = sex === "Мъж" ? fatherStem : femaleSurname(fatherStem);
  const lastName = sex === "Мъж" ? stem : femaleSurname(stem);

  const place = pick(rnd, CITIES);
  const address = `${pick(rnd, place.streets)} №${between(rnd, 1, 148)}${rnd() < 0.6 ? `, ет. ${between(rnd, 1, 8)}, ап. ${between(rnd, 1, 60)}` : ""}`;

  const isStudent = age <= 26 && rnd() < 0.93;
  const school = isStudent
    ? pick(rnd, SCHOOLS.filter((s) => (age <= 18 ? s.kind === "school" : s.kind === "uni")))
    : undefined;
  const grade = isStudent
    ? age <= 18
      ? `${Math.min(12, Math.max(1, age - 6))} клас`
      : `${Math.min(5, Math.max(1, age - 18))} курс`
    : undefined;

  // anthropometrics
  const baseHeight = age < 18 ? 105 + age * 4.4 : sex === "Мъж" ? 178 : 166;
  const heightCm = Math.round(baseHeight + (rnd() - 0.5) * 14);
  const idealWeight = Math.pow(heightCm / 100, 2) * (age < 18 ? 18 : 24);
  const weightKg = Math.round((idealWeight + (rnd() - 0.45) * 18) * 10) / 10;

  const visitCount = between(rnd, 2, 5);
  const visits: Visit[] = [];
  let daysAgo = between(rnd, 2, 210);
  for (let v = 0; v < visitCount; v++) {
    const d = new Date(REFERENCE_DATE.getTime() - daysAgo * 86400000);
    const dg = pick(rnd, DIAGNOSES);
    const drift = v === 0 ? 0 : (rnd() - 0.5) * 4;
    visits.push({
      date: iso(d),
      department: pick(rnd, DEPARTMENTS),
      doctor: pick(rnd, DOCTORS),
      diagnosis: dg.text,
      icd: dg.icd,
      weightKg: Math.round((weightKg - drift) * 10) / 10,
      heightCm: v === 0 ? heightCm : Math.max(100, heightCm - (age < 18 ? between(rnd, 1, 4) : 0)),
      bloodPressure: `${between(rnd, 105, 148)}/${between(rnd, 62, 94)}`,
      pulse: between(rnd, 56, 96),
      temperature: Math.round((36 + rnd() * 1.8) * 10) / 10,
      notes: pick(rnd, NOTES),
    });
    daysAgo += between(rnd, 40, 500);
  }

  const translit = (s: string) => s;
  const fullName = `${firstName} ${middleName} ${lastName}`;

  return {
    id: `PAT-${String(index + 1).padStart(4, "0")}`,
    egn,
    firstName,
    middleName,
    lastName,
    fullName,
    sex,
    birthDate: iso(birth),
    age,
    phone: `+359 ${pick(rnd, ["87", "88", "89", "98"])}${between(rnd, 0, 9)} ${between(rnd, 100, 999)} ${between(rnd, 100, 999)}`,
    email: `${translit(firstName).toLowerCase()}.${index + 1}@mail.bg`,
    address,
    city: place.city,
    bloodType: pick(rnd, BLOOD),
    allergies: pick(rnd, ALLERGIES),
    insurer: pick(rnd, INSURERS),
    insured: rnd() < 0.94,
    isStudent,
    schoolName: school?.name,
    schoolLocation: school?.location,
    grade,
    gp: pick(rnd, DOCTORS),
    visits,
    lastVisit: visits[0] as Visit,
  };
}

export const PATIENTS: Patient[] = (() => {
  const rnd = mulberry32(20260925);
  const list: Patient[] = [];
  const seen = new Set<string>();
  let i = 0;
  while (list.length < 124) {
    const p = makePatient(rnd, i++);
    if (seen.has(p.egn)) continue;
    seen.add(p.egn);
    list.push(p);
  }
  return list.sort((a, b) => a.lastName.localeCompare(b.lastName, "bg"));
})();

export function searchPatients(query: string, list: Patient[] = PATIENTS): Patient[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  const digits = q.replace(/\D/g, "");
  return list.filter((p) => {
    if (digits.length >= 2 && (p.egn.includes(digits) || p.phone.replace(/\D/g, "").includes(digits))) return true;
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      (p.schoolName?.toLowerCase().includes(q) ?? false)
    );
  });
}

export const REGISTRY_STATS = {
  total: PATIENTS.length,
  students: PATIENTS.filter((p) => p.isStudent).length,
  visitsLast30: PATIENTS.filter(
    (p) => (REFERENCE_DATE.getTime() - new Date(p.lastVisit.date).getTime()) / 86400000 <= 30,
  ).length,
  uninsured: PATIENTS.filter((p) => !p.insured).length,
};

export const TODAY_ISO = iso(REFERENCE_DATE);
