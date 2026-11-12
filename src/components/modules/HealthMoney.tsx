"use client";

import { useState } from "react";
import { ago, formatDay, monthKey, monthLabel, today } from "@/domain/dates";
import { calcMacroGoals, calcWaterGoal, parsePortion, type ParsedPortion } from "@/domain/diet";
import { brl, onDay, sumField, weekSeries } from "@/domain/records";
import { CARDIO_MODES, EXERCISES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, QUICK_EXPENSE, QUICK_INCOME, TRAIN_GROUPS } from "@/domain/catalog";
import { EMPTY_LOGS, type LogEntry } from "@/domain/types";
import { addLog, patchLog, removeLog, restoreLog, setGoals } from "@/store/actions";
import { useAppStore } from "@/store/app-store";
import { Bar, Button, Field, Panel, WeekChart, controlClass, useToast } from "@/components/ui";

function useRows(module: string) {
  return useAppStore((s) => s.data.d[module] ?? EMPTY_LOGS);
}

function History({ module, rows, label }: { module: string; rows: LogEntry[]; label: (row: LogEntry) => string }) {
  const toast = useToast();
  return (
    <Panel title="Histórico">
      {rows.slice(0, 25).map((row) => (
        <div key={row.id} className="flex items-start justify-between gap-3 border-t border-line py-2">
          <div><p>{label(row)}</p><small className="text-mute">{row.d}</small></div>
          <button type="button" className="min-h-9 min-w-9 text-mute" aria-label="Excluir" onClick={() => {
            const { removed, index } = removeLog(module, row.id);
            if (!removed) return;
            toast("Registro removido.", false, () => restoreLog(module, removed, index));
          }}>✕</button>
        </div>
      ))}
      {!rows.length ? <p className="text-sm text-mute">Nenhum registro ainda.</p> : null}
    </Panel>
  );
}

export function WaterModule() {
  const toast = useToast();
  const goal = useAppStore((s) => s.data.g.water);
  const data = useAppStore((s) => s.data);
  const [weight, setWeight] = useState("");
  const [factor, setFactor] = useState("35");
  const day = today();
  const total = sumField(onDay(data, "agua", day), "ml");
  function add(ml: number) {
    const result = addLog("agua", { ml });
    if (!result.ok) return toast(result.error);
    toast(`+${ml} ml registrados.`, true, () => removeLog("agua", result.entry.id));
  }
  return (
    <div className="space-y-4">
      <Panel title="Calculadora de meta diária">
        <Field label="Seu peso (kg)"><input className={controlClass} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></Field>
        <select className={controlClass} value={factor} onChange={(e) => setFactor(e.target.value)} aria-label="Nível de atividade">
          <option value="35">Sedentário · 35 ml/kg</option>
          <option value="40">Treina 3–4x/semana · 40 ml/kg</option>
          <option value="45">Treina 5x ou mais · 45 ml/kg</option>
        </select>
        <Button onClick={() => { if (!Number(weight)) return; setGoals({ water: calcWaterGoal(Number(weight), Number(factor)) }); toast("Meta de água salva.", true); }}>Calcular e salvar meta</Button>
      </Panel>
      <Panel title={`Hoje: ${total} / ${goal} ml`}>
        <Bar value={(total / goal) * 100} tone="ok" />
        <div className="mt-2 flex gap-2">{[200, 300, 500].map((ml) => <Button key={ml} className="flex-1" onClick={() => add(ml)}>+{ml}</Button>)}</div>
        <WeekChart points={weekSeries(data, "agua", "ml", day, ago)} goal={goal} />
      </Panel>
      <History module="agua" rows={useRows("agua")} label={(row) => `${row.ml} ml`} />
    </div>
  );
}

