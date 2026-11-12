// FR-2, FR-7 · Owner: Most. Sumaiya Akter Shraboni (241-35-514) — GitHub API via Octokit + live-link check
// FR-2, FR-7 · Owner: Most. Sumaiya Akter Shraboni (241-35-514) — GitHub API via Octokit + live-link check
import { Octokit } from '@octokit/rest';
import type { FileItem, Live } from '../types';
const ok = new Octokit();
export function parseRepo(u: string) {
  const m = u.trim().match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/.*)?$/i);
  if (!m) throw new Error('Invalid URL. Use https://github.com/owner/repo');
  return { o: m[1], r: m[2] };
}
export async function checkLive(items: [string, string][]): Promise<Live[]> {
  return Promise.all(items.filter(([, u]) => /^https?:\/\//.test(u)).map(async ([label, url]) => {
    try { await fetch(url, { mode: 'no-cors', signal: AbortSignal.timeout(8000) }); return { label, url, ok: true }; }
    catch { return { label, url, ok: false }; }
  }));
}
const SRC = /\.(js|jsx|ts|tsx|py|php|java|cs|rb|go|rs|html?|vue|svelte|sh)$/i;
export async function fetchRepo(url: string) {
  const { o, r } = parseRepo(url);
  try {
    const repo = (await ok.repos.get({ owner: o, repo: r })).data;
    const tree = (await ok.git.getTree({ owner: o, repo: r, tree_sha: repo.default_branch, recursive: '1' })).data.tree;
    const files: FileItem[] = tree.filter(t => t.type === 'blob' && t.path).map(t => ({ path: t.path!, size: t.size ?? 0 }));
    const pick = files.filter(f => SRC.test(f.path) && f.size > 0 && f.size < 60000 && !/node_modules|vendor|dist\/|\.min\./.test(f.path)).slice(0, 20);
    await Promise.all(pick.map(async f => {
      try { const res = await fetch(`https://raw.githubusercontent.com/${o}/${r}/${repo.default_branch}/${encodeURI(f.path)}`); if (res.ok) f.text = (await res.text()).slice(0, 4000); } catch { /* skip */ }
    }));
    const live = await checkLive([['Homepage', repo.homepage ?? ''], ['GitHub Pages', `https://${o.toLowerCase()}.github.io/${r}/`]]);
    return { name: repo.name, desc: repo.description ?? '', files, live, source: repo.html_url };
  } catch (e) {
    const s = (e as { status?: number }).status;
    if (s === 403 || s === 429) throw new Error('GitHub API rate limit reached. Please try again later.');
    if (s === 404) throw new Error('Repository not found or it is private.');
    throw new Error('Could not reach GitHub. Check your connection.');
  }
}
