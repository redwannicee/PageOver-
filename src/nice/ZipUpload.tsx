import { useRef, useState } from 'react';

interface ZipUploadProps {
  busy: boolean;
  onSubmit: (file: File) => void;
}

export default function ZipUpload({ busy, onSubmit }: ZipUploadProps) {
  const [dragging, setDragging] = useState(false);
  const filePicker = useRef<HTMLInputElement>(null);

  function receiveFile(file?: File) {
    if (file && !busy) onSubmit(file);
  }

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-7 text-center ${dragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-600'}`}
      onDragOver={event => { event.preventDefault(); setDragging(true); }}
      onDragLeave={event => { event.preventDefault(); setDragging(false); }}
      onDrop={event => {
        event.preventDefault();
        setDragging(false);
        receiveFile(event.dataTransfer.files[0]);
      }}
    >
      <p className="font-medium">Drop a ZIP here</p>
      <p className="muted mb-4 mt-1 text-sm">Maximum 25 MB. Files stay on this device.</p>
      <input
        ref={filePicker}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        className="sr-only"
        disabled={busy}
        aria-label="Choose project ZIP"
        onChange={event => {
          receiveFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <button type="button" className="btn" disabled={busy} onClick={() => filePicker.current?.click()}>
        Browse files
      </button>
    </div>
  );
}