export function DietModule() {
  const toast = useToast();
  const data = useAppStore((s) => s.data);
  const goals = data.g;
  const [form, setForm] = useState({ weight: "", height: "", age: "", activity: "1.55", offset: "0" });
  const [meal, setMeal] = useState("Almoço");
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedPortion[] | null>(null);
  const day = today();
  const todayRows = onDay(data, "dieta", day);
  const found = parsed?.filter((item) => item.fd) || [];
  const missing = parsed?.filter((item) => !item.fd) || [];
  const total = (key: "k" | "p" | "c" | "f") => Math.round(found.reduce((s, item) => s + (Number(item[key]) || 0), 0));
  return (
    <div className="space-y-4">
      <Panel title="Calculadora de macros">
        <Field label="Peso (kg)"><input className={controlClass} inputMode="decimal" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></Field>
        <Field label="Altura (cm)"><input className={controlClass} inputMode="decimal" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} /></Field>
        <Field label="Idade"><input className={controlClass} inputMode="decimal" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Field>
        <select className={controlClass} aria-label="Atividade" value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })}>
          <option value="1.2">Sedentário</option><option value="1.375">Leve (1–3x/sem)</option><option value="1.55">Moderado (3–5x/sem)</option><option value="1.725">Intenso (6–7x/sem)</option>
        </select>
        <select className={controlClass} aria-label="Objetivo" value={form.offset} onChange={(e) => setForm({ ...form, offset: e.target.value })}>
          <option value="-400">Secar (−400 kcal)</option><option value="0">Manter</option><option value="300">Ganhar massa (+300 kcal)</option>
        </select>
        <Button onClick={() => {
          if (!Number(form.weight) || !Number(form.height) || !Number(form.age)) return toast("Preencha peso, altura e idade.");
          setGoals(calcMacroGoals({ weight: Number(form.weight), height: Number(form.height), age: Number(form.age), activity: Number(form.activity), offset: Number(form.offset) }));
          toast("Metas nutricionais salvas.", true);
        }}>Calcular e salvar metas</Button>
        <p className="mt-2 text-xs text-mute">Mifflin-St Jeor · proteína 2 g/kg · gordura 0,8 g/kg · o resto vira carboidrato. Estimativa, não substitui nutricionista.</p>
      </Panel>
      <Panel title="Refeição por texto">
        <select className={controlClass} aria-label="Refeição" value={meal} onChange={(e) => setMeal(e.target.value)}>
          {["Café da manhã", "Almoço", "Lanche", "Jantar", "Ceia", "Pré-treino", "Pós-treino"].map((name) => <option key={name}>{name}</option>)}
        </select>
        <textarea rows={5} className={controlClass} placeholder={"3 ovos\n25g de queijo branco\n30g de whey"} value={text} onChange={(e) => setText(e.target.value)} aria-label="Alimentos" />
        <Button onClick={() => {
          const items = text.split(/\n|;/).map((line) => parsePortion(line)).filter((item): item is ParsedPortion => Boolean(item));
          if (!items.length) return toast("Digite os alimentos, um por linha.");
          setParsed(items);
        }}>Calcular macros</Button>
        {parsed ? (
          <div className="mt-3 text-sm">
            {found.map((item) => <div key={item.t} className="flex justify-between border-t border-line py-1"><span>{item.t} · {Math.round(item.g || 0)} g</span><span>{Math.round(item.k || 0)} kcal</span></div>)}
            {missing.map((item) => <div key={item.t} className="flex justify-between border-t border-line py-1 text-danger"><span>{item.t}</span><span>não encontrado</span></div>)}
            <p className="mt-2 font-bold">Total {total("k")} kcal · P{total("p")} C{total("c")} G{total("f")}</p>
            {found.length ? <Button className="mt-2" onClick={() => {
              addLog("dieta", { nome: `${meal}: ${found.map((item) => item.t).join(", ")}`, kcal: total("k"), p: total("p"), c: total("c"), f: total("f") });
              setParsed(null); setText(""); toast("Refeição adicionada ao dia.", true);
            }}>Adicionar ao dia</Button> : null}
            <p className="mt-2 text-xs text-mute">Valores aproximados, com base na TACO e em médias comuns. Sem unidade, considero 1 unidade média.</p>
          </div>
        ) : null}
      </Panel>
      <Panel title="Hoje">
        {([["Calorias", "kcal", goals.kcal, "kcal"], ["Proteína", "p", goals.p, "g"], ["Carboidrato", "c", goals.c, "g"], ["Gordura", "f", goals.f, "g"]] as const).map(([name, key, meta, unit]) => {
          const value = Math.round(sumField(todayRows, key));
          return <div key={name}><small>{name}: {value} / {meta} {unit}</small><Bar value={(value / meta) * 100} tone={value > meta * 1.1 ? "danger" : "ember"} /></div>;
        })}
      </Panel>
      <History module="dieta" rows={useRows("dieta")} label={(row) => `${row.nome} · ${row.kcal} kcal · P${row.p} C${row.c} G${row.f}`} />
    </div>
  );
}

