export interface Bug { sev: 'high' | 'medium' | 'low'; desc: string; file: string }
export interface FileItem { path: string; size: number; text?: string }
export interface Live { label: string; url: string; ok: boolean }
export interface Analysis {
  id: string; name: string; source: string; at: number; desc: string;
  langs: { name: string; pct: number; color: string }[]; platforms: string[]; bugs: Bug[];
  ai: number; unique: number; score: number; files: number; live: Live[];
}
