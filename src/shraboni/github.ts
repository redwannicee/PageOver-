import { Octokit } from '@octokit/rest';
import type { ProjectInput, RepoMetadata, SourceFile } from '../shared/types';
import { countLines, fileExtension, isReadableSource, newId } from '../shared/types';
import { detectFrameworks, detectLanguages } from './detection';

const github = new Octokit({ request: { timeout: 20_000 } });
const MAX_TREE_FILES = 6_000;
const MAX_SAMPLED_FILES = 75;
const MAX_SOURCE_BYTES = 120_000;

const ignoredFolders = /(^|\/)(\.git|node_modules|vendor|dist|build|coverage|\.next|target)(\/|$)/i;
const importantConfig = /(^|\/)(package\.json|composer\.json|pubspec\.yaml|pyproject\.toml|pom\.xml|Gemfile|artisan|manage\.py|Cargo\.toml|Dockerfile|requirements[^/]*\.txt|[^/]*\.csproj|[^/]*\.gradle(\.kts)?|[^/]*\.config\.[cm]?[jt]s)$|\.github\/workflows\//i;

export function parseRepositoryUrl(value: string): { owner: string; repo: string } {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Please enter a valid repository link.');
  }

  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com') {
    throw new Error('Use a public https://github.com/owner/repository link.');
  }

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length !== 2) {
    throw new Error('The link should point to a repository, not a folder or issue.');
  }

  const [owner, rawRepository] = segments;
  const repo = rawRepository.replace(/\.git$/i, '');
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
    throw new Error('The owner or repository name contains invalid characters.');
  }

  return { owner, repo };
}

function decodeBase64(content: string): string {
  const bytes = Uint8Array.from(atob(content.replace(/\s/g, '')), char => char.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

async function fetchFileContents(
  owner: string,
  repo: string,
  branch: string,
  files: SourceFile[],
): Promise<number> {
  let successful = 0;

  // Five at a time keeps the browser from firing dozens of requests together.
  for (let start = 0; start < files.length; start += 5) {
    const batch = files.slice(start, start + 5);

    await Promise.all(batch.map(async file => {
      try {
        const response = await github.repos.getContent({
          owner, repo, path: file.file_path, ref: branch,
        });
        const data = response.data;

        if (!Array.isArray(data) && data.type === 'file' && 'content' in data && data.content) {
          file.content = decodeBase64(data.content);
          file.line_count = countLines(file.content);
          successful++;
        }
      } catch {
        // Individual binary/large/unavailable files should not fail the scan.
      }
    }));
  }

  return successful;
}

export async function ingestGitHub(rawUrl: string): Promise<ProjectInput> {
  const { owner, repo } = parseRepositoryUrl(rawUrl);

  try {
    const [repositoryResponse, languageResponse] = await Promise.all([
      github.repos.get({ owner, repo }),
      github.repos.listLanguages({ owner, repo }),
    ]);

    const repository = repositoryResponse.data;
    const treeResponse = await github.git.getTree({
      owner,
      repo,
      tree_sha: repository.default_branch,
      recursive: 'true',
    });

    const entries = treeResponse.data.tree.filter(entry =>
      entry.type === 'blob' && entry.path && !ignoredFolders.test(entry.path),
    );
    const fileEntries = entries.slice(0, MAX_TREE_FILES);

    const source_files: SourceFile[] = fileEntries.map(entry => ({
      file_id: newId(),
      file_path: entry.path!,
      extension: fileExtension(entry.path!),
      size_bytes: entry.size ?? 0,
      line_count: 0,
    }));

    const eligible = source_files.filter(file =>
      file.size_bytes <= MAX_SOURCE_BYTES && isReadableSource(file.file_path),
    );

    // Read config files first, otherwise a large repository might use the
    // entire sample allowance on ordinary source files.
    const sample = eligible
      .sort((a, b) => Number(importantConfig.test(b.file_path)) - Number(importantConfig.test(a.file_path)))
      .slice(0, MAX_SAMPLED_FILES);

    const fetchedCount = await fetchFileContents(owner, repo, repository.default_branch, sample);

    const metadata: RepoMetadata = {
      repo_id: repository.id,
      owner,
      repo_name: repository.name,
      description: repository.description ?? '',
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      default_branch: repository.default_branch,
      license: repository.license?.spdx_id ?? null,
      has_tests: entries.some(item => /(^|\/)(__tests__|tests?|spec)(\/|\.)|\.(test|spec)\./i.test(item.path ?? '')),
      has_readme: entries.some(item => /(^|\/)README(\.|$)/i.test(item.path ?? '')),
      has_ci: entries.some(item => /(^|\/)\.github\/workflows\//i.test(item.path ?? '')),
      homepage: repository.homepage,
    };

    const notes = [
      `Read ${fetchedCount} source/config files out of ${source_files.length} listed files. Security checks use only the files successfully read.`,
    ];
    if (treeResponse.data.truncated || entries.length > MAX_TREE_FILES) {
      notes.push('The repository file listing was cut off; some files may be missing.');
    }

    return {
      project_name: repository.name,
      source_type: 'github',
      source_url: repository.html_url,
      zip_file_name: null,
      repo_metadata: metadata,
      source_files,
      language_stats: detectLanguages(source_files, languageResponse.data),
      frameworks: detectFrameworks(source_files),
      notes,
    };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    if (/404|not found/i.test(message)) throw new Error('This repository was not found. Check that it is public.');
    if (/403|rate limit/i.test(message)) throw new Error('GitHub has limited these API requests. Try again later.');
    throw new Error(`Could not read the repository: ${message}`);
  }
}
