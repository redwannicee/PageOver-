import { useEffect, useState } from 'react';
import Submit from './components/Submit';
import Dashboard from './components/Dashboard';
import Compare from './components/Compare';
import History from './components/History';
import { get } from './lib/store';
export default function App() {
  const [h, setH] = useState(location.hash || '#/');
  useEffect(() => { const f = () => setH(location.hash || '#/'); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  const [, p, id] = h.split('/'), cur = p === 'result' ? get(id) : undefined;
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <nav className="flex items-center justify-between border-b border-white/10 px-6 py-3">
        <a href="#/"><img src="./logo.png" alt="PageOver" className="h-10" /></a>
        <div className="flex gap-5 text-sm text-slate-300"><a href="#/compare">Compare</a><a href="#/history">History</a></div>
      </nav>
      <main className="mx-auto w-full max-w-5xl flex-1 p-6">
        {p === 'compare' ? <Compare /> : p === 'history' ? <History /> : cur ? <Dashboard a={cur} /> : (
          <div className="space-y-8 py-10 text-center">
            <h1 className="text-5xl font-extrabold">Judge any project. <span className="text-rose-400">Instantly.</span></h1>
            <p className="mx-auto max-w-xl text-slate-400">Upload a ZIP or paste a GitHub URL — languages, frameworks, bugs, AI usage and uniqueness, all analyzed in your browser.</p>
            <Submit onDone={a => { location.hash = '#/result/' + a.id; }} />
          </div>)}
      </main>
      <footer className="border-t border-white/10 p-5 text-center text-sm text-slate-500">
        PageOver · Developed by <b className="text-indigo-300">Md. Redwan Rashid Nice</b> &amp; <b className="text-indigo-300">Most. Sumaiya Akter Shraboni</b>
      </footer>
    </div>
  );
}
