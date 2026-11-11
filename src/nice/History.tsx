import { useState } from 'react';
import type { Analysis } from '../shared/types';
import { removeAnalysis } from '../shared/storage';

interface HistoryProps {
  items: Analysis[];
  onOpen: (analysis: Analysis) => void;
  onChange: () => void;
}

export default function History({ items, onOpen, onChange }: HistoryProps) {
  const [search, setSearch] = useState('');

  const results = items.filter(item =>
    [item.project_name, item.source_type, item.source_url ?? '']
      .join(' ')
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  function deleteItem(id: string) {
    if (!window.confirm('Remove this analysis from the browser history?')) return;
    try {
      removeAnalysis(id);
      onChange();
    } catch {
      window.alert('Could not update local history. Check your browser storage settings.');
    }
  }

  return (
    <section className="panel">
      <h3 className="mb-4 text-xl font-semibold">Past analyses</h3>
      <input
        className="field mb-4"
        type="search"
        aria-label="Search past projects"
        placeholder="Search project name or GitHub URL"
        value={search}
        onChange={event => setSearch(event.target.value)}
      />

      <div className="space-y-3">
        {results.map(item => (
          <article key={item.analysis_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-800/60 p-4">
            <div>
              <h4 className="font-semibold">{item.project_name}</h4>
              <p className="muted mt-1 text-xs">
                {new Date(item.analyzed_at).toLocaleString()} · {item.source_type} · score {item.quality_score}/100
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn" type="button" onClick={() => onOpen(item)}>Open</button>
              <button className="rounded-lg px-3 text-rose-300 hover:bg-rose-950/40" type="button" onClick={() => deleteItem(item.analysis_id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
      {!items.length && <p className="muted mt-4 text-sm">Nothing saved yet. Your first analysis will appear here.</p>}
      {items.length > 0 && !results.length && <p className="muted mt-4 text-sm">No matching projects.</p>}
      <p className="muted mt-5 text-xs">Saved on this browser only. Source code is not kept in history.</p>
    </section>
  );
}
