"use client";

import { today } from "@/domain/dates";
import { missionStatus, MISSION_XP, validateNewMission } from "@/domain/missions";
import type { AppData, LogEntry } from "@/domain/types";
import { useAppStore } from "@/store/app-store";

function rows(data: AppData, module: string): LogEntry[] {
  return data.d[module] || [];
}

export function updateData(recipe: (data: AppData) => AppData) {
  useAppStore.getState().update(recipe);
}

export function addLog(module: string, partial: Partial<LogEntry>, day = today()): { ok: true; entry: LogEntry } | { ok: false; error: string } {
  const entry = { id: Date.now(), d: partial.d || day, ...partial } as LogEntry;
  const data = useAppStore.getState().data;
  const current = rows(data, module);
  if (module === "todo") {
    if (!entry.txt) return { ok: false, error: "Escreva a tarefa." };
    if (current.some((x) => x.d === entry.d && (x.txt || "").toLowerCase() === String(entry.txt).toLowerCase())) {
      return { ok: false, error: "Essa tarefa já existe nesse dia." };
    }
  }
  if (module === "habitos") {
    if (!entry.nome) return { ok: false, error: "Dê um nome ao hábito." };
    if (current.some((x) => (x.nome || "").toLowerCase() === String(entry.nome).toLowerCase())) {
      return { ok: false, error: "Você já tem um hábito com esse nome." };
    }
  }
  if (module === "fin" && !Number(entry.valor)) return { ok: false, error: "Informe o valor." };
  if (module === "plano") {
    if (!entry.nome || !entry.valor) return { ok: false, error: "Informe o nome e o valor." };
    if (current.some((x) => x.tipo === entry.tipo && (x.nome || "").toLowerCase() === String(entry.nome).toLowerCase())) {
      return { ok: false, error: "Esse item já existe no orçamento." };
    }
  }
  if (module === "metas") {
    entry.atual = Number(entry.ini) || 0;
    const error = validateNewMission(current, entry, day);
    if (error) return { ok: false, error };
  }
  if (module === "check") {
    if (!entry.txt) return { ok: false, error: "Escreva o item do checklist." };
    if (current.some((x) => (x.txt || "").toLowerCase() === String(entry.txt).toLowerCase())) {
      return { ok: false, error: "Esse item já existe." };
    }
  }
  if (module === "obj" && !entry.nome) return { ok: false, error: "Dê um nome ao objetivo." };
  updateData((state) => ({ ...state, d: { ...state.d, [module]: [entry, ...rows(state, module)] } }));
  return { ok: true, entry };
}

export function removeLog(module: string, id: number) {
  let removed: LogEntry | undefined;
  let index = -1;
  updateData((state) => {
    const list = rows(state, module);
    index = list.findIndex((e) => e.id === id);
    if (index < 0) return state;
    removed = list[index];
    const next = list.slice();
    next.splice(index, 1);
    return { ...state, d: { ...state.d, [module]: next } };
  });
  return { removed, index };
}

export function restoreLog(module: string, entry: LogEntry, index: number) {
  updateData((state) => {
    const list = rows(state, module).slice();
    list.splice(Math.max(0, index), 0, entry);
    return { ...state, d: { ...state.d, [module]: list } };
  });
}

export function patchLog(module: string, id: number, patch: Partial<LogEntry>) {
  updateData((state) => ({
    ...state,
    d: {
      ...state.d,
      [module]: rows(state, module).map((e) => (e.id === id ? { ...e, ...patch, id: e.id } : e)),
    },
  }));
}

export function toggleTodo(id: number) {
  updateData((state) => ({
    ...state,
    d: {
      ...state.d,
      todo: rows(state, "todo").map((e) => (e.id === id ? { ...e, done: !e.done } : e)),
    },
  }));
}

export function toggleFlag(bucket: "hc" | "cc", id: number, day = today()) {
  updateData((state) => {
    const current = { ...(state[bucket][day] || {}) };
    current[id] = !current[id];
    return { ...state, [bucket]: { ...state[bucket], [day]: current } };
  });
}

export function setGoals(patch: Partial<AppData["g"]>) {
  updateData((state) => ({ ...state, g: { ...state.g, ...patch } }));
}

export function setModuleOff(key: string, off: boolean) {
  updateData((state) => ({ ...state, off: { ...state.off, [key]: off } }));
}

export function applyPreset(essential: boolean) {
  updateData((state) => {
    const off: Record<string, boolean> = {};
    if (essential) ["leitura", "skill", "paz", "fin", "plano", "inv"].forEach((key) => (off[key] = true));
    return { ...state, off };
  });
}

export function missionXpToast(entry: LogEntry, day = today()): string | null {
  if (missionStatus(entry, day) !== "Concluída") return null;
  return `Missão concluída! +${MISSION_XP[entry.dif || "Média"] || 80} XP`;
}
