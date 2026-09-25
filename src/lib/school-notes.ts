import { bmi, bmiLabel, formatDateBg, type Patient } from "./patients";
import type { HospitalDocument } from "./documents";

export const SCHOOL_LIST: { name: string; location: string }[] = [
  { name: "СУ „Христо Ботев“", location: "гр. Балчик, ул. „Христо Ботев“ 1" },
  { name: "ОУ „Антим I“", location: "гр. Балчик, ул. „Черно море“ 22" },
  { name: "ОУ „Христо Смирненски“", location: "гр. Балчик, ул. „Приморска“ 15" },
  { name: "ПГ „Алеко Константинов“", location: "гр. Балчик, ул. „Хемус“ 2" },
  { name: "ДГ „Мир“", location: "гр. Балчик" },
  { name: "ДГ „Дъга“", location: "гр. Балчик" },
  { name: "ОУ „Христо Ботев“", location: "с. Оброчище, общ. Балчик" },
  { name: "ОУ „Васил Левски“", location: "с. Соколово, общ. Балчик" },
  { name: "ОУ „Св. Св. Кирил и Методий“", location: "с. Кранево, общ. Балчик" },
  { name: "ОУ „Н. Й. Вапцаров“", location: "с. Сенокос, общ. Балчик" },
  { name: "СУ „Иван Вазов“", location: "гр. Каварна" },
  { name: "СУ „Никола Вапцаров“", location: "гр. Каварна" },
  { name: "ЕГ „Гео Милев“", location: "гр. Добрич" },
  { name: "ПМГ „Иван Вазов“", location: "гр. Добрич" },
  { name: "СУ „Любен Каравелов“", location: "гр. Добрич" },
  { name: "СУ „Димитър Талев“", location: "гр. Добрич" },
  { name: "МГ „Д-р Петър Берон“", location: "гр. Варна" },
  { name: "ПГЕЕ „Константин Фотинов“", location: "гр. Варна" },
];

export const PE_GROUPS = [
  "Основна група – без ограничения",
  "Подготвителна група – с ограничения",
  "Специална група",
  "Освободен от физическо възпитание",
];

export type SchoolNote = {
  note_date: string; school_name: string; school_location: string; grade: string;
  weight_kg: number | null; height_cm: number | null; diseases: string; allergies: string;
  vaccinations: string; pe_group: string; conclusion: string; doctor: string; number: string;
};

export function buildSchoolNote(p: Patient, n: SchoolNote): HospitalDocument {
  const idx = n.weight_kg && n.height_cm ? bmi(n.weight_kg, n.height_cm) : null;
  return {
    kind: "school",
    title: "ПРОФИЛАКТИЧНА МЕДИЦИНСКА БЕЛЕЖКА",
    subtitle: "за ученик – за представяне в учебно заведение",
    number: n.number,
    date: formatDateBg(n.note_date),
    signedBy: n.doctor,
    footerNote: "Бележката се издава след профилактичен преглед и е валидна за текущата учебна година, с подпис и печат.",
    fileName: `Ученическа бележка - ${p.fullName} (${p.egn}).docx`,
    sections: [
      {
        heading: "Данни за ученика",
        fields: [
          { label: "Име, презиме, фамилия", value: p.fullName },
          { label: "ЕГН", value: p.egn },
          { label: "Дата на раждане", value: `${formatDateBg(p.birthDate)} (${p.age} г.)` },
          { label: "Адрес", value: `гр. ${p.city}, ${p.address}` },
        ],
      },
      {
        heading: "Учебно заведение",
        fields: [
          { label: "Училище", value: n.school_name || "—" },
          { label: "Местоположение", value: n.school_location || "—" },
          { label: "Клас", value: n.grade || "—" },
        ],
      },
      {
        heading: "Профилактичен преглед",
        fields: [
          { label: "Тегло", value: n.weight_kg ? `${n.weight_kg} кг` : "—" },
          { label: "Ръст", value: n.height_cm ? `${n.height_cm} см` : "—" },
          { label: "Индекс на телесна маса", value: idx ? `${idx} — ${bmiLabel(idx)}` : "—" },
          { label: "Заболявания", value: n.diseases || "Не са установени" },
          { label: "Алергии", value: n.allergies || "Не съобщава" },
          { label: "Имунизации", value: n.vaccinations || "—" },
          { label: "Физическо възпитание", value: n.pe_group || "—" },
        ],
      },
      { heading: "Заключение", body: [n.conclusion || "Ученикът е клинично здрав и може да посещава учебни занятия."] },
    ],
  };
}
