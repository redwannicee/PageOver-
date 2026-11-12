# PageOver — Intelligent Project Analysis Platform

100% client-side web app: **React 19 + Vite + TypeScript, Tailwind CSS v4, TanStack Query, Octokit, Chart.js, JSZip, jsPDF**.
Upload a ZIP or paste a GitHub URL to get languages, frameworks, bugs, AI-usage and uniqueness estimates, live-link checks, comparison, history and a branded PDF report. No server, no database.

## Team & module ownership (SE331, Group 05)
| Member | ID | Functional requirements | Files |
|---|---|---|---|
| Most. Sumaiya Akter Shraboni | 241-35-514 | FR-2, 4, 7, 9, 11 | `lib/github.ts`, `lib/languages.ts`, `lib/pdf.ts`, `components/Compare.tsx` |
| Md. Redwan Rashid Nice | 0242310005341105 | FR-1, 3, 5, 6, 8, 10 | `lib/zip.ts`, `lib/rules.ts`, `lib/store.ts`, `components/Dashboard.tsx`, `components/History.tsx` |

`components/Submit.tsx` is shared (ZIP form: Nice, URL form: Shraboni). Each file header names its owner.
> GitHub's *Contributors* graph counts real commits. Each member should commit/push their own files from their own GitHub account.

## Run
```bash
npm install
npm run dev        # local dev
npm run build      # production build -> dist/
```

## Deploy to GitHub Pages
Push to `main`, then **Settings → Pages → Source: GitHub Actions**. `.github/workflows/deploy.yml` builds and publishes automatically.

> AI-usage and uniqueness are rule-based heuristic estimates, not proof. Unauthenticated GitHub API limit: 60 requests/hour per IP.
