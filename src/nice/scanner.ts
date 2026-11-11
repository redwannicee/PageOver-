import type { Finding, Rule, SourceFile } from '../shared/types';
import { newId } from '../shared/types';

// This is a deliberately small static checker, not a full parser or taint tracker.
// Findings mean "please inspect this line", not "confirmed vulnerability".
export const RULES: Rule[] = [
  {
    rule_id: 'XSS001', rule_name: 'Unescaped HTML insertion',
    category: 'XSS', default_severity: 'High',
    pattern: 'innerHTML assignment, document.write, dangerouslySetInnerHTML',
  },
  {
    rule_id: 'SQL001', rule_name: 'Dynamic SQL construction',
    category: 'SQL injection', default_severity: 'High',
    pattern: 'SQL string concatenation or string interpolation',
  },
  {
    rule_id: 'SEC001', rule_name: 'Possibly hard-coded credential',
    category: 'Secrets', default_severity: 'High',
    pattern: 'credential-like variable assigned to a string literal',
  },
  {
    rule_id: 'EXEC001', rule_name: 'Dynamic code execution',
    category: 'Code execution', default_severity: 'High',
    pattern: 'eval(), exec(), or new Function()',
  },
  {
    rule_id: 'CRYPTO001', rule_name: 'Outdated hashing algorithm',
    category: 'Cryptography', default_severity: 'Medium',
    pattern: 'MD5 / SHA-1 hashing call',
  },
  {
    rule_id: 'DEBUG001', rule_name: 'Console debugging statement',
    category: 'Maintainability', default_severity: 'Low',
    pattern: 'console.log()',
  },
  {
    rule_id: 'DEBUG002', rule_name: 'Blocking alert dialog',
    category: 'Maintainability', default_severity: 'Low',
    pattern: 'alert()',
  },
];

const matchers: Record<string, RegExp> = {
  XSS001: /\binnerHTML\s*=|dangerouslySetInnerHTML\s*=|\bdocument\.write\s*\(/,
  SQL001: /\b(SELECT|INSERT|UPDATE|DELETE)\b.{0,120}(\$\{|\+\s*[a-z_$]|\{\s*[\w.]+\s*\}|%s)/i,
  SEC001: /\b(?:password|api[_-]?key|secret|access[_-]?token|private[_-]?key)\b\s*[:=]\s*['"`][^'"`\s]{8,}['"`]/i,
  EXEC001: /\beval\s*\(|\bexec\s*\(|\bnew\s+Function\s*\(/,
  CRYPTO001: /\b(?:md5|sha1|sha-1)\s*\(|createHash\s*\(\s*['"](?:md5|sha1)['"]/i,
  DEBUG001: /\bconsole\.log\s*\(/,
  DEBUG002: /\balert\s*\(/,
};

const MAX_FINDINGS = 400;

export function scanSourceFiles(files: SourceFile[]): Finding[] {
  const findings: Finding[] = [];

  for (const file of files) {
    if (file.content === undefined) continue;
    const lines = file.content.split(/\r?\n/);

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (line.length > 4_000 || /^\s*(\/\/|#|\*|<!--)/.test(line)) continue;

      for (const rule of RULES) {
        if (!matchers[rule.rule_id].test(line)) continue;

        findings.push({
          finding_id: newId(),
          rule_id: rule.rule_id,
          file_id: file.file_id,
          severity: rule.default_severity,
          line_number: index + 1,
          message: `${rule.rule_name}; check whether the input is controlled or validated.`,
        });

        if (findings.length >= MAX_FINDINGS) return findings;
      }
    }
  }

  return findings;
}
