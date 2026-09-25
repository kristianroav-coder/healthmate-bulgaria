import { useState } from "react";
import { Download, Loader2, Printer, X, FileText, Save, Search } from "lucide-react";
import logoAsset from "@/assets/logo-nmtb-new.png.asset.json";
const logoUrl = logoAsset.url;
import { DocumentPage } from "./DocumentPage";
import { downloadDocx } from "@/lib/docx-export";
import { DOCUMENT_LABELS, type HospitalDocument, type DocumentKind } from "@/lib/documents";
import { toast } from "sonner";

interface Props {
  doc: HospitalDocument;
  kind: DocumentKind;
  onKindChange: (kind: DocumentKind) => void;
  onClose: () => void;
}

const TABS = ["Файл", "Начало", "Вмъкване", "Оформление", "Преглед", "Изглед"];

export function WordViewer({ doc, kind, onKindChange, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(0.85);

  const handleDownload = async () => {
    setBusy(true);
    try {
      await downloadDocx(doc, logoUrl);
      toast.success("Документът е изтеглен във формат Word (.docx)");
    } catch (e) {
      console.error(e);
      toast.error("Неуспешно генериране на Word документ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--word-canvas)]">
      {/* title bar */}
      <div className="flex items-center gap-3 bg-[var(--word-chrome)] px-4 py-2 text-primary-foreground print:hidden">
        <FileText className="size-4 shrink-0" />
        <span className="truncate text-sm font-medium">{doc.fileName} — Word</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onClose}
            className="rounded p-1.5 transition-colors hover:bg-destructive"
            aria-label="Затвори"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* ribbon tabs */}
      <div className="flex items-center gap-1 border-b border-border bg-card px-3 pt-1 text-xs print:hidden">
        {TABS.map((t, i) => (
          <span
            key={t}
            className={
              i === 1
                ? "rounded-t border border-b-0 border-border bg-background px-3 py-1.5 font-semibold text-primary"
                : "px-3 py-1.5 text-muted-foreground"
            }
          >
            {t}
          </span>
        ))}
      </div>

      {/* ribbon actions */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-3 py-2 print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Printer className="size-4" /> Печат
        </button>
        <button
          onClick={handleDownload}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Изтегли .docx
        </button>
        <span className="mx-1 h-6 w-px bg-border" />
        <div className="inline-flex items-center gap-2 text-sm">
          <Save className="size-4 text-muted-foreground" />
          <select
            value={kind}
            onChange={(e) => onKindChange(e.target.value as DocumentKind)}
            className="rounded-md border border-border bg-card px-2 py-1.5 text-sm"
          >
            {Object.entries(DOCUMENT_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="size-4" />
          <input
            type="range"
            min={50}
            max={130}
            value={zoom * 100}
            onChange={(e) => setZoom(Number(e.target.value) / 100)}
            className="w-28 accent-[var(--primary)]"
            aria-label="Мащаб"
          />
          <span className="w-10 tabular-nums">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* canvas */}
      <div className="print-root flex-1 overflow-auto p-6">
        <div
          className="mx-auto w-fit origin-top print:scale-100"
          style={{ transform: `scale(${zoom})` }}
        >
          <DocumentPage doc={doc} />
        </div>
      </div>

      {/* status bar */}
      <div className="flex items-center justify-between bg-[var(--word-chrome)] px-4 py-1.5 text-xs text-primary-foreground/90 print:hidden">
        <span>Страница 1 от 1 · Български (България)</span>
        <span>Готов за печат</span>
      </div>
    </div>
  );
}