export function TrainingModule() {
  const toast = useToast();
  const data = useAppStore((s) => s.data);
  const rows = data.d.treino || [];
  const day = today();
  const todayRows = onDay(data, "treino", day);
  const [kind, setKind] = useState<"Academia" | "Cardio">("Academia");
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ grupo: "Peito", nome: "", series: "", reps: "", carga: "", mod: "Esteira", min: "", dist: "", obs: "", d: day });
  const [templateName, setTemplateName] = useState("");
  const days = [...new Set(rows.map((row) => row.d))].sort().reverse().slice(0, 14);
  const chart = weekSeries(data, "treino", null, day, ago).map((point) => ({ ...point, v: point.v ? 1 : 0 }));

  function save() {
    const entry: Partial<LogEntry> = { d: form.d || day, tipo: kind, obs: form.obs };
    if (kind === "Academia") {
      if (!form.nome.trim()) return toast("Informe o exercício.");
      Object.assign(entry, { grupo: form.grupo, nome: form.nome.trim(), series: Number(form.series) || 0, reps: Number(form.reps) || 0, carga: Number(form.carga) || 0 });
    } else {
      if (!Number(form.min)) return toast("Informe a duração em minutos.");
      Object.assign(entry, { nome: form.mod, min: Number(form.min) || 0, dist: Number(form.dist) || 0 });
    }
    if (editing) patchLog("treino", editing, entry);
    else addLog("treino", entry);
    setEditing(null);
    toast(editing ? "Treino atualizado." : "Exercício adicionado.", true);
  }

  function quick(cardio: boolean) {
    const result = addLog("treino", { tipo: cardio ? "Cardio" : "Academia", nome: cardio ? "Cardio" : "Treino", quick: 1, min: 0, series: 0, reps: 0, carga: 0, dist: 0 });
    if (result.ok) toast("Treino de hoje registrado. Detalhes são opcionais.", true, () => removeLog("treino", result.entry.id));
  }

  return (
    <div className="space-y-4">
      <Panel title="Treino de hoje">
        <p>{todayRows.length ? <b className="text-ok">1 treino</b> : "Nenhum treino registrado hoje."}</p>
        <p className="text-xs text-mute">Academia e cardio no mesmo dia contam como 1 treino.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => quick(false)}>{todayRows.length ? "Mais um (academia)" : "Treinei hoje"}</Button>
          <Button tone="quiet" onClick={() => quick(true)}>Cardio hoje</Button>
        </div>
        <div className="mt-3 flex gap-2">
          <input className={controlClass} placeholder="Nome do modelo" aria-label="Nome do modelo" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
          <Button onClick={() => {
            const name = templateName.trim();
            if (!name) return toast("Dê um nome ao modelo.");
            if (!todayRows.length) return;
            if ((data.tpl || []).some((item) => item.nome.toLowerCase() === name.toLowerCase())) return toast("Já existe um modelo com esse nome.");
            useAppStore.getState().update((state) => ({
              ...state,
              tpl: [...(state.tpl || []), {
                id: Date.now(),
                nome: name,
                it: todayRows.map((item) => ({
                  id: item.id,
                  d: item.d,
                  nome: item.nome,
                  tipo: item.tipo,
                  grupo: item.grupo,
                  series: item.series,
                  reps: item.reps,
                  carga: item.carga,
                  min: item.min,
                  dist: item.dist,
                  obs: item.obs,
                  quick: item.quick,
                })),
              }],
            }));
            setTemplateName("");
            toast("Modelo salvo.", true);
          }}>Salvar</Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(data.tpl || []).map((template) => (
            <span key={template.id} className="inline-flex items-center rounded-full border border-line">
              <button type="button" className="px-3 py-2" onClick={() => template.it.forEach((item, index) => addLog("treino", { ...item, id: Date.now() + index, d: day }))}>{template.nome}</button>
              <button type="button" aria-label={`Excluir modelo ${template.nome}`} className="px-2" onClick={() => useAppStore.getState().update((state) => ({ ...state, tpl: (state.tpl || []).filter((item) => item.id !== template.id) }))}>✕</button>
            </span>
          ))}
        </div>
      </Panel>
      <Panel title={editing ? "Editar exercício" : "Registrar com detalhes"}>
        <div className="mb-2 flex gap-2">
          <Button tone={kind === "Academia" ? "primary" : "quiet"} onClick={() => setKind("Academia")}>Academia</Button>
          <Button tone={kind === "Cardio" ? "primary" : "quiet"} onClick={() => setKind("Cardio")}>Cardio</Button>
        </div>
        {kind === "Academia" ? (
          <>
            <select className={controlClass} aria-label="Grupo" value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })}>{TRAIN_GROUPS.map((group) => <option key={group}>{group}</option>)}</select>
            <input className={controlClass} list="exl" placeholder="Exercício" aria-label="Exercício" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <datalist id="exl">{EXERCISES.map((name) => <option key={name} value={name} />)}</datalist>
            <div className="grid grid-cols-3 gap-2">
              <input className={controlClass} inputMode="numeric" placeholder="Séries" aria-label="Séries" value={form.series} onChange={(e) => setForm({ ...form, series: e.target.value })} />
              <input className={controlClass} inputMode="numeric" placeholder="Reps" aria-label="Repetições" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} />
              <input className={controlClass} inputMode="decimal" placeholder="Carga kg" aria-label="Carga" value={form.carga} onChange={(e) => setForm({ ...form, carga: e.target.value })} />
            </div>
          </>
        ) : (
          <>
            <select className={controlClass} aria-label="Modalidade" value={form.mod} onChange={(e) => setForm({ ...form, mod: e.target.value })}>{CARDIO_MODES.map((mode) => <option key={mode}>{mode}</option>)}</select>
            <div className="grid grid-cols-2 gap-2">
              <input className={controlClass} inputMode="numeric" placeholder="Minutos" aria-label="Minutos" value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value })} />
              <input className={controlClass} inputMode="decimal" placeholder="Distância km" aria-label="Distância" value={form.dist} onChange={(e) => setForm({ ...form, dist: e.target.value })} />
            </div>
          </>
        )}
        <Field label="Data"><input type="date" className={controlClass} value={form.d} onChange={(e) => setForm({ ...form, d: e.target.value })} /></Field>
        <input className={controlClass} placeholder="Observações" aria-label="Observações" value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
        <Button onClick={save}>{editing ? "Salvar alterações" : "Adicionar ao treino"}</Button>
      </Panel>
      <Panel title={`Dias treinados: ${chart.reduce((s, point) => s + point.v, 0)}/7`}><WeekChart points={chart} /></Panel>
      {days.map((date) => (
        <Panel key={date} title={formatDay(date)}>
          {onDay(data, "treino", date).map((row) => (
            <div key={row.id} className="flex justify-between gap-2 border-t border-line py-2">
              <span>{row.nome} {row.grupo ? `(${row.grupo})` : ""} {row.series ? `${row.series} x ${row.reps}` : ""} {row.carga ? `${row.carga} kg` : ""} {row.min ? `${row.min} min` : ""}</span>
              <span className="flex gap-2">
                <button type="button" onClick={() => { setEditing(row.id); setKind(row.tipo === "Cardio" ? "Cardio" : "Academia"); setForm({ ...form, grupo: row.grupo || "Peito", nome: row.nome || "", series: String(row.series || ""), reps: String(row.reps || ""), carga: String(row.carga || ""), mod: row.nome || "Esteira", min: String(row.min || ""), dist: String(row.dist || ""), obs: row.obs || "", d: row.d }); }}>Editar</button>
                <button type="button" aria-label="Excluir treino" onClick={() => removeLog("treino", row.id)}>✕</button>
              </span>
            </div>
          ))}
        </Panel>
      ))}
    </div>
  );
}

