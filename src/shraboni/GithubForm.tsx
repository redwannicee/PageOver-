import { useState } from 'react';
import type { FormEvent } from 'react';

interface GithubFormProps {
  busy: boolean;
  onSubmit: (url: string) => void;
}

export default function GithubForm({ busy, onSubmit }: GithubFormProps) {
  const [url, setUrl] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  }

  return (
    <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
      <input
        type="url"
        required
        aria-label="Public GitHub repository URL"
        className="field"
        placeholder="https://github.com/owner/project"
        value={url}
        disabled={busy}
        onChange={event => setUrl(event.target.value)}
      />
      <button type="submit" className="btn" disabled={busy || !url.trim()}>
        Analyze GitHub
      </button>
    </form>
  );
}
