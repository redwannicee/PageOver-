// FR-1 (ZIP drag-and-drop) · Nice  |  FR-2 (GitHub URL) · Shraboni  — both use TanStack Query
import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { readZip } from '../lib/zip';
import { fetchRepo } from '../lib/github';
import { analyze } from '../lib/rules';
import { save } from '../lib/store';
import type { Analysis } from '../types';
export default function Submit({ onDone }: { onDone: (a: Analysis) => void }) {
  const [tab, setTab] = useState<'zip' | 'gh'>('zip'), [url, setUrl] = useState(''), [drag, setDrag] = useState(false);
  const qc = useQueryClient(), ref = useRef<HTMLInputElement>(null);
  const m = useMutation({
    mutationFn: async (i: File | string) => {
      if (typeof i === 'string') {
        const r = await qc.fetchQuery({ queryKey: ['repo', i], queryFn: () => fetchRepo(i), staleTime: 5 * 60_000 });
        return analyze(r.name, r.source, r.files, r.live, r.desc);
      }
      return analyze(i.name.replace(/\.zip$/i, ''), 'ZIP upload: ' + i.name, await readZip(i));
    },
    onSuccess: a => { save(a); onDone(a); },
  });
  const t = (k: 'zip' | 'gh') => `flex-1 rounded-lg py-2 ${tab === k ? 'bg-slate-800' : 'text-slate-400'}`;
  return (
    <div className="box mx-auto w-full max-w-xl">
      <div className="mb-4 flex gap-1 rounded-xl bg-slate-950 p-1"><button className={t('zip')} onClick={() => setTab('zip')}>Upload ZIP</button><button className={t('gh')} onClick={() => setTab('gh')}>GitHub URL</button></div>
      {tab === 'zip' ? (
        <div onClick={() => ref.current?.click()} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) m.mutate(f); }}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center ${drag ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/20'}`}>
          <p className="font-semibold">Drop your project .zip here</p><p className="text-sm text-slate-400">or click to browse — max 50 MB</p>
          <input ref={ref} type="file" accept=".zip" hidden onChange={e => { const f = e.target.files?.[0]; if (f) m.mutate(f); e.target.value = ''; }} />
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); m.mutate(url); }} className="space-y-3">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://github.com/owner/repo" className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 font-mono text-sm outline-none focus:border-indigo-400" />
          <button className="btn w-full" disabled={m.isPending}>Analyze Repository →</button>
        </form>
      )}
      {m.isPending && <p className="mt-3 animate-pulse text-center text-sm text-indigo-300">Analyzing… this runs entirely in your browser.</p>}
      {m.isError && <p className="mt-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">⚠ {(m.error as Error).message}</p>}
    </div>
  );
}
