import { ago, monthKey, today } from "./dates";
import { checklistDue } from "./checklist";
import { isVisible, logs, onDay, sumField } from "./records";
import type { AppData } from "./types";

export interface ReportItem {
  ok: boolean;
  text: string;
}

function hasModule(data: AppData, module: string): boolean {
  const key = module === "check" ? "habitos" : module;
  return logs(data, module).length > 0 && isVisible(data, key);
}

export function disciplineReport(data: AppData, day = today()): { score: number; good: string[]; bad: string[] } {
  const days = [0, 1, 2, 3, 4, 5, 6].map((n) => ago(n));
  const items: ReportItem[] = [];
  const push = (ok: boolean, yes: string, no: string) => items.push({ ok, text: ok ? yes : no });

  if (hasModule(data, "treino")) {
    const n = days.filter((d) => onDay(data, "treino", d).length).length;
    push(n >= 3, `${n} treinos em 7 dias — ótima consistência.`, `Só ${n} treino(s) em 7 dias. Mire em 3 ou mais.`);
  }
  if (hasModule(data, "agua")) {
    const n = days.filter((d) => sumField(onDay(data, "agua", d), "ml") >= data.g.water).length;
    push(n >= 5, `Meta de água batida em ${n}/7 dias.`, `Meta de água batida em só ${n}/7 dias. Beba mais ao longo do dia.`);
  }
  if (hasModule(data, "dieta")) {
    const n = days.filter((d) => {
      const k = sumField(onDay(data, "dieta", d), "kcal");
      return k && Math.abs(k - data.g.kcal) <= data.g.kcal * 0.1;
    }).length;
    push(n >= 4, `Calorias dentro da meta em ${n}/7 dias.`, `Calorias dentro da meta em só ${n}/7 dias. Registre as refeições e ajuste as porções.`);
  }
  if (hasModule(data, "metas")) {
    const rows = logs(data, "metas");
    const p = Math.round(
      rows.reduce((s, e) => {
        const ini = Number(e.ini) || 0;
        const alvo = Number(e.alvo) || 0;
        const atual = Number(e.atual) || 0;
        const pct = alvo === ini ? 100 : ((atual - ini) / (alvo - ini)) * 100;
        return s + Math.max(0, Math.min(100, pct));
      }, 0) / rows.length,
    );
    push(p >= 40, `Metas com ${p}% de progresso médio.`, `Metas com apenas ${p}% de progresso médio. Atualize e quebre em passos menores.`);
  }
  if (hasModule(data, "fin")) {
    const month = monthKey(day);
    const rows = logs(data, "fin").filter((e) => e.d.slice(0, 7) === month);
    const income = sumField(rows.filter((e) => e.tipo === "Receita"), "valor");
    const expense = sumField(rows.filter((e) => e.tipo === "Despesa"), "valor");
    if (income) {
      const p = Math.round(((income - expense) / income) * 100);
      push(p >= 20, `Você poupa ${p}% da renda no mês.`, `Poupança de ${p}% no mês. Meta saudável: 20% ou mais.`);
    } else if (expense) push(false, "", "Há despesas e nenhuma receita registrada no mês. Registre suas entradas.");
  }
  if (hasModule(data, "inv")) {
    const n = new Set(logs(data, "inv").map((e) => e.tipo)).size;
    push(n >= 3, `Carteira diversificada em ${n} classes.`, `Carteira em só ${n} classe(s). Diversifique para reduzir risco.`);
  }
  if (hasModule(data, "leitura")) {
    const n = days.filter((d) => sumField(onDay(data, "leitura", d), "pgs") >= data.g.pages).length;
    push(n >= 4, `Meta de leitura batida em ${n}/7 dias.`, `Meta de leitura batida em só ${n}/7 dias. Leia um pouco todo dia.`);
  }
  if (hasModule(data, "skill")) {
    const m = days.reduce((s, d) => s + sumField(onDay(data, "skill", d), "min"), 0);
    push(m >= 120, `${m} min de prática na semana.`, `Só ${m} min de prática na semana. Mire em 2 h ou mais.`);
  }
  if (hasModule(data, "paz")) {
    const n = days.reduce((s, d) => s + onDay(data, "paz", d).length, 0);
    push(n >= 4, `${n} momentos de paz na semana.`, `${n} momentos de paz na semana. Reserve silêncio todo dia.`);
  }
  if (hasModule(data, "todo")) {
    const rows = logs(data, "todo").filter((e) => days.includes(e.d));
    if (rows.length) {
      const n = rows.filter((e) => e.done).length;
      push(n / rows.length >= 0.7, `${n}/${rows.length} tarefas concluídas na semana.`, `Só ${n}/${rows.length} tarefas concluídas na semana. Priorize 3 por dia.`);
    }
  }
  if (hasModule(data, "check")) {
    let total = 0;
    let done = 0;
    days.forEach((d) => {
      logs(data, "check")
        .filter((e) => checklistDue(e, d))
        .forEach((e) => {
          total++;
          if (data.cc[d]?.[e.id]) done++;
        });
    });
    if (total) {
      const p = Math.round((done / total) * 100);
      push(p >= 70, `Checklist cumprido em ${p}% na semana.`, `Checklist cumprido em só ${p}% na semana. Marque os itens ao longo do dia ou reduza a lista.`);
    }
  }
  if (hasModule(data, "habitos")) {
    const rows = logs(data, "habitos");
    const good = rows.filter((e) => e.tipo !== "Ruim");
    const bad = rows.filter((e) => e.tipo === "Ruim");
    if (good.length) {
      const n = good.filter((e) => data.hc[day]?.[e.id]).length;
      push(n >= good.length / 2, `${n}/${good.length} hábitos bons feitos hoje.`, `${n}/${good.length} hábitos bons feitos hoje. Ainda dá tempo.`);
    }
    if (bad.length) {
      const n = days.reduce((s, d) => s + bad.filter((e) => data.hc[d]?.[e.id]).length, 0);
      push(n <= 2, `Só ${n} recaída(s) em hábitos ruins na semana.`, `${n} recaídas em hábitos ruins na semana. Identifique o gatilho.`);
    }
  }

  const ok = items.filter((i) => i.ok);
  const no = items.filter((i) => !i.ok);
  return {
    score: items.length ? Math.round((ok.length / items.length) * 100) : 0,
    good: ok.map((i) => i.text),
    bad: no.map((i) => i.text),
  };
}