export function FinanceModule() {
  const toast = useToast();
  const rows = useRows("fin");
  const [month, setMonth] = useState(monthKey());
  const [kind, setKind] = useState<"Despesa" | "Receita">("Despesa");
  const [amount, setAmount] = useState("");
  const [editing, setEditing] = useState<LogEntry | null>(null);
  const monthRows = rows.filter((row) => row.d.slice(0, 7) === month);
  const income = sumField(monthRows.filter((row) => row.tipo === "Receita"), "valor");
  const expense = sumField(monthRows.filter((row) => row.tipo === "Despesa"), "valor");
  function quick(category: string) {
    const value = Number(amount);
    if (!(value > 0)) return toast("Digite o valor primeiro.");
    const duplicate = rows.some((row) => row.d === today() && row.tipo === kind && row.cat === category && Number(row.valor) === value && !row.desc);
    const result = addLog("fin", { tipo: kind, cat: category, desc: "", valor: value });
    if (!result.ok) return toast(result.error);
    toast(`${duplicate ? "Atenção: já havia um lançamento igual hoje. " : ""}${kind === "Despesa" ? "Gasto" : "Receita"} registrado.`, true);
    setAmount("");
  }
  return (
    <div className="space-y-4">
      <Panel title="Registro rápido">
        <div className="mb-2 flex gap-2">
          <Button tone={kind === "Despesa" ? "primary" : "quiet"} onClick={() => setKind("Despesa")}>Gastei</Button>
          <Button tone={kind === "Receita" ? "primary" : "quiet"} onClick={() => setKind("Receita")}>Recebi</Button>
        </div>
        <Field label="Valor (R$)"><input className={controlClass} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <div className="flex flex-wrap gap-2">
          {(kind === "Despesa" ? QUICK_EXPENSE : QUICK_INCOME).map((category) => <button key={category} type="button" className="rounded-full border border-line px-3 py-2 text-sm" onClick={() => quick(category)}>{category}</button>)}
        </div>
      </Panel>
      <Panel title="Mês">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" aria-label="Mês anterior" onClick={() => setMonth(shiftMonth(month, -1))}>◀</button>
          <b className="capitalize">{monthLabel(month)}</b>
          <button type="button" aria-label="Próximo mês" onClick={() => setMonth(shiftMonth(month, 1))}>▶</button>
        </div>
        <p>Receitas <b className="text-ok">{brl(income)}</b> · Despesas <b className="text-danger">{brl(expense)}</b></p>
        <p>Resultado <b className={income - expense >= 0 ? "text-ok" : "text-danger"}>{brl(income - expense)}</b></p>
      </Panel>
      <FinanceForm key={editing?.id ?? "novo"} editing={editing} onDone={() => setEditing(null)} />
      <History module="fin" rows={[...monthRows].sort((a, b) => (a.d < b.d ? 1 : -1))} label={(row) => `${row.tipo === "Receita" ? "+" : "−"}${brl(Number(row.valor))} · ${row.cat} · ${row.desc || ""}`} />
      <div className="flex flex-wrap gap-2">
        {monthRows.map((row) => <button key={row.id} type="button" className="text-sm underline" onClick={() => setEditing(row)}>Editar {row.desc || row.cat}</button>)}
      </div>
    </div>
  );
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function FinanceForm({ editing, onDone }: { editing: LogEntry | null; onDone: () => void }) {
  const toast = useToast();
  const [tipo, setTipo] = useState(editing?.tipo || "Despesa");
  const [cat, setCat] = useState(editing?.cat || "Alimentação");
  const [desc, setDesc] = useState(editing?.desc || "");
  const [valor, setValor] = useState(editing ? String(editing.valor || "") : "");
  const [d, setD] = useState(editing?.d || today());
  const cats = tipo === "Receita" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <Panel title={editing ? "Editar lançamento" : "Novo lançamento"}>
      <select className={controlClass} aria-label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}><option>Despesa</option><option>Receita</option></select>
      <select className={controlClass} aria-label="Categoria" value={cat} onChange={(e) => setCat(e.target.value)}>{cats.map((item) => <option key={item}>{item}</option>)}</select>
      <input className={controlClass} placeholder="Descrição" aria-label="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <input className={controlClass} inputMode="decimal" placeholder="Valor (R$)" aria-label="Valor" value={valor} onChange={(e) => setValor(e.target.value)} />
      <input type="date" className={controlClass} aria-label="Data" value={d} onChange={(e) => setD(e.target.value)} />
      <Button onClick={() => {
        const payload = { tipo, cat, desc, valor: Number(valor) || 0, d };
        if (editing) { patchLog("fin", editing.id, payload); onDone(); toast("Lançamento atualizado.", true); return; }
        const result = addLog("fin", payload);
        if (!result.ok) return toast(result.error);
        toast("Lançamento adicionado.", true);
      }}>{editing ? "Salvar alterações" : "Adicionar"}</Button>
    </Panel>
  );
}

