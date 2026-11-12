// FR-8 · Owner: Md. Redwan Rashid Nice (0242310005341105) — analysis dashboard
import { Doughnut } from 'react-chartjs-2';
import type { Analysis } from '../types';
import { exportPdf } from '../lib/pdf';
const SEV = { high: 'bg-red-500/20 text-red-300', medium: 'bg-amber-500/20 text-amber-300', low: 'bg-sky-500/20 text-sky-300' };
const Card = ({ l, v, c }: { l: string; v: string | number; c: string }) => <div className="box !p-4"><div className="text-xs uppercase text-slate-400">{l}</div><div className={`text-3xl font-bold ${c}`}>{v}</div></div>;
export default function Dashboard({ a }: { a: Analysis }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-bold">{a.name}</h1><p className="break-all text-sm text-slate-400">{a.source}</p>{a.desc && <p className="text-sm text-slate-300">{a.desc}</p>}</div>
        <div className="flex gap-2"><a href="#/compare" className="btn-o">Compare</a><button className="btn" onClick={() => exportPdf(a)}>Download PDF</button></div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card l="Overall" v={a.score + '/100'} c="text-indigo-400" /><Card l="Uniqueness (est.)" v={a.unique + '%'} c="text-teal-400" />
        <Card l="AI usage (est.)" v={a.ai + '%'} c="text-purple-400" /><Card l="Bugs" v={a.bugs.length} c="text-red-400" /><Card l="Files" v={a.files} c="text-amber-400" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="box"><h2 className="mb-3 font-semibold">Languages</h2>
          <div className="h-56"><Doughnut data={{ labels: a.langs.map(l => l.name), datasets: [{ data: a.langs.map(l => l.pct), backgroundColor: a.langs.map(l => l.color), borderWidth: 0 }] }} options={{ maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } } }} /></div></div>
        <div className="box"><h2 className="mb-3 font-semibold">Frameworks & Platforms</h2>
          <div className="flex flex-wrap gap-2">{a.platforms.length ? a.platforms.map(p => <span key={p} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-1 text-sm">{p}</span>) : <p className="text-slate-400">None detected.</p>}</div>
          <h2 className="mb-2 mt-5 font-semibold">Live Deployment</h2>
          {a.live.length ? a.live.map(l => <p key={l.url} className="truncate text-sm"><span className={l.ok ? 'text-green-400' : 'text-red-400'}>{l.ok ? '● Reachable' : '● Unreachable'}</span> {l.label} — <span className="text-slate-400">{l.url}</span></p>) : <p className="text-sm text-slate-400">Not applicable for ZIP uploads.</p>}</div>
      </div>
      <div className="box"><h2 className="mb-3 font-semibold">Bugs & Security Findings</h2>
        {a.bugs.length ? a.bugs.map((b, i) => <div key={i} className="flex items-start gap-3 border-b border-white/5 py-2 text-sm last:border-0"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${SEV[b.sev]}`}>{b.sev.toUpperCase()}</span><div>{b.desc}<div className="font-mono text-xs text-slate-500">{b.file}</div></div></div>) : <p className="text-green-400">No issues detected.</p>}</div>
      <p className="text-xs text-slate-500">AI-usage and uniqueness are rule-based heuristic estimates, not proof.</p>
    </div>
  );
}
