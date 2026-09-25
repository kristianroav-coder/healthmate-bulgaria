import {
  Activity, CalendarDays, Cake, FileText, GraduationCap, HeartPulse, IdCard,
  MapPin, Phone, Ruler, ShieldCheck, ShieldAlert, Stethoscope, Weight,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ClipboardPlus } from "lucide-react";
import { bmi, bmiLabel, formatDateBg, type Patient } from "@/lib/patients";
import { DOCUMENT_LABELS, type DocumentKind } from "@/lib/documents";

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Weight; label: string; value: string; hint?: string }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-4" /> {label}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/70 py-2.5 last:border-0">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <span className="w-44 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function PatientDetail({
  patient,
  onOpenDocument,
}: {
  patient: Patient;
  onOpenDocument: (kind: DocumentKind) => void;
}) {
  const v = patient.lastVisit;
  const index = bmi(v.weightKg, v.heightCm);

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Пациентски картон · {patient.id}
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">{patient.fullName}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground">
                ЕГН {patient.egn}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{patient.sex}</span>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{patient.age} години</span>
              {patient.isStudent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 font-semibold text-accent-foreground">
                  <GraduationCap className="size-3.5" /> Учащ
                </span>
              )}
              {patient.insured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 font-semibold text-success">
                  <ShieldCheck className="size-3.5" /> Осигурен
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/12 px-2.5 py-1 font-semibold text-destructive">
                  <ShieldAlert className="size-3.5" /> Неосигурен
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {patient.dbId && (
              <Link to="/patients/$id/visit" params={{ id: patient.dbId }} className="win-btn-primary text-xs">
                <ClipboardPlus className="size-3.5" /> Нов преглед
              </Link>
            )}
            {(Object.keys(DOCUMENT_LABELS) as DocumentKind[]).map((k) => (
              <button
                key={k}
                onClick={() => onOpenDocument(k)}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium transition-colors hover:border-primary hover:bg-secondary"
              >
                <FileText className="size-3.5 text-primary" /> {DOCUMENT_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Weight} label="Тегло" value={`${v.weightKg.toFixed(1)} кг`} hint={`от ${formatDateBg(v.date)}`} />
        <Stat icon={Ruler} label="Ръст" value={`${v.heightCm} см`} hint={`от ${formatDateBg(v.date)}`} />
        <Stat icon={Activity} label="ИТМ" value={String(index)} hint={bmiLabel(index)} />
        <Stat icon={HeartPulse} label="RR / пулс" value={v.bloodPressure} hint={`${v.pulse} уд./мин · ${v.temperature.toFixed(1)} °C`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Лични данни</h3>
          <Row icon={IdCard} label="ЕГН" value={patient.egn} />
          <Row icon={Cake} label="Дата на раждане" value={`${formatDateBg(patient.birthDate)} · ${patient.age} г.`} />
          <Row icon={Phone} label="Телефон" value={patient.phone} />
          <Row icon={MapPin} label="Адрес" value={`гр. ${patient.city}, ${patient.address}`} />
          <Row icon={HeartPulse} label="Кръвна група" value={patient.bloodType} />
          <Row icon={ShieldAlert} label="Алергии" value={patient.allergies} />
          <Row icon={Stethoscope} label="Личен лекар" value={patient.gp} />
          <Row icon={ShieldCheck} label="Осигуряване" value={patient.insured ? patient.insurer : "Няма активно осигуряване"} />
        </div>

        <div className="panel p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">
            {patient.isStudent ? "Учебно заведение" : "Статус"}
          </h3>
          {patient.isStudent ? (
            <>
              <Row icon={GraduationCap} label="Заведение" value={patient.schoolName ?? "—"} />
              <Row icon={MapPin} label="Локация" value={patient.schoolLocation ?? "—"} />
              <Row icon={CalendarDays} label="Клас / курс" value={patient.grade ?? "—"} />
            </>
          ) : (
            <Row icon={GraduationCap} label="Учащ" value="Не" />
          )}
          <h3 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-primary">Последно посещение</h3>
          <Row icon={CalendarDays} label="Дата" value={formatDateBg(v.date)} />
          <Row icon={Stethoscope} label="Отделение" value={v.department} />
          <Row icon={Stethoscope} label="Лекар" value={v.doctor} />
          {v.complaints ? <Row icon={FileText} label="Оплаквания" value={v.complaints} /> : null}
          <Row icon={FileText} label="Диагноза" value={`${v.diagnosis} (МКБ ${v.icd})`} />
          {v.finalNotes ? <Row icon={FileText} label="Заключение" value={v.finalNotes} /> : null}
        </div>
      </div>

      <div className="panel overflow-hidden">
        <h3 className="border-b border-border px-5 py-3 text-sm font-semibold uppercase tracking-wide text-primary">
          История на посещенията
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Дата</th>
                <th className="px-4 py-2 font-medium">Отделение</th>
                <th className="px-4 py-2 font-medium">Лекар</th>
                <th className="px-4 py-2 font-medium">Диагноза</th>
                <th className="px-4 py-2 text-right font-medium">Тегло</th>
                <th className="px-4 py-2 text-right font-medium">Ръст</th>
                <th className="px-4 py-2 text-right font-medium">RR</th>
              </tr>
            </thead>
            <tbody>
              {patient.visits.map((x, i) => (
                <tr key={x.date + i} className="border-t border-border/70">
                  <td className="whitespace-nowrap px-4 py-2 tabular-nums">{formatDateBg(x.date)}</td>
                  <td className="px-4 py-2">{x.department}</td>
                  <td className="whitespace-nowrap px-4 py-2">{x.doctor}</td>
                  <td className="px-4 py-2">
                    {x.diagnosis} <span className="text-muted-foreground">({x.icd})</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{x.weightKg.toFixed(1)} кг</td>
                  <td className="px-4 py-2 text-right tabular-nums">{x.heightCm} см</td>
                  <td className="px-4 py-2 text-right tabular-nums">{x.bloodPressure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
