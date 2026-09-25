import { HOSPITAL, type HospitalDocument } from "./documents";

const DXA_PAGE = { width: 11906, height: 16838 }; // A4
const MARGIN = 1134; // 2cm
const CONTENT_WIDTH = DXA_PAGE.width - MARGIN * 2;
const LABEL_W = Math.round(CONTENT_WIDTH * 0.38);
const VALUE_W = CONTENT_WIDTH - LABEL_W;

async function loadLogo(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function buildDocxBlob(doc: HospitalDocument, logoUrl: string): Promise<Blob> {
  const d = await import("docx");
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
    AlignmentType, WidthType, BorderStyle, ShadingType, HeadingLevel, Footer, PageNumber,
  } = d;

  const logo = await loadLogo(logoUrl);
  const thin = { style: BorderStyle.SINGLE, size: 1, color: "C7D3E0" };
  const cellBorders = { top: thin, bottom: thin, left: thin, right: thin };

  const headerChildren: InstanceType<typeof Paragraph>[] = [];
  if (logo) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new ImageRun({
            type: "png",
            data: logo,
            transformation: { width: 96, height: 65 },
            altText: { title: "Лого", description: "Лого на болницата", name: "logo" },
          }),
        ],
      }),
    );
  }
  headerChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: HOSPITAL.name, bold: true, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: HOSPITAL.name2, bold: true, size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: HOSPITAL.address, size: 18, color: "555555" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: HOSPITAL.contacts, size: 18, color: "555555" })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "1C4E80", space: 6 } },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 60 },
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: doc.title, bold: true, size: 30 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: doc.subtitle, italics: true, size: 20, color: "444444" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({ text: `№ ${doc.number}`, bold: true, size: 20 }),
        new TextRun({ text: `   •   Дата на издаване: ${doc.date}`, size: 20 }),
      ],
    }),
  );

  const body: object[] = [...headerChildren];

  for (const section of doc.sections) {
    body.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        shading: { type: ShadingType.CLEAR, fill: "E8EFF6" },
        children: [new TextRun({ text: `  ${section.heading.toUpperCase()}`, bold: true, size: 20, color: "1C4E80" })],
      }),
    );

    if (section.fields?.length) {
      body.push(
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [LABEL_W, VALUE_W],
          rows: section.fields.map(
            (f) =>
              new TableRow({
                children: [
                  new TableCell({
                    borders: cellBorders,
                    width: { size: LABEL_W, type: WidthType.DXA },
                    shading: { type: ShadingType.CLEAR, fill: "F5F8FB" },
                    margins: { top: 60, bottom: 60, left: 120, right: 120 },
                    children: [new Paragraph({ children: [new TextRun({ text: f.label, size: 19, color: "3A4A5A" })] })],
                  }),
                  new TableCell({
                    borders: cellBorders,
                    width: { size: VALUE_W, type: WidthType.DXA },
                    margins: { top: 60, bottom: 60, left: 120, right: 120 },
                    children: [new Paragraph({ children: [new TextRun({ text: f.value, size: 19, bold: true })] })],
                  }),
                ],
              }),
          ),
        }),
      );
    }

    for (const line of section.body ?? []) {
      body.push(
        new Paragraph({
          spacing: { after: 80, line: 300 },
          alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun({ text: line, size: 20 })],
        }),
      );
    }
  }

  body.push(
    new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: doc.footerNote, size: 16, italics: true, color: "666666" })] }),
    new Paragraph({
      spacing: { before: 500 },
      children: [new TextRun({ text: `Лекар: ${doc.signedBy}`, size: 20 })],
      tabStops: [{ type: d.TabStopType.RIGHT, position: d.TabStopPosition.MAX }],
    }),
    new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: "Подпис: ......................................          Печат: ......................................", size: 20 })] }),
  );

  const document = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 20 } } } },
    sections: [
      {
        properties: { page: { size: DXA_PAGE, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${HOSPITAL.registry}  •  стр. `, size: 14, color: "888888" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "888888" }),
                ],
              }),
            ],
          }),
        },
        children: body as never,
      },
    ],
  });

  return Packer.toBlob(document);
}

export async function downloadDocx(doc: HospitalDocument, logoUrl: string) {
  const blob = await buildDocxBlob(doc, logoUrl);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
