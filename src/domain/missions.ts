import { today } from "./dates";
import type { LogEntry } from "./types";

export const MISSION_LIMITS: Record<string, number> = {
  "Muito fácil": 0,
  Fácil: 6,
  Média: 4,
  Difícil: 2,
  Insana: 1,
};

export const MISSION_XP: Record<string, number> = {
  "Muito fácil": 20,
  Fácil: 40,
  Média: 80,
  Difícil: 160,
  Insana: 320,
};

export const MISSION_DIFFICULTIES = Object.keys(MISSION_XP);

export function missionProgress(entry: LogEntry): number {
  const ini = Number(entry.ini) || 0;
  const alvo = Number(entry.alvo) || 0;
  const atual = Number(entry.atual) || 0;
  if (alvo === ini) return 100;
  return Math.round(((atual - ini) / (alvo - ini)) * 100);
}

export type MissionStatus = "Concluída" | "Fracassada" | "Ativa";

export function missionStatus(entry: LogEntry, day = today()): MissionStatus {
  if (missionProgress(entry) >= 100) return "Concluída";
  if (entry.prazo && entry.prazo < day) return "Fracassada";
  return "Ativa";
}

export function activeMissionCount(rows: LogEntry[], difficulty: string, day = today()): number {
  return rows.filter((e) => (e.dif || "Média") === difficulty && missionStatus(e, day) === "Ativa").length;
}

export function validateNewMission(rows: LogEntry[], entry: LogEntry, day = today()): string | null {
  if (!entry.nome || !entry.alvo) return "Informe o nome e o valor alvo da missão.";
  const name = String(entry.nome).toLowerCase();
  if (rows.some((x) => (x.nome || "").toLowerCase() === name && missionStatus(x, day) === "Ativa")) {
    return "Já existe uma missão ativa com esse nome.";
  }
  const limit = MISSION_LIMITS[entry.dif || "Média"];
  if (limit && activeMissionCount(rows, entry.dif || "Média", day) >= limit) {
    return `Limite de missões ${entry.dif}: ${limit}. Conclua ou exclua uma antes.`;
  }
  return null;
}
