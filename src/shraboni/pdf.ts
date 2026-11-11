import { jsPDF } from 'jspdf';
import type { Analysis, PdfReport } from '../shared/types';
import { newId } from '../shared/types';

const LEFT = 18;
const RIGHT = 192;
const BOTTOM = 272;

function safeFilename(name: string): string {
  return name.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 65) || 'project';
}

export function exportPdf(analysis: Analysis): PdfReport {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 48;

  function nextPageIfNeeded(height = 8) {
    if (y + height > BOTTOM) {
      pdf.addPage();
      y = 24;
    }
  }

  function write(text: string, fontSize = 10) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(37, 49, 72);

    const lines = pdf.splitTextToSize(text || '—', RIGHT - LEFT);
    const step = fontSize * 0.48 + 1.8;

    for (const line of lines) {
      nextPageIfNeeded(step);
      pdf.text(line, LEFT, y);
      y += step;
    }
  }

  function section(title: string) {
    nextPageIfNeeded(17);
    y += 6;
    pdf.setDrawColor(213, 219, 232);
    pdf.line(LEFT, y - 4, RIGHT, y - 4);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(81, 68, 170);
    pdf.text(title, LEFT, y + 2);
    y += 11;
  }

  pdf.setFillColor(40, 45, 104);
  pdf.rect(0, 0, 210, 37, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(23);
  pdf.text('PageOver', LEFT, 21);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('PROJECT ANALYSIS REPORT', LEFT, 30);

  write(`Project: ${analysis.project_name}`, 15);
  write(`Analyzed: ${new Date(analysis.analyzed_at).toLocaleString()}`);
  write(`Source: ${analysis.source_url || analysis.zip_file_name || 'Local archive'}`);

  section('At a glance');
  write(`Files listed: ${analysis.total_files}   |   Lines sampled: ${analysis.total_loc}`);
  write(`Quality score: ${analysis.quality_score}/100 (${analysis.quality_grade})`);
  write(`AI-style pattern indicator: ${analysis.ai_usage_pct}%`);
  write(`Code variation indicator: ${analysis.uniqueness_pct}%`);
  write('These percentages are heuristics, not proof of AI authorship or plagiarism.', 9);

  section('Languages');
  for (const lang of analysis.language_stats) {
    write(`${lang.language_name}: ${lang.percentage.toFixed(1)}% (${lang.bytes.toLocaleString()} bytes)`);
  }
  if (!analysis.language_stats.length) write('No recognized source languages found.');

  section('Frameworks and tools');
  if (analysis.frameworks.length) {
    for (const item of analysis.frameworks) {
      write(`${item.framework_name} — ${item.category} (from ${item.detected_from})`);
    }
  } else {
    write('No framework matches in the available config files.');
  }

  section('Potential security and code issues');
  write(`${analysis.findings.length} rule matches. Each match needs manual verification.`);
  const filePaths = new Map(analysis.source_files.map(item => [item.file_id, item.file_path]));
  for (const finding of analysis.findings.slice(0, 150)) {
    write(
      `[${finding.severity}] ${finding.rule_id} — ` +
      `${filePaths.get(finding.file_id) ?? 'Unknown file'}:${finding.line_number} — ${finding.message}`,
      9,
    );
  }
  if (analysis.findings.length > 150) {
    write(`Showing 150 of ${analysis.findings.length} findings; refer to the dashboard for the rest.`);
  }

  section('Deployment check');
  if (!analysis.live_checks.length) write('No link was checked.');
  for (const check of analysis.live_checks) {
    write(`${check.url} — ${check.status}${check.http_status ? ` (HTTP ${check.http_status})` : ''}`);
  }

  section('Scope and notes');
  for (const note of analysis.notes) write(`- ${note}`, 9);

  // Add page numbers after all sections are laid out.
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    pdf.setFontSize(8);
    pdf.setTextColor(113, 123, 143);
    pdf.text('PageOver | Group 05, SE331', LEFT, 286);
    pdf.text(`${page} / ${pages}`, RIGHT, 286, { align: 'right' });
  }

  const file_name = `PageOver_${safeFilename(analysis.project_name)}.pdf`;
  pdf.save(file_name);

  return { report_id: newId(), file_name, generated_at: new Date().toISOString() };
}