export function BudgetModule() {
  const toast = useToast();
  const rows = useRows("plano");
  const fin = useRows("fin");
  const [month, setMonth] = useState(monthKey());
  const [tipo, setTipo] = useState("Despesa fixa");
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [rec, setRec] = useState("Todo mês");
  const active = rows.filter((row) => (row.rec === "Todo mês" ? (row.m || "") <= month : row.m === month));
  const sum = (type: string) => sumField(active.filter((row) => row.tipo === type), "valor");
  const income = sum("Receita prevista");
  const fixed = sum("Despesa fixa");
  const variable = sum("Despesa variável");
  const left = income - fixed - variable;
  const real = fin.filter((row) => row.d.slice(0, 7) === month);
  return (
    <div className="space-y-4">
      <Panel title="Orçamento">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" aria-label="Mês anterior" onClick={() => setMonth(shiftMonth(month, -1))}>◀</button>
          <b className="capitalize">{monthLabel(month)}</b>
          <button type="button" aria-label="Próximo mês" onClick={() => setMonth(shiftMonth(month, 1))}>▶</button>
        </div>
        <p className="text-sm text-mute">Disponível para investir neste mês</p>
        <p className={`text-3xl font-extrabold ${left >= 0 ? "text-ok" : "text-danger"}`}>{brl(left)}</p>
        <p className="text-sm">Receitas {brl(income)} · Fixas {brl(fixed)} · Variáveis {brl(variable)}</p>
        <p className="mt-2 text-sm">Receita realizada {brl(sumField(real.filter((row) => row.tipo === "Receita"), "valor"))} de {brl(income)}</p>
        <Bar value={income ? (sumField(real.filter((row) => row.tipo === "Receita"), "valor") / income) * 100 : 0} tone="ok" />
      </Panel>
      <Panel title="Novo item">
        <select className={controlClass} aria-label="Tipo do orçamento" value={tipo} onChange={(e) => setTipo(e.target.value)}><option>Receita prevista</option><option>Despesa fixa</option><option>Despesa variável</option></select>
        <input className={controlClass} placeholder="Nome" aria-label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input className={controlClass} inputMode="decimal" placeholder="Valor previsto" aria-label="Valor" value={valor} onChange={(e) => setValor(e.target.value)} />
        <select className={controlClass} aria-label="Recorrência" value={rec} onChange={(e) => setRec(e.target.value)}><option>Todo mês</option><option>Só este mês</option></select>
        <Button onClick={() => {
          const result = addLog("plano", { tipo, nome, valor: Number(valor) || 0, rec, m: month });
          if (!result.ok) return toast(result.error);
          setNome(""); setValor(""); toast("Item adicionado ao orçamento.", true);
        }}>Adicionar</Button>
      </Panel>
      <History module="plano" rows={active} label={(row) => `${row.nome} · ${row.tipo} · ${brl(Number(row.valor))} · ${row.rec}`} />
    </div>
  );
}

