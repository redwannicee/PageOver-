// FR-10 · Owner: Md. Redwan Rashid Nice (0242310005341105) — temporary browser history (localStorage, no server DB)
import type { Analysis } from '../types';
const K = 'pageover:history';
export const all = (): Analysis[] => { try { return JSON.parse(localStorage.getItem(K) || '[]'); } catch { return []; } };
export const get = (id: string) => all().find(a => a.id === id);
export const save = (a: Analysis) => localStorage.setItem(K, JSON.stringify([a, ...all()].slice(0, 30)));
export const clear = () => localStorage.removeItem(K);
