// FR-4 · Owner: Most. Sumaiya Akter Shraboni (241-35-514) — language share + 20+ framework detection
import type { FileItem } from '../types';
const E: Record<string, [string, string]> = {
  js: ['JavaScript', '#f7df1e'], jsx: ['JavaScript', '#f7df1e'], ts: ['TypeScript', '#3178c6'], tsx: ['TypeScript', '#3178c6'],
  py: ['Python', '#3572A5'], php: ['PHP', '#4F5D95'], java: ['Java', '#b07219'], cs: ['C#', '#178600'], cpp: ['C++', '#f34b7d'],
  c: ['C', '#888'], h: ['C', '#888'], rb: ['Ruby', '#701516'], go: ['Go', '#00ADD8'], rs: ['Rust', '#dea584'],
  swift: ['Swift', '#ffac45'], kt: ['Kotlin', '#A97BFF'], dart: ['Dart', '#00B4AB'], html: ['HTML', '#e34c26'], htm: ['HTML', '#e34c26'],
  css: ['CSS', '#563d7c'], scss: ['SCSS', '#c6538c'], vue: ['Vue', '#41b883'], svelte: ['Svelte', '#ff3e00'], sh: ['Shell', '#89e051'],
  sql: ['SQL', '#e38c00'], lua: ['Lua', '#3b3b9a'], r: ['R', '#198CE7'], scala: ['Scala', '#c22d40'], ex: ['Elixir', '#6e4a7e'], hs: ['Haskell', '#5e5086'],
};
export function langShare(files: FileItem[]) {
  const t: Record<string, { b: number; c: string }> = {};
  for (const f of files) {
    const e = E[f.path.split('.').pop()!.toLowerCase()];
    if (e) (t[e[0]] ??= { b: 0, c: e[1] }).b += Math.max(f.size, 1);
  }
  const sum = Object.values(t).reduce((s, x) => s + x.b, 0) || 1;
  return Object.entries(t).map(([name, x]) => ({ name, color: x.c, pct: +((x.b / sum) * 100).toFixed(1) })).sort((a, b) => b.pct - a.pct);
}
const FW: [string, RegExp][] = [
  ['React', /\.(jsx|tsx)$/], ['Next.js', /next\.config/], ['Vue.js', /\.vue$|vue\.config/], ['Nuxt', /nuxt\.config/], ['Angular', /angular\.json/],
  ['Svelte', /\.svelte$|svelte\.config/], ['Node.js', /package\.json$/], ['Vite', /vite\.config/], ['Webpack', /webpack\.config/], ['Tailwind CSS', /tailwind\.config/],
  ['Laravel', /(^|\/)artisan$/], ['Symfony', /symfony\.lock/], ['Django', /manage\.py$/], ['Flask/Python', /requirements\.txt$/], ['Spring Boot', /pom\.xml$|build\.gradle/],
  ['Ruby on Rails', /(^|\/)Gemfile$/], ['Docker', /Dockerfile|docker-compose/], ['Kubernetes', /(^|\/)(k8s|helm)\//], ['WordPress', /wp-content|wp-config/],
  ['Flutter', /pubspec\.yaml/], ['GitHub Actions', /\.github\/workflows/], ['Go Modules', /go\.mod$/], ['Rust Cargo', /Cargo\.toml$/], ['Composer (PHP)', /composer\.json$/],
];
export const detectFrameworks = (paths: string[]) => FW.filter(([, re]) => paths.some(p => re.test(p))).map(([n]) => n);
