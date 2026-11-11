import { iso, today } from "./dates";
import type { AppData, LogEntry } from "./types";

export const BOSS_REWARDS: Record<string, [number, number]> = {
  Comum: [200, 2],
  Raro: [400, 3],
  Épico: [700, 4],
  Lendário: [1000, 5],
};

export const BOSS_NAMES = [
  "Morgrath, o Devorador",
  "Vazkul, a Sombra",
  "Nyxor, o Corruptor",
  "Thalgor, o Tirano",
  "Drakhul, o Insaciável",
  "Zerath, o Sussurrante",
];

export const VICE_SUGGESTIONS = [
  "Redes sociais em excesso",
  "Açúcar e doces",
  "Fast food",
  "Bebida alcoólica",
  "Cigarro",
  "Jogos em excesso",
  "Procrastinação",
  "Dormir tarde",
];

export interface BossState {
  D: number;
  F: number;
  el: number;
  sl: number;
  st: "lose" | "win" | "on";
  r: number;
  pn: number;
  life: number;
}

export function bossState(data: AppData, entry: LogEntry, day = today()): BossState {
  const bs = entry.bs || entry.d;
  const D = Number(entry.dur) || 30;
  const F = entry.falhas === undefined || entry.falhas === "" ? 1 : Number(entry.falhas);
  const el = Math.round((new Date(`${day}T00:00:00`).getTime() - new Date(`${bs}T00:00:00`).getTime()) / 86400000) + 1;
  const n = Math.min(el, D);
  let sl = 0;
  for (let i = 0; i < n; i++) {
    const x = new Date(`${bs}T00:00:00`);
    x.setDate(x.getDate() + i);
    if (data.hc[iso(x)]?.[entry.id]) sl++;
  }
  const life = Math.max(0, Math.min(100, Math.round(100 - ((n - sl - sl) * 100) / D)));
  const st: BossState["st"] = sl > F ? "lose" : el >= D ? "win" : "on";
  const r = BOSS_REWARDS[entry.dif || "Comum"]?.[0] ?? 200;
  return { D, F, el, sl, st, r, pn: Math.round(r / 3), life: st === "win" ? 0 : life };
}

export function bossDisplayName(id: number): string {
  return BOSS_NAMES[id % BOSS_NAMES.length];
}
