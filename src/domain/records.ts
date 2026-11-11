import type { AppData, LogEntry } from "./types";

export function logs(data: AppData, module: string): LogEntry[] {
  return data.d[module] || [];
}

export function onDay(data: AppData, module: string, day: string): LogEntry[] {
  return logs(data, module).filter((e) => e.d === day);
}

export function sumField(rows: readonly object[], field: string): number {
  return rows.reduce((s, e) => s + (Number((e as Record<string, unknown>)[field]) || 0), 0);
}

export function isVisible(data: AppData, key: string): boolean {
  const k = key === "obj" ? "inicio" : key;
  return !data.off[k];
}

export function brl(value: number): string {
  return "R$ " + (Number(value) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function weekSeries(data: AppData, module: string, field: string | null, today: string, ago: (n: number) => string) {
  return [6, 5, 4, 3, 2, 1, 0].map((n) => {
    const d = ago(n);
    const rows = onDay(data, module, d);
    return { l: d.slice(8), day: d, v: field ? sumField(rows, field) : rows.length };
  });
}

export function hasAnyLogs(data: AppData): boolean {
  return Object.values(data.d).some((rows) => Array.isArray(rows) && rows.length > 0);
}

export function newId(): number {
  return Date.now();
}
