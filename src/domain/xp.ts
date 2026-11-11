import { ago, today } from "./dates";
import { bossState } from "./bosses";
import { missionStatus, MISSION_XP } from "./missions";
import { logs, onDay, sumField } from "./records";
import type { AppData } from "./types";

const OBJECTIVE_XP: Record<string, number> = {
  "Curto prazo": 100,
  "Médio prazo": 250,
  "Longo prazo": 500,
};

export function totalXp(data: AppData, day = today()): number {
  let x = 0;
  const distinctDays = (module: string) => [...new Set(logs(data, module).map((e) => e.d))];
  x += distinctDays("treino").length * 30;
  x += logs(data, "paz").length * 15;
  x += logs(data, "fin").length * 3;
  x += logs(data, "todo").filter((e) => e.done).length * 10;
  x += Math.round(sumField(logs(data, "leitura"), "pgs") / 2);
  x += Math.round(sumField(logs(data, "skill"), "min") / 2);
  x += distinctDays("agua").filter((d) => sumField(onDay(data, "agua", d), "ml") >= data.g.water).length * 20;
  x += distinctDays("dieta").filter((d) => {
    const k = sumField(onDay(data, "dieta", d), "kcal");
    return k && Math.abs(k - data.g.kcal) <= data.g.kcal * 0.1;
  }).length * 25;

  Object.values(data.hc).forEach((o) => {
    Object.entries(o).forEach(([id, v]) => {
      const h = logs(data, "habitos").find((e) => String(e.id) === String(id));
      if (v && h) x += h.tipo === "Ruim" ? -20 : 15;
    });
  });

  logs(data, "habitos")
    .filter((h) => h.tipo === "Ruim")
    .forEach((h) => {
      for (let i = 0; i < 365; i++) {
        const d = ago(i);
        if (d < h.d) break;
        if (!data.hc[d]?.[h.id]) x += 5;
      }
      const b = bossState(data, h, day);
      x += sumField(h.bat || [], "xp") + (b.st === "win" ? b.r : b.st === "lose" ? -b.pn : 0);
    });

  logs(data, "obj").forEach((o) => {
    if (o.done) x += OBJECTIVE_XP[o.termo || ""] || 0;
  });
  if (data.ob?.bonus) x += data.ob.bonus;

  Object.entries(data.cc || {}).forEach(([, o]) => {
    Object.entries(o).forEach(([id, v]) => {
      if (v && logs(data, "check").some((e) => String(e.id) === String(id))) x += 5;
    });
  });

  logs(data, "metas").forEach((e) => {
    const status = missionStatus(e, day);
    const v = MISSION_XP[e.dif || "Média"] || MISSION_XP["Média"];
    if (status === "Concluída") x += v;
    if (status === "Fracassada") x -= Math.round(v / 2);
  });

  return Math.max(0, Math.round(x));
}

export function levelFromXp(xp: number) {
  const lv = Math.floor(Math.sqrt(xp / 50)) + 1;
  const floor = 50 * (lv - 1) ** 2;
  const ceil = 50 * lv * lv;
  const ladder: [number, string][] = [
    [1, "Recruta"],
    [3, "Aprendiz"],
    [5, "Guerreiro"],
    [8, "Veterano"],
    [12, "Mestre"],
    [17, "Lenda"],
  ];
  const title = [...ladder].reverse().find((t) => lv >= t[0])?.[1] || "Recruta";
  return { lv, floor, ceil, title, remain: ceil - xp, pct: ceil === floor ? 1 : (xp - floor) / (ceil - floor) };
}

export function dayWasActive(data: AppData, day: string): boolean {
  const modules = ["treino", "agua", "dieta", "leitura", "skill", "paz", "fin"];
  if (modules.some((m) => onDay(data, m, day).length > 0)) return true;
  if (logs(data, "todo").some((e) => e.d === day && e.done)) return true;
  if (Object.entries(data.hc[day] || {}).some(([id, v]) => v && logs(data, "habitos").find((h) => String(h.id) === id)?.tipo !== "Ruim")) {
    return true;
  }
  return Object.values(data.cc[day] || {}).some(Boolean);
}

export function streakDays(data: AppData, day = today()): number {
  let i = dayWasActive(data, day) ? 0 : 1;
  let st = 0;
  while (i < 365 && dayWasActive(data, ago(i))) {
    st++;
    i++;
  }
  return st;
}

export const OBJECTIVE_TERMS = {
  "Curto prazo": ["Até 1 ano", 100],
  "Médio prazo": ["De 1 a 5 anos", 250],
  "Longo prazo": ["Mais de 5 anos", 500],
} as const;
