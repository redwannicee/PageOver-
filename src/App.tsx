import { useState } from 'react';
import type { Analysis, ProjectInput } from './shared/types';
import { getHistory, saveAnalysis } from './shared/storage';
import { ingestGitHub } from './shraboni/github';
import { verifyLive, getLiveCandidate } from './shraboni/live';
import { exportPdf } from './shraboni/pdf';
import ComparisonView from './shraboni/Comparison';
import GithubForm from './shraboni/GithubForm';
import { ingestZip } from './nice/zip';
import { analyzeProject } from './nice/scoring';
import ZipUpload from './nice/ZipUpload';
import Dashboard from './nice/Dashboard';
import HistoryView from './nice/History';

type Page = 'analyze' | 'compare' | 'history';
type Slot = 'A' | 'B';

export default function App() {
  const [page, setPage] = useState<Page>('analyze');
  const [slot, setSlot] = useState<Slot>('A');
  const [projectA, setProjectA] = useState<Analysis | null>(null);
  const [projectB, setProjectB] = useState<Analysis | null>(null);
  const [saved, setSaved] = useState<Analysis[]>(() => getHistory());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [liveUrl, setLiveUrl] = useState('');

  const refreshHistory = () => setSaved(getHistory());

  async function startAnalysis(load: () => Promise<ProjectInput>) {
    setBusy(true);
    setError('');

    try {
      const input = await load();
      const result = analyzeProject(input);

      if (input.repo_metadata) {
        const metadata = input.repo_metadata;
        const url = getLiveCandidate(metadata.homepage, metadata.owner, metadata.repo_name);
        if (url) result.live_checks.push(await verifyLive(url, 'repository deployment'));
      }

      saveAnalysis(result);
      refreshHistory();

      if (slot === 'A') {
        setProjectA(result);
        setPage('analyze');
      } else {
        setProjectB(result);
        setPage('compare');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong during analysis.');
    } finally {
      setBusy(false);
    }
  }

  async function checkDeployment() {
    if (!projectA || !liveUrl.trim()) return;
    setBusy(true);
    setError('');

    try {
      const check = await verifyLive(liveUrl, 'manual URL');
      const updated = { ...projectA, live_checks: [...projectA.live_checks, check] };
      saveAnalysis(updated);
      setProjectA(updated);
      refreshHistory();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not check the link.');
    } finally {
      setBusy(false);
    }
  }

  function downloadReport() {
    if (!projectA) return;

    try {
      const report = exportPdf(projectA);
      const updated = { ...projectA, pdf_reports: [...projectA.pdf_reports, report] };
      setProjectA(updated);
      saveAnalysis(updated);
      refreshHistory();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the report.');
    }
  }

  function pickSavedProject(which: Slot, id: string) {
    const selection = saved.find(item => item.analysis_id === id) ?? null;
    if (which === 'A') setProjectA(selection);
    else setProjectB(selection);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-indigo-400">Page</span>Over
            </h1>
            <p className="muted text-xs">Project analysis, in one place</p>
          </div>
          <nav aria-label="Main navigation" className="flex gap-2">
            {(['analyze', 'compare', 'history'] as const).map(item => (
              <button
                key={item}
                type="button"
                className={`rounded-lg px-4 py-2 capitalize ${page === item ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'}`}
                onClick={() => setPage(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        <div>
          <h2 className="mb-2 text-3xl font-bold">Review a project before you submit it.</h2>
          <p className="muted">GitHub repositories and ZIP files · no account required · analysis runs in your browser</p>
        </div>

        {error && (
          <div role="alert" className="flex justify-between gap-4 rounded-xl border border-rose-600 bg-rose-950/40 p-4">
            <p>{error}</p>
            <button type="button" aria-label="Dismiss error" onClick={() => setError('')}>✕</button>
          </div>
        )}

        {(page === 'analyze' || page === 'compare') && (
          <section className="panel space-y-5" aria-label="Start an analysis">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold">New analysis</h3>
              <label htmlFor="slot" className="muted text-sm">Save result to</label>
              <select
                id="slot"
                className="field max-w-24"
                value={slot}
                onChange={event => setSlot(event.target.value as Slot)}
                disabled={busy}
              >
                <option value="A">Slot A</option>
                <option value="B">Slot B</option>
              </select>
            </div>
            <GithubForm busy={busy} onSubmit={url => void startAnalysis(() => ingestGitHub(url))} />
            <div className="muted text-center text-sm">or use a ZIP from your computer</div>
            <ZipUpload busy={busy} onSubmit={file => void startAnalysis(() => ingestZip(file))} />
            {busy && <p role="status" className="text-sm text-indigo-300">Reading files and calculating the results…</p>}
          </section>
        )}

        {page === 'analyze' && projectA && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">Results: {projectA.project_name}</h3>
              <button className="btn" type="button" onClick={downloadReport}>Download PDF</button>
            </div>
            <Dashboard analysis={projectA} />
            <section className="panel">
              <h3 className="mb-3 font-semibold">Check another live link</h3>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="field"
                  type="url"
                  aria-label="Website URL"
                  placeholder="https://my-project.example"
                  value={liveUrl}
                  onChange={event => setLiveUrl(event.target.value)}
                />
                <button className="btn" type="button" disabled={busy || !liveUrl.trim()} onClick={() => void checkDeployment()}>
                  Check link
                </button>
              </div>
            </section>
          </>
        )}

        {page === 'compare' && (
          <>
            <section className="panel">
              <h3 className="mb-3 font-semibold">Choose two projects</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {(['A', 'B'] as const).map(which => (
                  <label key={which}>
                    Project {which}
                    <select
                      className="field mt-1"
                      value={(which === 'A' ? projectA : projectB)?.analysis_id ?? ''}
                      onChange={event => pickSavedProject(which, event.target.value)}
                    >
                      <option value="">Select a saved analysis</option>
                      {saved.map(item => (
                        <option key={item.analysis_id} value={item.analysis_id}>
                          {item.project_name} — {new Date(item.analyzed_at).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </section>
            {projectA && projectB ? (
              <ComparisonView first={projectA} second={projectB} />
            ) : (
              <p className="muted">Analyze a project into slot B, or select two results from history.</p>
            )}
          </>
        )}

        {page === 'history' && (
          <HistoryView
            items={saved}
            onOpen={item => { setProjectA(item); setPage('analyze'); }}
            onChange={refreshHistory}
          />
        )}
      </main>

      <footer className="muted py-8 text-center text-xs">
        PageOver · Group 05, SE331 · Pattern-based results need human review
      </footer>
    </div>
  );
}
