import type { Analysis } from '../shared/types';
import { compareProjects } from './compare';

interface ComparisonProps {
  first: Analysis;
  second: Analysis;
}

export default function Comparison({ first, second }: ComparisonProps) {
  const { rows } = compareProjects(first, second);

  return (
    <section className="panel overflow-x-auto">
      <h3 className="mb-4 text-xl font-semibold">Side-by-side comparison</h3>
      <table className="w-full min-w-[540px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-600">
            <th scope="col" className="p-3">Metric</th>
            <th scope="col" className="p-3">{first.project_name}</th>
            <th scope="col" className="p-3">{second.project_name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.label} className="border-b border-slate-800">
              <th scope="row" className="muted p-3 font-normal">{row.label}</th>
              <td className="p-3">{row.first}</td>
              <td className="p-3">{row.second}</td>
            </tr>
          ))}
          <tr className="border-b border-slate-800">
            <th scope="row" className="muted p-3 font-normal">Detected stack</th>
            <td className="p-3">{first.frameworks.map(item => item.framework_name).join(', ') || 'None detected'}</td>
            <td className="p-3">{second.frameworks.map(item => item.framework_name).join(', ') || 'None detected'}</td>
          </tr>
        </tbody>
      </table>
      <p className="muted mt-4 text-xs">
        *These are code-pattern heuristics, not reliable evidence of AI authorship or plagiarism.
        GitHub projects may also have different amounts of sampled code.
      </p>
    </section>
  );
}
