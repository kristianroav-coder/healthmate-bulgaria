import logoAsset from "@/assets/logo-mbal.png";
const logo = logoAsset;
import { HOSPITAL, type HospitalDocument } from "@/lib/documents";

export function DocumentPage({ doc }: { doc: HospitalDocument }) {
  return (
    <div className="doc-page">
      <header style={{ textAlign: "center", borderBottom: "2px solid #1C4E80", paddingBottom: "10px" }}>
        <img src={logo} alt="" style={{ height: "62px", margin: "0 auto 6px" }} />
        <div style={{ fontWeight: 700, fontSize: "12pt", letterSpacing: "0.3px" }}>{HOSPITAL.name}</div>
        <div style={{ fontWeight: 700, fontSize: "11pt" }}>{HOSPITAL.name2}</div>
        <div style={{ fontSize: "8.5pt", color: "#555" }}>{HOSPITAL.address}</div>
        <div style={{ fontSize: "8.5pt", color: "#555" }}>{HOSPITAL.contacts}</div>
      </header>

      <h1 style={{ textAlign: "center", fontSize: "15pt", fontWeight: 700, marginTop: "18px" }}>{doc.title}</h1>
      <div style={{ textAlign: "center", fontStyle: "italic", color: "#444", fontSize: "10pt" }}>{doc.subtitle}</div>
      <div style={{ textAlign: "center", fontSize: "10pt", margin: "8px 0 18px" }}>
        <strong>№ {doc.number}</strong> &nbsp;•&nbsp; Дата на издаване: {doc.date}
      </div>

      {doc.sections.map((section) => (
        <section key={section.heading} style={{ marginBottom: "14px" }}>
          <div
            style={{
              background: "#E8EFF6",
              color: "#1C4E80",
              fontWeight: 700,
              fontSize: "9.5pt",
              letterSpacing: "0.6px",
              padding: "4px 8px",
              marginBottom: "6px",
            }}
          >
            {section.heading.toUpperCase()}
          </div>
          {section.fields && section.fields.length > 0 && (
            <table>
              <tbody>
                {section.fields.map((f) => (
                  <tr key={f.label}>
                    <td style={{ width: "38%", background: "#F5F8FB", color: "#3A4A5A" }}>{f.label}</td>
                    <td style={{ fontWeight: 700 }}>{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {section.body?.map((line, i) => (
            <p key={i} style={{ margin: "6px 0", textAlign: "justify" }}>
              {line}
            </p>
          ))}
        </section>
      ))}

      <p style={{ fontSize: "8pt", fontStyle: "italic", color: "#666", marginTop: "24px" }}>{doc.footerNote}</p>

      <div style={{ marginTop: "38px", fontSize: "10pt" }}>
        <div>Лекар: {doc.signedBy}</div>
        <div style={{ marginTop: "6px" }}>
          Подпис: ......................................&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Печат: ......................................
        </div>
      </div>

      <div style={{ marginTop: "26px", textAlign: "center", fontSize: "7pt", color: "#888" }}>{HOSPITAL.registry}</div>
    </div>
  );
}
