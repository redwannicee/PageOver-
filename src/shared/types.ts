// These interfaces follow the entities in our PageOver ER diagram.
// IDs are strings locally because ZIP uploads don't have database IDs.

export type Severity = 'High' | 'Medium' | 'Low';
export type SourceType = 'github' | 'zip';

export interface SourceFile {
  file_id: string;
  file_path: string;
  extension: string;
  size_bytes: number;
  line_count: number;
  content?: string; // temporary during scanning; not stored in history
}

export interface RepoMetadata {
  repo_id: number;
  owner: string;
  repo_name: string;
  description: string;
  stars: number;
  forks: number;
  default_branch: string;
  license: string | null;
  has_tests: boolean;
  has_readme: boolean;
  has_ci: boolean;
  homepage?: string | null;
}

export interface LanguageStat {
  language_id: string;
  language_name: string;
  bytes: number;
  percentage: number;
}

export interface Framework {
  framework_id: string;
  framework_name: string;
  category: string;
  detected_from: string;
}

export interface Rule {
  rule_id: string;
  rule_name: string;
  category: string;
  default_severity: Severity;
  pattern: string;
}

export interface Finding {
  finding_id: string;
  rule_id: string;
  file_id: string;
  severity: Severity;
  line_number: number;
  message: string;
}

export interface AiSignal {
  signal_id: string;
  signal_name: string;
  signal_value: number;
  weight: number;
}

export interface LiveCheck {
  check_id: string;
  url: string;
  check_type: string;
  is_live: boolean | null;
  http_status: number | null;
  checked_at: string;
  status: 'online' | 'offline' | 'unknown';
}

export interface PdfReport {
  report_id: string;
  file_name: string;
  generated_at: string;
}

export interface Analysis {
  analysis_id: string;
  project_name: string;
  source_type: SourceType;
  source_url: string | null;
  zip_file_name: string | null;
  status: 'complete' | 'partial';
  analyzed_at: string;
  total_files: number;
  total_loc: number;
  ai_usage_pct: number;
  uniqueness_pct: number;
  quality_score: number;
  quality_grade: string;
  repo_metadata?: RepoMetadata;
  source_files: SourceFile[];
  language_stats: LanguageStat[];
  frameworks: Framework[];
  findings: Finding[];
  ai_signals: AiSignal[];
  live_checks: LiveCheck[];
  pdf_reports: PdfReport[];
  notes: string[];
}

export interface Comparison {
  comparison_id: string;
  created_at: string;
  slot_a: string;
  slot_b: string;
}

// A common shape makes ZIP and GitHub follow the same analysis pipeline.
export interface ProjectInput {
  project_name: string;
  source_type: SourceType;
  source_url: string | null;
  zip_file_name: string | null;
  repo_metadata?: RepoMetadata;
  source_files: SourceFile[];
  language_stats?: LanguageStat[];
  frameworks?: Framework[];
  live_checks?: LiveCheck[];
  notes?: string[];
}

export const newId = () => crypto.randomUUID();

const readableExtensions = new Set([
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'json', 'css', 'scss', 'html',
  'vue', 'svelte', 'py', 'java', 'php', 'rb', 'go', 'rs', 'c', 'h',
  'cpp', 'cc', 'cs', 'kt', 'swift', 'dart', 'sh', 'sql', 'xml', 'yaml',
  'yml', 'toml', 'md', 'txt', 'gradle', 'prisma',
]);

export function fileExtension(path: string): string {
  const name = path.split('/').pop() ?? path;
  return name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
}

export function isReadableSource(path: string): boolean {
  return readableExtensions.has(fileExtension(path)) ||
    /(^|\/)(Dockerfile|Gemfile|artisan|manage\.py)$/i.test(path);
}

export function countLines(content: string): number {
  return content ? content.split(/\r?\n/).length : 0;
}
