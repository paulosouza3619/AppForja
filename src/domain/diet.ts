import taco from "@/data/taco.json";

export interface TacoFood {
  names: string[];
  k: number;
  p: number;
  c: number;
  f: number;
  u: number;
  s: number;
}

export const TACO: TacoFood[] = taco as TacoFood[];

const UNITS: Record<string, number> = { copo: 200, xicara: 240, concha: 100, punhado: 30 };

export function stripAccents(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeFoodName(value: string): string {
  return stripAccents(value).replace(/s\b/g, "").trim();
}

export interface ParsedPortion {
  t: string;
  fd: TacoFood | 0;
  g?: number;
  k?: number;
  p?: number;
  c?: number;
  f?: number;
}

export function parsePortion(raw: string, foods: TacoFood[] = TACO): ParsedPortion | undefined {
  const t = raw.trim();
  if (!t) return;
  const normalized = stripAccents(t).replace(/^mei[oa]\b/, "0.5").replace(/(\d),(\d)/, "$1.$2");
  const match = normalized.match(
    /^(?:(\d+(?:\.\d+)?)\s*(?:(kg|gramas?|gr|g|ml|litros?|l|colheres?|copos?|xicaras?|conchas?|punhados?|potes?|fatias?|scoops?|doses?|unidades?|un)(?![a-z]))?\s*(?:de\s+)?)?(.+)$/,
  );
  if (!match) return;
  const q = match[1] ? Number(match[1]) : 1;
  const u = match[2] || "";
  const nm = normalizeFoodName(match[3].replace(/^(sopa|cha|sobremesa)\s+(de\s+)?/, ""));
  const ranked = foods
    .map((food) => [food, Math.max(0, ...food.names.filter((name) => nm.includes(normalizeFoodName(name))).map((name) => normalizeFoodName(name).length))] as const)
    .filter((row) => row[1])
    .sort((a, b) => b[1] - a[1]);
  const fd = ranked[0]?.[0];
  if (!fd) return { t, fd: 0 };
  const unitKey = Object.keys(UNITS).find((k) => u.startsWith(k));
  const g =
    u === "kg" || u === "l" || /^litro/.test(u)
      ? q * 1000
      : u === "g" || u === "gr" || u === "ml" || /^grama/.test(u)
        ? q
        : /^colher/.test(u)
          ? q * (fd.s || 15)
          : (unitKey ? UNITS[unitKey] * q : 0) || q * (fd.u || 100);
  const ratio = (key: "k" | "p" | "c" | "f") => (fd[key] * g) / 100;
  return { t, fd, g, k: ratio("k"), p: ratio("p"), c: ratio("c"), f: ratio("f") };
}

export function calcWaterGoal(weightKg: number, mlPerKg: number): number {
  return Math.round((weightKg * mlPerKg) / 50) * 50;
}

export function calcMacroGoals(input: { weight: number; height: number; age: number; activity: number; offset: number }) {
  const { weight, height, age, activity, offset } = input;
  const kcal = (10 * weight + 6.25 * height - 5 * age + 5) * activity + offset;
  const p = 2 * weight;
  const f = 0.8 * weight;
  return {
    kcal: Math.round(kcal),
    p: Math.round(p),
    f: Math.round(f),
    c: Math.max(0, Math.round((kcal - 4 * p - 9 * f) / 4)),
  };
}
