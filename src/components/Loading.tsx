// Full-screen analysis overlay: spinner + step messages + progress bar
import { useEffect, useState } from 'react';
const MSGS = ['Reading file structure…', 'Detecting languages…', 'Scanning dependencies…', 'Identifying frameworks…', 'Running bug detection…', 'Analysing AI patterns…', 'Computing uniqueness score…', 'Checking availability…', 'Building your report…'];
export default function Loading() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(n => Math.min(n + 1, MSGS.length - 1)), 900); return () => clearInterval(t); }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur">
      <div className="box w-80 text-center">
        <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-[3px] border-white/15 border-t-indigo-400" />
        <p className="text-lg font-semibold">Analyzing project…</p>
        <p className="mb-5 mt-1 font-mono text-sm text-slate-400">{MSGS[i]}</p>
        <div className="h-1 overflow-hidden rounded bg-slate-800"><div className="h-full rounded bg-gradient-to-r from-indigo-600 to-rose-500 transition-all duration-700" style={{ width: `${Math.round(((i + 1) / MSGS.length) * 90)}%` }} /></div>
      </div>
    </div>
  );
}
