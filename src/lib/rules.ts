// FR-5, FR-6 · Owner: Md. Redwan Rashid Nice (0242310005341105) — rule-based bug scan, AI estimate, uniqueness, overall score
import type { Analysis, Bug, FileItem } from '../types';
import { detectFrameworks, langShare } from './languages';
const RULES: [RegExp, Bug['sev'], string][] = [
  [/\beval\s*\(/, 'high', 'Use of eval() — code injection risk'],
  [/\.innerHTML\s*=|dangerouslySetInnerHTML/, 'high', 'Possible XSS via innerHTML'],
  [/(SELECT|INSERT|UPDATE|DELETE)\s[^;\n]*(\+\s*\$?\w|\$_(GET|POST|REQUEST)|\$\{)/i, 'high', 'Possible SQL injection (string-built query)'],
  [/(password|passwd|secret|api[_-]?key|token)\s*[:=]\s*["'][^"']{6,}["']/i, 'high', 'Hard-coded secret/credential'],
  [/\bmd5\s*\(|createHash\(\s*['"](md5|sha1)['"]/i, 'high', 'Weak hashing (MD5/SHA-1)'],
  [/document\.write\s*\(/, 'medium', 'document.write() usage'],
  [/catch\s*(\([^)]*\))?\s*\{\s*\}/, 'medium', 'Empty catch block swallows errors'],
  [/setTimeout\s*\(\s*["']/, 'medium', 'setTimeout with string argument'],
  [/console\.log\(/, 'low', 'console.log left in code'],
  [/\bvar\s+\w+/, 'low', 'var declaration (prefer const/let)'],
  [/TODO|FIXME|HACK/, 'low', 'Unresolved TODO/FIXME'],
];
const ORD = { high: 0, medium: 1, low: 2 };
function scan(t: FileItem[], paths: string[]): Bug[] {
  const out: Bug[] = [], seen = new Set<string>();
  for (const f of t) for (const [re, sev, desc] of RULES) if (!seen.has(desc) && re.test(f.text!)) { seen.add(desc); out.push({ sev, desc, file: f.path }); }
  const has = (re: RegExp) => paths.some(p => re.test(p));
  if (has(/(^|\/)\.env$/) && !has(/\.gitignore$/)) out.push({ sev: 'high', desc: '.env present without .gitignore', file: '.env' });
  if (!has(/readme/i)) out.push({ sev: 'low', desc: 'No README found', file: '/' });
  if (!has(/licen[sc]e/i)) out.push({ sev: 'low', desc: 'No LICENSE found', file: '/' });
  return out.sort((a, b) => ORD[a.sev] - ORD[b.sev]).slice(0, 20);
}
function aiScore(t: FileItem[]) {
  if (!t.length) return 0;
  let cm = 0, nm = 0, bp = 0, un = 0;
  for (const f of t) {
    const x = f.text!, L = x.split('\n'); if (L.length < 4) continue;
    if (L.filter(l => /^\s*(\/\/|#|\/\*|\*)/.test(l)).length / L.length > 0.15) cm++;
    if (/^\s*\/\/\s*(Initialize|Handle|Check if|Step \d|Validate|Process)/m.test(x) || /@param|@returns/.test(x)) nm++;
    if (/placeholder|lorem ipsum|example\.com|your[_-]?api[_-]?key/i.test(x)) bp++;
    const ind = L.map(l => /^( +)/.exec(l)?.[1].length).filter((n): n is number => !!n);
    if (ind.length > 4 && ind.filter(n => n % 2 === 0).length / ind.length > 0.95) un++;
  }
  const n = t.length;
  return Math.max(2, Math.min(98, Math.round((un / n) * 25 + (cm / n) * 20 + (nm / n) * 40 + (bp / n) * 15)));
}
function uniqueness(p: string[], nl: number, nf: number) {
  const h = (re: RegExp) => p.some(x => re.test(x));
  const s = 50 + (nl >= 5 ? 18 : nl >= 3 ? 10 : nl >= 2 ? 5 : 0) + (nf > 200 ? 18 : nf > 80 ? 12 : nf > 20 ? 6 : nf < 5 ? -12 : 0)
    + (h(/readme/i) ? 6 : 0) + (h(/test|spec/i) ? 14 : 0) + (h(/(^|\/)docs\//i) ? 6 : 0) + (h(/\.github\//) ? 5 : 0) + (h(/licen[sc]e/i) ? 4 : 0);
  return Math.max(8, Math.min(100, s));
}
export function analyze(name: string, source: string, files: FileItem[], live: Analysis['live'] = [], desc = ''): Analysis {
  const paths = files.map(f => f.path), langs = langShare(files), texts = files.filter(f => f.text);
  const bugs = scan(texts, paths), unique = uniqueness(paths, langs.length, files.length);
  const pen = bugs.filter(b => b.sev === 'high').length * 5 + bugs.filter(b => b.sev === 'medium').length * 2;
  const score = Math.max(5, Math.min(100, Math.min(25, langs.length * 5) + Math.round(unique * 0.35) + Math.min(25, Math.round(files.length / 4)) + 15 - Math.min(20, pen)));
  return { id: Date.now().toString(36), name, source, at: Date.now(), desc, langs, platforms: detectFrameworks(paths), bugs, ai: aiScore(texts), unique, score, files: files.length, live };
}
