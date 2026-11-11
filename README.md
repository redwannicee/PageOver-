# PageOver

A browser-based project checker built for SE331 (Group 05, C1).

PageOver accepts a public GitHub repository or a local ZIP. It shows the languages and frameworks it recognizes, a handful of potential code/security issues, a simple quality score, and a PDF summary. You can keep previous results in the same browser and compare two projects.

## Getting started

You'll need Node.js 20.19+ (or 22.12+) and npm.

```bash
npm install
npm run dev
```

Open the local address Vite prints in the terminal. Before merging to `main`:

```bash
npm run build
npm run preview
```

There is no server, account system, or external AI model. GitHub links use the public GitHub REST API through Octokit. Local ZIPs are read with JSZip in your browser.

## Who is working on what?

| Person | Folder | Assigned features |
| --- | --- | --- |
| Shraboni | `src/shraboni/` | GitHub repository input, stack detection, deployment check, comparison, PDF export |
| Nice | `src/nice/` | ZIP upload, rule-based scanning, scoring, results dashboard, history |

The app entry point is `src/App.tsx`. We use `src/shared/types.ts` for the ER diagram entities, and `src/shared/storage.ts` for LocalStorage.

For GitHub: use `feature/shraboni` and `feature/nice` branches. Each person should commit their own folder. Agree on changes to `src/shared/` and `src/App.tsx` before either branch changes them. That should reduce merge conflicts.

## Quick manual checks

1. Use a small, public GitHub repository. Check that its name, languages, and file list appear. Try a bad URL too.
2. Upload a small ZIP with `package.json` and a few `.js`/`.ts` files. Then test a non-ZIP renamed to `.zip`.
3. Put `console.log(...)`, `eval(...)`, or `element.innerHTML = ...` in a sample file and check the finding's path and line number.
4. Analyze a second project into **slot B** and compare the two summaries.
5. Export a PDF and check the second page if there are many findings.
6. Refresh the browser, open a saved analysis, search the history, and delete one item.

These are test steps, not claims that every environment has been tested.

## Known limitations

- Public GitHub API calls can hit an unauthenticated rate limit. Source scanning samples up to 75 readable files (120 KB each); the tree view is capped at 6,000 entries.
- ZIP files are limited to 25 MB compressed, 3,000 files, and 80 MB unpacked. Readable text is limited to 1 MB per file and 12 MB in total. ZIPs aren't executed or extracted onto disk.
- Live-site checks can say **unknown** because many sites don't allow cross-origin browser requests. **Unknown** is not the same as offline.
- The AI-style number and code-variation number are simple local heuristics, not reliable authorship or plagiarism detection. The security scanner uses line-based patterns and is not a replacement for code review.
- History is stored in LocalStorage for this browser. It keeps results for up to 20 analyses, but deliberately doesn't keep raw source content. Clearing browser data removes the history.
- The original course proposal contained some older Laravel/server wording. This version follows the revised client-side React/TypeScript stack.

## Deploying to GitHub Pages

The GitHub Actions workflow under `.github/workflows/deploy.yml` builds the Vite app when `main` is pushed. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.
