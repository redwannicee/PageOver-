// FR-10 · Owner: Md. Redwan Rashid Nice (0242310005341105) — searchable history log
import { useState } from 'react';
import { all, clear } from '../lib/store';
export default function History() {
  const [q, setQ] = useState(''), [, n] = useState(0), list = all().filter(a => a.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-bold">History</h1>
        <div className="flex gap-2"><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2" /><button className="btn-o" onClick={() => { clear(); n(k => k + 1); }}>Clear</button></div></div>
      {list.length ? list.map(a => (
        <a key={a.id} href={`#/result/${a.id}`} className="box flex items-center justify-between hover:border-indigo-400">
          <div><div className="font-semibold">{a.name}</div><div className="text-xs text-slate-400">{new Date(a.at).toLocaleString()} · {a.langs[0]?.name ?? '—'}</div></div>
          <div className="flex gap-2 text-xs"><span className="rounded-full bg-red-500/20 px-2 py-1 text-red-300">{a.bugs.length} bugs</span><span className="rounded-full bg-indigo-500/20 px-2 py-1 text-indigo-300">{a.score}/100</span></div>
        </a>)) : <p className="text-slate-400">No analyses yet. History is kept only in this browser.</p>}
    </div>
  );
}
