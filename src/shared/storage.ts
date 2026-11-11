import type { Analysis } from './types';

const HISTORY_KEY = 'pageover.history.v2';
const MAX_HISTORY = 20;

export function getHistory(): Analysis[] {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(stored) ? stored as Analysis[] : [];
  } catch {
    return []; // A broken old entry shouldn't stop the app from opening.
  }
}

export function saveAnalysis(analysis: Analysis): void {
  const existing = getHistory().filter(item => item.analysis_id !== analysis.analysis_id);

  // Keep the results, not the original source code. LocalStorage is small and
  // we don't want a student's ZIP contents sitting there indefinitely.
  const withoutSource = {
    ...analysis,
    source_files: analysis.source_files.map(({ content: _content, ...file }) => file),
  };

  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([withoutSource, ...existing].slice(0, MAX_HISTORY)),
    );
  } catch {
    throw new Error('Your browser storage is full. Delete some saved analyses and try again.');
  }
}

export function removeAnalysis(id: string): void {
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(getHistory().filter(item => item.analysis_id !== id)),
  );
}
