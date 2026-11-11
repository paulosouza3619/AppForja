import type { LogEntry } from "./types";

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const CHECKLIST_SUGGESTIONS: [string, "Diária" | "Semanal" | "Mensal", number?][] = [
  ["Agradecer ao acordar", "Diária"],
  ["Arrumar a cama", "Diária"],
  ["Beber 500 ml de água em jejum", "Diária"],
  ["Ir treinar", "Diária"],
  ["Tomar banho", "Diária"],
  ["Escovar os dentes", "Diária"],
  ["Orar ou meditar", "Diária"],
  ["Ler 10 páginas", "Diária"],
  ["Planejar o dia", "Diária"],
  ["Tomar suplementos", "Diária"],
  ["Planejar a semana", "Semanal", 0],
  ["Revisar finanças da semana", "Semanal", 0],
  ["Fazer compras do mercado", "Semanal", 6],
  ["Pagar as contas", "Mensal", 5],
  ["Revisar metas do mês", "Mensal", 1],
  ["Revisar investimentos", "Mensal", 1],
];

export function checklistDue(entry: LogEntry, day: string): boolean {
  if (day < entry.d) return false;
  const [y, m, x] = day.split("-").map(Number);
  if (entry.rep === "Diária" || !entry.rep) return true;
  if (entry.rep === "Semanal") return new Date(y, m - 1, x).getDay() === Number(entry.wd);
  return x === Math.min(Number(entry.dm) || 1, new Date(y, m, 0).getDate());
}

export function checklistLabel(entry: LogEntry): string {
  if (entry.rep === "Semanal") return `Semanal · ${WEEKDAYS[Number(entry.wd)] || ""}`;
  if (entry.rep === "Mensal") return `Mensal · dia ${entry.dm}`;
  return "Diária";
}

const ICON_RULES: [RegExp, string][] = [
  [/agua|hidrata/, "drop"],
  [/trein|academia|exerc/, "dumbbell"],
  [/banho/, "shower"],
  [/cama|dorm/, "bed"],
  [/dente/, "tooth"],
  [/orar|medit|grat/, "heart"],
  [/sol|manh/, "sun"],
  [/ler|leit|livro|pag/, "book"],
  [/planej|revis|organiz/, "calendar"],
  [/financ|conta|gast/, "coin"],
  [/invest/, "trend"],
  [/compra|mercado/, "cart"],
  [/suplement|remed/, "pill"],
  [/meta/, "target"],
  [/comer|refei|dieta/, "apple"],
];

export function checklistIcon(entry: LogEntry): string {
  if (entry.ico) return entry.ico;
  const text = (entry.txt || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return ICON_RULES.find(([re]) => re.test(text))?.[1] || "check";
}
