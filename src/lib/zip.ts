// FR-1, FR-3 · Owner: Md. Redwan Rashid Nice (0242310005341105) — safe, in-memory ZIP extraction (nothing is stored)
import JSZip from 'jszip';
import type { FileItem } from '../types';
const TEXT = /\.(js|jsx|ts|tsx|py|php|java|cs|rb|go|rs|html?|vue|svelte|sh)$/i;
export async function readZip(f: File): Promise<FileItem[]> {
  if (!/\.zip$/i.test(f.name)) throw new Error('Only .zip files are supported.');
  if (!f.size) throw new Error('The file is empty.');
  if (f.size > 50 * 1024 * 1024) throw new Error('ZIP exceeds the 50 MB limit.');
  let z: JSZip;
  try { z = await JSZip.loadAsync(f); } catch { throw new Error('Not a valid or readable ZIP archive.'); }
  const out: FileItem[] = [];
  for (const e of Object.values(z.files)) {
    if (e.dir || e.name.includes('..') || /(^|\/)(node_modules|\.git)\//.test(e.name)) continue; // zip-slip + noise guard
    const b = await e.async('uint8array');
    out.push({ path: e.name, size: b.length, text: TEXT.test(e.name) && b.length < 60000 ? new TextDecoder().decode(b).slice(0, 4000) : undefined });
  }
  if (!out.length) throw new Error('The ZIP archive contains no analysable files.');
  return out;
}
