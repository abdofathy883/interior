import { IsoDate } from '../models/models';

export function toIso(d: Date): IsoDate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIso(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayIso(): IsoDate {
  return toIso(new Date());
}

export function addDays(base: Date | IsoDate, n: number): IsoDate {
  const d = typeof base === 'string' ? parseIso(base) : new Date(base);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

/** `2026-03-05` -> `05/03/2026` */
export function formatDmy(iso: IsoDate | undefined | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** `2026-03` */
export function monthKey(iso: IsoDate): string {
  return iso.slice(0, 7);
}

export function addMonthsToKey(key: string, n: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Inclusive list of month keys from `from` to `to`. */
export function monthKeysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  while (cur <= to && out.length < 36) {
    out.push(cur);
    cur = addMonthsToKey(cur, 1);
  }
  return out;
}
