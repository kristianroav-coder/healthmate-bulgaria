import {
  bmi,
  bmiLabel,
  formatDateBg,
  TODAY_ISO,
  type Patient,
} from "./patients";

export const HOSPITAL = {
  name: "МНОГОПРОФИЛНА БОЛНИЦА ЗА АКТИВНО ЛЕЧЕНИЕ",
  name2: "„МБАЛ – Балчик“ ЕООД",
  address: "гр. Балчик 9600, ул. „Д-р Желязко Желязков“ №2",
  contacts: "тел. 0579/ 7 20 50 • регистратура 0579/ 7 20 51 • office@mbal-balchik.bg",
  registry: "РЗИ Добрич рег. № 0802211001 • НЗОК договор № 08-0112",
};

export interface DocField {
  label: string;
  value: string;
}

export interface DocSection {
  heading: string;
  fields?: DocField[];
  body?: string[];
}

export interface HospitalDocument {
  kind: DocumentKind;
  title: string;
  subtitle: string;
  number: string;
  date: string;
  sections: DocSection[];
  footerNote: string;
  signedBy: string;
  fileName: string;
}

export type DocumentKind = "ambulatory" | "certificate" | "referral" | "summary";

export const DOCUMENT_LABELS: Record<DocumentKind, string> = {
  ambulatory: "Амбулаторен лист",
  certificate: "Медицинско удостоверение",
  referral: "Направление за изследвания",
  summary: "Пациентско досие (извлечение)",
};

function docNumber(patient: Patient, kind: DocumentKind) {
  const prefix = { ambulatory: "АЛ", certificate: "МУ", referral: "НИ", summary: "ПД" }[kind];
  const seq = patient.id.replace("PAT-", "");
  return `${prefix}-${seq}/${TODAY_ISO.slice(0, 4)}`;
}

function identity(patient: Patient): DocField[] {
  return [
    { label: "Име, презиме, фамилия", value: patient.fullName },
    { label: "ЕГН", value: patient.egn },
    { label: "Дата на раждане", value: `${formatDateBg(patient.birthDate)} (${patient.age} г.)` },
    { label: "Пол", value: patient.sex },
    { label: "Телефон", value: patient.phone },
    { label: "Постоянен адрес", value: `гр. ${patient.city}, ${patient.address}` },
    { label: "Здравноосигурен", value: patient.insured ? `Да — ${patient.insurer}` : "Не" },
  ];
}

function anthropometry(patient: Patient): DocField[] {
  const v = patient.lastVisit;
  const index = bmi(v.weightKg, v.heightCm);
  return [
    { label: "Тегло (последно посещение)", value: `${v.weightKg.toFixed(1)} кг` },
    { label: "Ръст (последно посещение)", value: `${v.heightCm} см` },
    { label: "Индекс на телесна маса", value: `${index} — ${bmiLabel(index)}` },
    { label: "Артериално налягане", value: `${v.bloodPressure} mmHg` },
    { label: "Пулс", value: `${v.pulse} уд./мин` },
    { label: "Температура", value: `${v.temperature.toFixed(1)} °C` },
    { label: "Кръвна група", value: patient.bloodType },
    { label: "Алергии", value: patient.allergies },
  ];
}

function studentFields(patient: Patient): DocField[] {
  if (!patient.isStudent) return [{ label: "Учащ", value: "Не" }];
  return [
    { label: "Учащ", value: "Да" },
    { label: "Учебно заведение", value: patient.schoolName ?? "—" },
    { label: "Локация на учебното заведение", value: patient.schoolLocation ?? "—" },
    { label: "Клас / курс", value: patient.grade ?? "—" },
  ];
}

