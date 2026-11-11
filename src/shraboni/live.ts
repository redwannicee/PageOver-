import type { LiveCheck } from '../shared/types';
import { newId } from '../shared/types';

export async function verifyLive(rawUrl: string, checkType = 'homepage'): Promise<LiveCheck> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error('Enter a complete website link, including https://.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP and HTTPS links can be checked.');
  }

  const base: LiveCheck = {
    check_id: newId(),
    url: url.href,
    check_type: checkType,
    is_live: null,
    http_status: null,
    checked_at: new Date().toISOString(),
    status: 'unknown',
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    let response = await fetch(url.href, {
      method: 'HEAD', redirect: 'follow', signal: controller.signal,
    });

    // Some sites don't implement HEAD even though their homepage works.
    if (response.status === 405) {
      response = await fetch(url.href, { method: 'GET', signal: controller.signal });
    }

    return {
      ...base,
      is_live: response.ok,
      http_status: response.status,
      status: response.ok ? 'online' : 'offline',
    };
  } catch {
    // Browser CORS failures look the same as network failures. We cannot
    // honestly call these links offline.
    return base;
  } finally {
    clearTimeout(timeout);
  }
}

export function getLiveCandidate(
  homepage: string | null | undefined,
  owner: string,
  repo: string,
): string | null {
  if (homepage && /^https?:\/\//i.test(homepage)) return homepage;
  if (owner && repo) return `https://${owner}.github.io/${repo}/`;
  return null;
}
