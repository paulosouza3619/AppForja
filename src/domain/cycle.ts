import { shiftDay, today } from "./dates";
import type { ForjaAction, ForjaState } from "./types";

export const FOCUS_AREAS: [string, string][] = [
  ["rotina", "Rotina e organização"],
  ["saude", "Saúde e energia"],
  ["financeiro", "Finanças"],
  ["projetos", "Projetos e carreira"],
  ["conhecimento", "Aprendizado e habilidades"],
];

export const TIME_OPTIONS: [string, string][] = [
  ["10", "10 minutos"],
  ["20", "20 minutos"],
  ["30", "30 minutos"],
  ["60", "1 hora ou mais"],
];

const ACTION_BANK: Record<string, [string, string, string, string][]> = {
  rotina: [
    ["Definir as três prioridades do dia", "Planejamento", "5 min", "todo"],
    ["Preparar o dia seguinte", "Organização", "5 min", "todo"],
    ["Fazer uma revisão curta no fim do dia", "Consistência", "5 min", "todo"],
  ],
  saude: [
    ["Fazer uma sessão de movimento compatível com sua rotina", "Saúde", "time", "treino"],
    ["Planejar uma refeição principal", "Alimentação", "5 min", "dieta"],
    ["Registrar sua hidratação", "Saúde", "2 min", "agua"],
  ],
  financeiro: [
    ["Registrar as despesas do dia", "Financeiro", "fin-time", "fin"],
    ["Conferir o orçamento da semana", "Planejamento", "plan-time", "plano"],
    ["Definir um limite para gastos variáveis", "Financeiro", "5 min", "plano"],
  ],
  projetos: [
    ["Definir a próxima entrega concreta", "Projetos", "5 min", "todo"],
    ["Executar um bloco de foco sem interrupção", "Execução", "focus-time", "todo"],
    ["Registrar o avanço e o próximo passo", "Projetos", "5 min", "todo"],
  ],
  conhecimento: [
    ["Ler ou estudar sem distrações", "Conhecimento", "study-time", "leitura"],
    ["Praticar uma habilidade prioritária", "Prática", "skill-time", "skill"],
    ["Registrar o que aprendeu", "Conhecimento", "5 min", "todo"],
  ],
};

function durationFor(code: string, time: string): string {
  const n = Number(time);
  if (code === "5 min" || code === "2 min") return code;
  if (code === "time") return n <= 10 ? "5 min" : n <= 20 ? "10 min" : n <= 30 ? "20 min" : "30 min";
  if (code === "fin-time") return n <= 10 ? "3 min" : "5 min";
  if (code === "plan-time") return n <= 10 ? "5 min" : n <= 20 ? "8 min" : "10 min";
  if (code === "focus-time") return n <= 10 ? "5 min" : n <= 20 ? "10 min" : n <= 30 ? "20 min" : "30 min";
  if (code === "study-time") return n <= 10 ? "5 min" : n <= 20 ? "10 min" : n <= 30 ? "15 min" : "30 min";
  if (code === "skill-time") return n <= 10 ? "3 min" : n <= 20 ? "5 min" : n <= 30 ? "10 min" : "20 min";
  return code;
}

export function recommendedTools(focus: string): string[] {
  const map: Record<string, string[]> = {
    rotina: ["todo", "habitos", "metas"],
    saude: ["treino", "agua", "dieta"],
    financeiro: ["fin", "plano", "inv"],
    projetos: ["todo", "metas"],
    conhecimento: ["leitura", "skill", "paz"],
  };
  return map[focus] || ["todo", "habitos"];
}

export function buildPlan(state: ForjaState, day = today(), now = Date.now()): ForjaState {
  const recommended = recommendedTools(state.focus);
  const active = Array.isArray(state.selectedTools) ? state.selectedTools : [];
  const enabled = active.length ? active : recommended;
  const bank = (ACTION_BANK[state.focus] || ACTION_BANK.rotina).map(
    (row) => [row[0], row[1], durationFor(row[2], state.time), row[3]] as [string, string, string, string],
  );
  const chosen = bank.filter((row) => enabled.includes(row[3]));
  const source = chosen.length ? chosen : bank;
  const qty = Number(state.time) <= 20 ? 2 : 3;
  const actions: ForjaAction[] = source.slice(0, qty).map((row, i) => ({
    id: `a${now}_${i}`,
    title: row[0],
    area: row[1],
    duration: row[2],
    module: row[3],
    frequency: "Diariamente",
  }));
  return {
    ...state,
    actions,
    selectedTools: enabled.slice(),
    priorities: state.priorities?.length ? state.priorities : [state.focus || "rotina"],
    cycleStart: day,
    cycleDays: 30,
    cycleTitle: (state.goal || "Construir consistência e retomar o controle").trim(),
    done: state.done || {},
    onboarded: true,
    reviewAt: "",
    review: null,
    view: "hoje",
  };
}

export interface CycleStats {
  today: number;
  total: number;
  rate: number;
  days: number;
  elapsed: number;
  streak: number;
  planned: number;
  actions: number;
  remaining: number;
}

export function cycleStats(state: ForjaState, day = today()): CycleStats {
  const startKey = state.cycleStart || day;
  const start = new Date(`${startKey}T00:00:00`);
  const now = new Date(`${day}T00:00:00`);
  const elapsed = Math.max(1, Math.min(Number(state.cycleDays) || 30, Math.floor((now.getTime() - start.getTime()) / 86400000) + 1));
  const validDays = Object.entries(state.done || {}).filter(
    ([d, v]) => d >= startKey && d <= day && Object.values(v || {}).some(Boolean),
  );
  const total = validDays.reduce((n, [, v]) => n + Object.values(v || {}).filter(Boolean).length, 0);
  const todayCount = (state.actions || []).filter((a) => state.done?.[day]?.[a.id]).length;
  const actions = (state.actions || []).length;
  const planned = Math.max(1, elapsed * actions);
  let streak = 0;
  let check = validDays.some(([d]) => d === day) ? day : shiftDay(day, -1);
  while (check >= startKey && state.done?.[check] && Object.values(state.done[check]).some(Boolean)) {
    streak++;
    check = shiftDay(check, -1);
  }
  return {
    today: todayCount,
    total,
    rate: Math.min(100, Math.round((total / planned) * 100)),
    days: validDays.length,
    elapsed,
    streak,
    planned,
    actions,
    remaining: Math.max(0, (Number(state.cycleDays) || 30) - elapsed),
  };
}

export function performanceWindow(state: ForjaState, day = today()) {
  const startKey = state.cycleStart || day;
  const count = (key: string) => (key >= startKey ? Object.values(state.done?.[key] || {}).filter(Boolean).length : 0);
  const series = Array.from({ length: 14 }, (_, i) => {
    const d = shiftDay(day, i - 13);
    return { day: d, n: count(d) };
  });
  const last7 = series.slice(-7);
  const prev7 = series.slice(0, 7);
  const sum = (rows: { n: number }[]) => rows.reduce((v, x) => v + x.n, 0);
  const wNow = sum(last7);
  const wPrev = sum(prev7);
  const elapsed = cycleStats(state, day).elapsed;
  const change = elapsed >= 14 && wPrev ? Math.round(((wNow - wPrev) / wPrev) * 100) : null;
  return { series, wNow, wPrev, change, avg: (wNow / Math.min(7, elapsed)).toFixed(1) };
}