export function buildDocument(patient: Patient, kind: DocumentKind): HospitalDocument {
  const v = patient.lastVisit;
  const base = {
    kind,
    number: docNumber(patient, kind),
    date: formatDateBg(TODAY_ISO),
    signedBy: v.doctor,
    footerNote:
      "Документът е издаден от информационната система на лечебното заведение и е валиден с подпис и печат.",
    fileName: `${DOCUMENT_LABELS[kind]} - ${patient.fullName} (${patient.egn}).docx`,
  };

  if (kind === "certificate") {
    return {
      ...base,
      title: "МЕДИЦИНСКО УДОСТОВЕРЕНИЕ",
      subtitle: patient.isStudent
        ? "за постъпване в учебно заведение / за физическо възпитание и спорт"
        : "за общо здравословно състояние",
      sections: [
        { heading: "Данни за лицето", fields: identity(patient) },
        { heading: "Учебно заведение", fields: studentFields(patient) },
        { heading: "Обективно състояние", fields: anthropometry(patient) },
        {
          heading: "Заключение",
          body: [
            `След извършен преглед на ${formatDateBg(v.date)} в ${v.department} се установява, че лицето ${patient.fullName}, ЕГН ${patient.egn}, е в общо добро здравословно състояние.`,
            patient.isStudent
              ? "Лицето е ГОДНО да посещава учебни занятия, включително часовете по физическо възпитание и спорт, без ограничения."
              : "Няма установени противопоказания за упражняване на трудова дейност.",
            `Регистрирана диагноза при последното посещение: ${v.diagnosis} (МКБ ${v.icd}).`,
          ],
        },
      ],
    };
  }

  if (kind === "referral") {
    return {
      ...base,
      title: "НАПРАВЛЕНИЕ ЗА МЕДИКО-ДИАГНОСТИЧНА ДЕЙНОСТ",
      subtitle: "бл. МЗ-НЗОК №4",
      sections: [
        { heading: "Данни за пациента", fields: identity(patient) },
        {
          heading: "Насочва се към",
          fields: [
            { label: "Отделение / кабинет", value: v.department },
            { label: "Лекуващ лекар", value: v.doctor },
            { label: "Работна диагноза", value: `${v.diagnosis} (МКБ ${v.icd})` },
          ],
        },
        {
          heading: "Назначени изследвания",
          body: [
            "1. ПКК с диференциално броене на левкоцити",
            "2. Биохимия: кръвна захар, креатинин, АСАТ, АЛАТ, общ холестерол",
            "3. Урина — общо изследване",
            "4. ЕКГ в покой с разчитане",
          ],
        },
        { heading: "Витални показатели при насочване", fields: anthropometry(patient) },
      ],
    };
  }

  if (kind === "summary") {
    return {
      ...base,
      title: "ИЗВЛЕЧЕНИЕ ОТ ПАЦИЕНТСКО ДОСИЕ",
      subtitle: `Пациентски номер ${patient.id}`,
      sections: [
        { heading: "Идентификация", fields: identity(patient) },
        { heading: "Учебно заведение", fields: studentFields(patient) },
        { heading: "Антропометрия и витални показатели", fields: anthropometry(patient) },
        {
          heading: "История на посещенията",
          body: patient.visits.map(
            (x) =>
              `${formatDateBg(x.date)} — ${x.department}, ${x.doctor}: ${x.diagnosis} (МКБ ${x.icd}); тегло ${x.weightKg.toFixed(1)} кг, ръст ${x.heightCm} см, RR ${x.bloodPressure}.`,
          ),
        },
        {
          heading: "Личен лекар",
          fields: [{ label: "ОПЛ", value: patient.gp }],
        },
      ],
    };
  }

  return {
    ...base,
    title: "АМБУЛАТОРЕН ЛИСТ",
    subtitle: `от преглед на ${formatDateBg(v.date)}`,
    sections: [
      { heading: "Данни за пациента", fields: identity(patient) },
      { heading: "Учебно заведение", fields: studentFields(patient) },
      {
        heading: "Данни за прегледа",
        fields: [
          { label: "Дата на посещението", value: formatDateBg(v.date) },
          { label: "Отделение", value: v.department },
          { label: "Лекар", value: v.doctor },
          { label: "Оплаквания / анамнеза", value: v.complaints || "—" },
          { label: "Диагноза", value: v.diagnosis },
          { label: "Код по МКБ-10", value: v.icd },
        ],
      },
      { heading: "Обективно състояние", fields: anthropometry(patient) },
      {
        heading: "Терапия и препоръки",
        body: [
          v.notes,
          ...(v.finalNotes ? [`Заключение: ${v.finalNotes}`] : []),
          "Контролен преглед при влошаване на състоянието или по преценка на лекуващия лекар.",
        ],
      },
    ],
  };
}