export function radarScores(data: AppData, day = today()): [string, number][] {
  const days = [0, 1, 2, 3, 4, 5, 6].map((n) => ago(n));
  const cap = (v: number, t: number) => Math.min(1, v / t);
  const train = days.filter((d) => onDay(data, "treino", d).length).length;
  const water = days.filter((d) => sumField(onDay(data, "agua", d), "ml") >= data.g.water).length;
  const diet = days.filter((d) => {
    const k = sumField(onDay(data, "dieta", d), "kcal");
    return k && Math.abs(k - data.g.kcal) <= data.g.kcal * 0.1;
  }).length;
  const reading = days.filter((d) => sumField(onDay(data, "leitura", d), "pgs") >= data.g.pages).length;
  const skill = days.reduce((s, d) => s + sumField(onDay(data, "skill", d), "min"), 0);
  const peace = days.reduce((s, d) => s + onDay(data, "paz", d).length, 0);
  const month = logs(data, "fin").filter((e) => e.d.slice(0, 7) === monthKey(day));
  const income = sumField(month.filter((e) => e.tipo === "Receita"), "valor");
  const expense = sumField(month.filter((e) => e.tipo === "Despesa"), "valor");
  const tasks = logs(data, "todo").filter((e) => days.includes(e.d));
  const habits = logs(data, "habitos").filter((e) => e.tipo !== "Ruim");
  const habitDone = habits.filter((e) => data.hc[day]?.[e.id]).length;
  const taskRate = tasks.length ? tasks.filter((e) => e.done).length / tasks.length : 0;
  const habitRate = habits.length ? habitDone / habits.length : 0;
  return [
    ["Físico", (cap(train, 3) + cap(water, 5) + cap(diet, 4)) / 3],
    ["Mental", (cap(reading, 4) + cap(skill, 120)) / 2],
    ["Espiritual", cap(peace, 4)],
    ["Financeiro", income ? Math.max(0, cap((income - expense) / income, 0.2)) : 0],
    ["Disciplina", (taskRate + habitRate) / 2],
  ];
}