export function InvestModule() {
  const toast = useToast();
  const rows = useRows("inv");
  const total = sumField(rows, "valor");
  const [tipo, setTipo] = useState("Renda fixa");
  const [ativo, setAtivo] = useState("");
  const [valor, setValor] = useState("");
  const groups: Record<string, number> = {};
  rows.forEach((row) => { groups[row.tipo || "Outros"] = (groups[row.tipo || "Outros"] || 0) + (Number(row.valor) || 0); });
  return (
    <div className="space-y-4">
      <Panel title={`Carteira · ${brl(total)}`}>
        {Object.entries(groups).map(([name, value]) => <div key={name}><small>{name} · {total ? Math.round((value / total) * 100) : 0}%</small><Bar value={total ? (value / total) * 100 : 0} /></div>)}
        {!rows.length ? <p className="text-sm text-mute">Registre seus ativos abaixo.</p> : null}
        <p className="mt-2 text-xs text-mute">Sem cotações em tempo real e sem recomendação financeira.</p>
      </Panel>
      <Panel title="Novo registro">
        <select className={controlClass} aria-label="Classe" value={tipo} onChange={(e) => setTipo(e.target.value)}>{["Renda fixa", "Ações", "FIIs", "Cripto", "Exterior", "Reserva"].map((item) => <option key={item}>{item}</option>)}</select>
        <input className={controlClass} placeholder="Ativo" aria-label="Ativo" value={ativo} onChange={(e) => setAtivo(e.target.value)} />
        <input className={controlClass} inputMode="decimal" placeholder="Valor investido" aria-label="Valor" value={valor} onChange={(e) => setValor(e.target.value)} />
        <Button onClick={() => { addLog("inv", { tipo, ativo, valor: Number(valor) || 0 }); setAtivo(""); setValor(""); toast("Investimento registrado.", true); }}>Adicionar</Button>
      </Panel>
      <History module="inv" rows={rows} label={(row) => `${row.tipo} · ${row.ativo} · ${brl(Number(row.valor))}`} />
    </div>
  );
}
