import JSZip from 'jszip';
import type { ProjectInput, SourceFile } from '../shared/types';
import { countLines, fileExtension, isReadableSource, newId } from '../shared/types';

const ZIP_LIMIT = 25 * 1024 * 1024;
const MAX_FILES = 3_000;
const UNPACKED_LIMIT = 80 * 1024 * 1024;
const SINGLE_TEXT_LIMIT = 1 * 1024 * 1024;
const TOTAL_TEXT_LIMIT = 12 * 1024 * 1024;

const excluded = /(^|\/)(node_modules|vendor|dist|build|coverage|\.git|__MACOSX)(\/|$)/i;

type ZipSizeInfo = { uncompressedSize?: number; compressedSize?: number };

function entrySizes(entry: JSZip.JSZipObject): ZipSizeInfo {
  // JSZip keeps the central-directory sizes in _data. Reading those first
  // means we can reject oversized archives before inflating file contents.
  return (entry as JSZip.JSZipObject & { _data?: ZipSizeInfo })._data ?? {};
}

function isSafePath(name: string): boolean {
  const path = name.replace(/\\/g, '/');
  return !path.startsWith('/') &&
    !/^[a-z]:/i.test(path) &&
    !path.includes('\0') &&
    !path.split('/').some(part => part === '..' || part === '.');
}

export async function ingestZip(file: File): Promise<ProjectInput> {
  if (!/\.zip$/i.test(file.name)) {
    throw new Error('Choose a project ZIP file (.zip).');
  }
  if (file.size === 0 || file.size > ZIP_LIMIT) {
    throw new Error('The ZIP must be between 1 byte and 25 MB.');
  }

  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (signature[0] !== 0x50 || signature[1] !== 0x4b || signature[2] !== 0x03 || signature[3] !== 0x04) {
    throw new Error('This file does not have a valid ZIP header.');
  }

  let archive: JSZip;
  try {
    // Do not CRC-check everything here. We validate sizes first, and only
    // decompress the small text files needed by the analysis.
    archive = await JSZip.loadAsync(file, { checkCRC32: false });
  } catch {
    throw new Error('The ZIP could not be opened. It may be corrupt or encrypted.');
  }

  const entries = Object.values(archive.files).filter(entry => !entry.dir);
  if (entries.length > MAX_FILES) {
    throw new Error(`Too many files in this archive (limit: ${MAX_FILES}).`);
  }

  let expandedBytes = 0;
  let decodedBytes = 0;
  let skippedLarge = 0;
  const source_files: SourceFile[] = [];

  for (const entry of entries) {
    const path = entry.name.replace(/\\/g, '/');
    if (!isSafePath(path)) throw new Error(`Unsafe ZIP path blocked: ${path}`);
    if (excluded.test(path)) continue;

    const sizes = entrySizes(entry);
    if (typeof sizes.uncompressedSize !== 'number' || !Number.isFinite(sizes.uncompressedSize)) {
      throw new Error(`Missing size information for: ${path}`);
    }

    expandedBytes += sizes.uncompressedSize;
    if (expandedBytes > UNPACKED_LIMIT) {
      throw new Error('The archive expands beyond the 80 MB safety limit.');
    }

    const item: SourceFile = {
      file_id: newId(),
      file_path: path,
      extension: fileExtension(path),
      size_bytes: sizes.uncompressedSize,
      line_count: 0,
    };

    if (isReadableSource(path)) {
      if (sizes.uncompressedSize > SINGLE_TEXT_LIMIT ||
          decodedBytes + sizes.uncompressedSize > TOTAL_TEXT_LIMIT) {
        skippedLarge++;
      } else {
        try {
          item.content = await entry.async('string');
          item.line_count = countLines(item.content);
          decodedBytes += sizes.uncompressedSize;
        } catch {
          throw new Error(`Cannot extract ${path}. It may be damaged or encrypted.`);
        }
      }
    }

    source_files.push(item);
  }

  if (!source_files.length) {
    throw new Error('The ZIP has no usable project files.');
  }

  return {
    project_name: file.name.replace(/\.zip$/i, ''),
    source_type: 'zip',
    source_url: null,
    zip_file_name: file.name,
    source_files,
    notes: [
      'ZIP contents were read inside this browser. Nothing was uploaded to a PageOver server.',
      'Source files above 1 MB and compiled/binary assets were not scanned.',
      ...(skippedLarge ? [`Skipped ${skippedLarge} large source files due to the extraction limits.`] : []),
    ],
  };
}
