// FR-9 · Owner: Most. Sumaiya Akter Shraboni (241-35-514) — side-by-side comparison (+ analyze a new project for slot B)
import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { all, get } from '../lib/store';
import Submit from './Submit';
export default function Compare() {
  const list = all(), [a, setA] = useState(list[0]?.id ?? ''), [b, setB] = useState(list[1]?.id ?? ''), [, n] = useState(0);
  const A = get(a), B = get(b), sel = 'w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2';
  const m = (x: NonNullable<typeof A>) => [x.score, x.unique, x.ai, x.bugs.length, x.langs.length];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Compare Projects</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {([[a, setA, 'Project A'], [b, setB, 'Project B']] as const).map(([v, s, l]) => (
          <div key={l} className="box"><h3 className="mb-2 font-semibold">{l}</h3><select className={sel} value={v} onChange={e => s(e.target.value)}><option value="">— select —</option>{list.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>))}
      </div>
      <details className="box"><summary className="cursor-pointer font-semibold">Analyze a new project for slot B</summary><div className="mt-4"><Submit onDone={x => { setB(x.id); n(k => k + 1); }} /></div></details>
      {A && B ? (<>
        <div className="box"><div className="h-72"><Bar data={{ labels: ['Overall', 'Uniqueness', 'AI usage', 'Bugs', 'Languages'], datasets: [{ label: A.name, data: m(A), backgroundColor: '#6366f1' }, { label: B.name, data: m(B), backgroundColor: '#fb7185' }] }} options={{ maintainAspectRatio: false, scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } }, plugins: { legend: { labels: { color: '#94a3b8' } } } }} /></div></div>
        <div className="box text-center"><p className="text-slate-400">Verdict (overall score)</p><p className="text-3xl font-bold text-indigo-300">{A.score === B.score ? 'Tie' : (A.score > B.score ? A : B).name}</p><p className="text-sm text-slate-400">{Math.abs(A.score - B.score)}-point difference</p></div>
      </>) : <p className="text-slate-400">Select two analyses to compare them.</p>}
    </div>
  );
}
