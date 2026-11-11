import type { Analysis, Comparison } from '../shared/types';
import { newId } from '../shared/types';

export interface ComparisonRow {
  label: string;
  first: string | number;
  second: string | number;
}

function countHigh(analysis: Analysis): number {
  return analysis.findings.filter(item => item.severity === 'High').length;
}

export function compareProjects(first: Analysis, second: Analysis): {
  record: Comparison;
  rows: ComparisonRow[];
} {
  return {
    record: {
      comparison_id: newId(),
      created_at: new Date().toISOString(),
      slot_a: first.analysis_id,
      slot_b: second.analysis_id,
    },
    rows: [
      { label: 'Source', first: first.source_type, second: second.source_type },
      { label: 'Files found', first: first.total_files, second: second.total_files },
      { label: 'Sampled lines', first: first.total_loc, second: second.total_loc },
      { label: 'Languages', first: first.language_stats.length, second: second.language_stats.length },
      { label: 'Frameworks', first: first.frameworks.length, second: second.frameworks.length },
      { label: 'Potential findings', first: first.findings.length, second: second.findings.length },
      { label: 'High severity', first: countHigh(first), second: countHigh(second) },
      { label: 'AI style indicator*', first: `${first.ai_usage_pct}%`, second: `${second.ai_usage_pct}%` },
      { label: 'Code variation indicator*', first: `${first.uniqueness_pct}%`, second: `${second.uniqueness_pct}%` },
      { label: 'Quality score', first: `${first.quality_score}/100`, second: `${second.quality_score}/100` },
      { label: 'Grade', first: first.quality_grade, second: second.quality_grade },
      {
        label: 'Live link',
        first: first.live_checks.at(-1)?.status ?? 'not checked',
        second: second.live_checks.at(-1)?.status ?? 'not checked',
      },
    ],
  };
}
