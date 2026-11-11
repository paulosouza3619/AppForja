export function iso(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function ago(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return iso(d);
}

export function today(from: Date = new Date()): string {
  return ago(0, from);
}

export function monthKey(day?: string): string {
  return (day || today()).slice(0, 7);
}

export function shiftDay(base: string, n: number): string {
  const [y, m, d] = base.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDay(isoDay: string): string {
  return isoDay.split("-").reverse().join("/");
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function daysBetween(fromDay: string, toDay: string): number {
  const a = new Date(`${fromDay}T00:00:00`);
  const b = new Date(`${toDay}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
