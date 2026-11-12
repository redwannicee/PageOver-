// FR-11 · Owner: Most. Sumaiya Akter Shraboni (241-35-514) — branded PDF export with logo watermark (jsPDF, client-side)
import { jsPDF } from 'jspdf';
import type { Analysis } from '../types';
const logo = async () => {
  const b = await (await fetch(import.meta.env.BASE_URL + 'logo.png')).blob();
  return new Promise<string>(r => { const f = new FileReader(); f.onload = () => r(f.result as string); f.readAsDataURL(b); });
};
export async function exportPdf(a: Analysis) {
  const d = new jsPDF(), img = await logo().catch(() => ''), G = (d as any).GState;
  let y = 0;
  const page = () => {
    if (img) { d.setGState(new G({ opacity: 0.07 })); d.addImage(img, 'PNG', 45, 90, 120, 120); d.setGState(new G({ opacity: 1 })); d.addImage(img, 'PNG', 14, 6, 18, 18); }
    d.setFontSize(8).setFont('helvetica', 'normal').setTextColor(120); d.text('PageOver — scores are rule-based estimates, not proof.', 14, 290); y = 34;
  };
  const line = (t: string, s = 10, b = false) => {
    if (y > 278) { d.addPage(); page(); }
    d.setFontSize(s).setFont('helvetica', b ? 'bold' : 'normal').setTextColor(30);
    const w = d.splitTextToSize(t, 182); d.text(w, 14, y); y += w.length * (s * 0.45 + 1.5);
  };
  page(); line(a.name, 20, true); line(a.source, 9); y += 4;
  line(`Overall ${a.score}/100  |  Uniqueness ${a.unique}% (est.)  |  AI usage ${a.ai}% (est.)  |  Bugs ${a.bugs.length}  |  Files ${a.files}`, 10, true); y += 4;
  line('Languages', 13, true); a.langs.forEach(l => line(`${l.name}: ${l.pct}%`)); y += 3;
  line('Frameworks / Platforms', 13, true); line(a.platforms.join(', ') || 'None detected'); y += 3;
  line('Bugs & Security Findings', 13, true); a.bugs.forEach(b => line(`[${b.sev.toUpperCase()}] ${b.desc} — ${b.file}`)); if (!a.bugs.length) line('No issues found.'); y += 3;
  line('Live Deployment', 13, true); a.live.forEach(l => line(`${l.ok ? 'REACHABLE' : 'UNREACHABLE'}  ${l.label}: ${l.url}`)); if (!a.live.length) line('Not applicable (ZIP upload).');
  d.save(`PageOver_${a.name.replace(/\W+/g, '_')}_Report.pdf`);
}
