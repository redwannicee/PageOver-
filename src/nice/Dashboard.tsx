import { useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
} from 'chart.js';
import type { Analysis, Severity } from '../shared/types';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

const chartColors = ['#8176f5', '#35bea6', '#eeb767', '#ea829b', '#70a9f5', '#b8a4ed', '#a1d68d'];
const severities: Severity[] = ['High', 'Medium', 'Low'];

export default function Dashboard({ analysis }: { analysis: Analysis }) {
  const [severityFilter, setSeverityFilter] = useState<'All' | Severity>('All');
  const [findingSearch, setFindingSearch] = useState('');

  const fileNameById = useMemo(
    () => new Map(analysis.source_files.map(file => [file.file_id, file.file_path])),
    [analysis.source_files],
  );

  const visibleFindings = analysis.findings.filter(finding => {
    const path = fileNameById.get(finding.file_id) ?? '';
    return (severityFilter === 'All' || finding.severity === severityFilter) &&
      `${path} ${finding.rule_id} ${finding.message}`.toLowerCase().includes(findingSearch.toLowerCase());
  });

  const stats = [
    ['Files', analysis.total_files],
    ['Sampled LOC', analysis.total_loc],
    ['Quality', `${analysis.quality_score}/100 · ${analysis.quality_grade}`],
    ['Potential findings', analysis.findings.length],
    ['AI-style indicator*', `${analysis.ai_usage_pct}%`],
    ['Code variation*', `${analysis.uniqueness_pct}%`],
    ['Frameworks', analysis.frameworks.length],
    ['Languages', analysis.language_stats.length],
  ] as const;

  return (
    <div className="space-y-5">
      <section aria-label="Analysis summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="stat">
            <p className="muted text-sm">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel">
          <h3 className="mb-4 font-semibold">Language breakdown</h3>
          <div className="flex h-72 justify-center">
            {analysis.language_stats.length ? (
              <Doughnut
                data={{
                  labels: analysis.language_stats.map(item => item.language_name),
                  datasets: [{
                    data: analysis.language_stats.map(item => item.percentage),
                    backgroundColor: analysis.language_stats.map((_, i) => chartColors[i % chartColors.length]),
                  }],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { color: '#d4dbed' } } },
                }}
              />
            ) : (
              <p className="muted self-center">No recognized languages found.</p>
            )}
          </div>
        </section>

        <section className="panel">
          <h3 className="mb-4 font-semibold">Rule matches by severity</h3>
          <div className="h-72">
            <Bar
              data={{
                labels: severities,
                datasets: [{
                  label: 'Matches',
                  data: severities.map(severity => analysis.findings.filter(item => item.severity === severity).length),
                  backgroundColor: ['#eb7892', '#f0bd67', '#71b5eb'],
                }],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: '#d4dbed' } },
                  y: { beginAtZero: true, ticks: { color: '#d4dbed', precision: 0 } },
                },
              }}
            />
          </div>
        </section>
      </div>

      <section className="panel">
        <h3 className="mb-3 font-semibold">Frameworks and platforms</h3>
        {analysis.frameworks.length ? (
          <div className="flex flex-wrap gap-2">
            {analysis.frameworks.map(item => (
              <span
                key={item.framework_id}
                title={`Detected from ${item.detected_from}`}
                className="rounded-full bg-indigo-500/20 px-3 py-1 text-sm text-indigo-200"
              >
                {item.framework_name} · {item.category}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted text-sm">No framework matched the available config files.</p>
        )}
      </section>

      <section className="panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">Potential security / code issues</h3>
          <div className="flex flex-wrap gap-2">
            <input
              className="field max-w-56"
              aria-label="Search findings"
              placeholder="Filter file or rule"
              value={findingSearch}
              onChange={event => setFindingSearch(event.target.value)}
            />
            <select
              className="field max-w-36"
              aria-label="Severity filter"
              value={severityFilter}
              onChange={event => setSeverityFilter(event.target.value as 'All' | Severity)}
            >
              <option value="All">All severities</option>
              {severities.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>

        <div className="max-h-96 overflow-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-slate-700 text-slate-300">
              <tr>
                <th className="p-2">Severity</th>
                <th className="p-2">Rule</th>
                <th className="p-2">Location</th>
                <th className="p-2">What to check</th>
              </tr>
            </thead>
            <tbody>
              {visibleFindings.map(finding => (
                <tr key={finding.finding_id} className="border-b border-slate-800 align-top">
                  <td className="p-2">{finding.severity}</td>
                  <td className="p-2">{finding.rule_id}</td>
                  <td className="break-all p-2">{fileNameById.get(finding.file_id)}:{finding.line_number}</td>
                  <td className="p-2">{finding.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleFindings.length && (
            <p className="muted py-4 text-sm">No matches for this filter. That does not mean the project is vulnerability-free.</p>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel">
          <h3 className="mb-3 font-semibold">Deployment</h3>
          {analysis.live_checks.length ? analysis.live_checks.map(check => (
            <p key={check.check_id} className="mb-2 break-all text-sm">
              <span className="muted">{check.url}</span> — <strong>{check.status}</strong>
              {check.http_status ? ` (HTTP ${check.http_status})` : ''}
            </p>
          )) : <p className="muted text-sm">No deployment URL checked yet.</p>}
          <p className="muted mt-3 text-xs">An “unknown” result usually means the browser could not verify the response.</p>
        </section>

        <section className="panel">
          <h3 className="mb-3 font-semibold">Analysis notes</h3>
          <ul className="muted list-disc space-y-2 pl-5 text-sm">
            {analysis.notes.map((note, index) => <li key={index}>{note}</li>)}
          </ul>
          <p className="muted mt-3 text-xs">*Indicators are simple heuristics; they do not establish who wrote the code.</p>
        </section>
      </div>
    </div>
  );
}
