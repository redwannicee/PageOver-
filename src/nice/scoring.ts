import type { AiSignal, Analysis, ProjectInput } from '../shared/types';
import { newId } from '../shared/types';
import { detectFrameworks, detectLanguages } from '../shraboni/detection';
import { scanSourceFiles } from './scanner';

function percent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function proportion(value: number, max: number): number {
  return Math.min(1, value / max);
}

function duplicateLineRate(code: string): number {
  const lines = code
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 24 && !/^[{}()[\],;]+$/.test(line));

  if (lines.length < 8) return 0;
  const distinct = new Set(lines);
  return (lines.length - distinct.size) / lines.length;
}

export function analyzeProject(input: ProjectInput): Analysis {
  const files = input.source_files;
  const readable = files.filter(file => file.content !== undefined);
  const sampleText = readable.map(file => file.content ?? '').join('\n').slice(0, 2_000_000);
  const sampledLines = readable.reduce((total, file) => total + file.line_count, 0);
  const findings = scanSourceFiles(files);

  // Transparent, deterministic signals. They measure patterns in the sample,
  // not who wrote the code. We keep the ERD label AI_SIGNAL for consistency.
  const placeholderCount = (sampleText.match(/\b(?:TODO|FIXME|placeholder|lorem ipsum)\b/gi) ?? []).length;
  const genericNameCount = (sampleText.match(/\b(?:handleClick|myFunction|testFunction|exampleFunction)\b/g) ?? []).length;
  const commentLines = (sampleText.match(/^\s*(?:\/\/|#|\*)/gm) ?? []).length;
  const commentRatio = sampledLines ? commentLines / sampledLines : 0;
  const duplicateRate = duplicateLineRate(sampleText);

  const signals: Array<{ name: string; value: number; weight: number }> = [
    { name: 'Placeholders / TODO markers', value: proportion(placeholderCount, 8), weight: 30 },
    { name: 'Repeated generic names', value: proportion(genericNameCount, 8), weight: 25 },
    { name: 'Repeated code lines', value: proportion(duplicateRate, 0.3), weight: 25 },
    { name: 'Unusually dense comments', value: commentRatio > 0.45 ? 1 : 0, weight: 20 },
  ];

  const ai_signals: AiSignal[] = signals.map(signal => ({
    signal_id: newId(),
    signal_name: signal.name,
    signal_value: signal.value,
    weight: signal.weight,
  }));

  const ai_usage_pct = readable.length
    ? percent(signals.reduce((sum, item) => sum + item.value * item.weight, 0))
    : 0;

  // Local code variation is not plagiarism detection (there is no reference corpus).
  const uniqueness_pct = readable.length
    ? percent(100 - duplicateRate * 90 - proportion(placeholderCount, 15) * 15)
    : 0;

  const hasReadme = files.some(file => /(^|\/)README(\.|$)/i.test(file.file_path));
  const hasTests = files.some(file => /(^|\/)(__tests__|tests?|spec)(\/|\.)|\.(test|spec)\./i.test(file.file_path));
  const hasCi = files.some(file => /(^|\/)\.github\/workflows\//i.test(file.file_path));
  const high = findings.filter(item => item.severity === 'High').length;
  const medium = findings.filter(item => item.severity === 'Medium').length;
  const low = findings.filter(item => item.severity === 'Low').length;

  const quality_score = percent(
    65 + (hasReadme ? 10 : 0) + (hasTests ? 10 : 0) + (hasCi ? 10 : 0) +
    (files.length >= 5 ? 5 : 0) - Math.min(35, high * 7) -
    Math.min(20, medium * 3) - Math.min(10, low),
  );

  const quality_grade = quality_score >= 90 ? 'A' :
    quality_score >= 80 ? 'B' :
    quality_score >= 70 ? 'C' :
    quality_score >= 60 ? 'D' : 'F';

  return {
    analysis_id: newId(),
    project_name: input.project_name,
    source_type: input.source_type,
    source_url: input.source_url,
    zip_file_name: input.zip_file_name,
    status: readable.length ? 'complete' : 'partial',
    analyzed_at: new Date().toISOString(),
    total_files: files.length,
    total_loc: sampledLines,
    ai_usage_pct,
    uniqueness_pct,
    quality_score,
    quality_grade,
    repo_metadata: input.repo_metadata,
    source_files: files,
    language_stats: input.language_stats ?? detectLanguages(files),
    frameworks: input.frameworks ?? detectFrameworks(files),
    findings,
    ai_signals,
    live_checks: input.live_checks ?? [],
    pdf_reports: [],
    notes: [
      ...(input.notes ?? []),
      `Code was read from ${readable.length} of ${files.length} listed files. Lines and findings reflect that sample.`,
      'The AI-style indicator is a code-pattern score, not an AI-generated code detector.',
      'The variation score measures repetition within this project; it cannot establish originality or plagiarism.',
      'Regex-based security checks can miss problems or flag safe code. Always review the actual source.',
    ],
  };
}
