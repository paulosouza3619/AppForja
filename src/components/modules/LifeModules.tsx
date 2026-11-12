"use client";

import { useState } from "react";
import { ago, formatDay, monthLabel, today } from "@/domain/dates";
import { CHECKLIST_SUGGESTIONS, WEEKDAYS, checklistDue, checklistLabel } from "@/domain/checklist";
import { BOSS_REWARDS, VICE_SUGGESTIONS, bossDisplayName, bossState } from "@/domain/bosses";
import { MISSION_DIFFICULTIES, MISSION_LIMITS, MISSION_XP, activeMissionCount, missionProgress, missionStatus } from "@/domain/missions";
import { OBJECTIVE_TERMS } from "@/domain/xp";
import { onDay, sumField, weekSeries } from "@/domain/records";
import { EMPTY_LOGS, type LogEntry } from "@/domain/types";
import { addLog, missionXpToast, patchLog, removeLog, setGoals, toggleFlag, toggleTodo } from "@/store/actions";
import { useAppStore } from "@/store/app-store";
import { Bar, Button, Panel, WeekChart, controlClass, useToast } from "@/components/ui";

export function TodoModule() {
  const toast = useToast();
  const rows = useAppStore((s) => s.data.d.todo ?? EMPTY_LOGS);
  const [cursor, setCursor] = useState(today().slice(0, 7));
  const [selected, setSelected] = useState(today());
  const [text, setText] = useState("");
  const [year, month] = cursor.split("-").map(Number);
  const first = new Date(year, month - 1, 1).getDay();
  const count = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const dayRows = rows.filter((row) => row.d === selected);
  return (
    <div className="space-y-4">
      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <button type="button" aria-label="Mês anterior" onClick={() => setCursor(shift(cursor, -1))}>◀</button>
          <b className="capitalize">{monthLabel(cursor)}</b>
          <button type="button" aria-label="Próximo mês" onClick={() => setCursor(shift(cursor, 1))}>▶</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-mute">{["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <b key={`${d}${i}`}>{d}</b>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, index) => {
            if (!day) return <span key={`e${index}`} />;
            const iso = `${cursor}-${String(day).padStart(2, "0")}`;
            const tasks = rows.filter((row) => row.d === iso);
            return (
              <button key={iso} type="button" onClick={() => setSelected(iso)} className={`relative aspect-square rounded-lg border text-sm ${iso === selected ? "bg-ember text-[#15181b]" : "border-line bg-bg"} ${iso === today() ? "border-ember" : ""}`}>
                {day}
                {tasks.length ? <i className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${tasks.every((task) => task.done) ? "bg-ok" : "bg-danger"}`} /> : null}
              </button>
            );
          })}
        </div>
      </Panel>
      <Panel title={`Tarefas de ${formatDay(selected)}`}>
        {dayRows.map((row) => (
          <label key={row.id} className="flex items-center justify-between gap-2 border-t border-line py-2">
            <span className="flex items-center gap-2"><input type="checkbox" checked={Boolean(row.done)} onChange={() => toggleTodo(row.id)} />{row.done ? <s>{row.txt}</s> : row.txt}</span>
            <button type="button" aria-label="Excluir tarefa" onClick={() => removeLog("todo", row.id)}>✕</button>
          </label>
        ))}
        {!dayRows.length ? <p className="text-sm text-mute">Sem tarefas neste dia. Cada tarefa concluída dá +10 XP.</p> : null}
        <input className={controlClass} placeholder="Nova tarefa" aria-label="Nova tarefa" value={text} onChange={(e) => setText(e.target.value)} />
        <Button onClick={() => {
          const result = addLog("todo", { txt: text.trim(), d: selected, done: false });
          if (!result.ok) return toast(result.error);
          setText("");
          toast("Tarefa adicionada.", true);
        }}>Adicionar</Button>
      </Panel>
    </div>
  );
}

function shift(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function HabitsModule() {
  const [tab, setTab] = useState<"Checklist" | "Chefões" | "Hábitos">("Checklist");
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {(["Checklist", "Chefões", "Hábitos"] as const).map((item) => <Button key={item} tone={tab === item ? "primary" : "quiet"} onClick={() => setTab(item)}>{item}</Button>)}
      </div>
      {tab === "Checklist" ? <Checklist /> : null}
      {tab === "Chefões" ? <Bosses /> : null}
      {tab === "Hábitos" ? <GoodHabits /> : null}
    </div>
  );
}

function Checklist() {
  const toast = useToast();
  const data = useAppStore((s) => s.data);
  const rows = data.d.check || [];
  const day = today();
  const due = rows.filter((row) => checklistDue(row, day));
  const done = due.filter((row) => data.cc[day]?.[row.id]).length;
  const [text, setText] = useState("");
  const [rep, setRep] = useState("Diária");
  const [wd, setWd] = useState(String(new Date().getDay()));
  const [dm, setDm] = useState(String(new Date().getDate()));
  const chart = [6, 5, 4, 3, 2, 1, 0].map((n) => {
    const date = ago(n);
    const items = rows.filter((row) => checklistDue(row, date));
    const hits = items.filter((row) => data.cc[date]?.[row.id]).length;
    return { l: date.slice(8), v: items.length ? Math.round((hits / items.length) * 100) : 0 };
  });
  return (
    <>
      <Panel title="Checklist de hoje">
        <p className="text-sm text-mute">{due.length ? `${done} de ${due.length} concluídos` : "Nada para hoje. Crie itens abaixo."}</p>
        {due.length ? <Bar value={(done / due.length) * 100} tone="ok" /> : null}
        {due.map((row) => (
          <label key={row.id} className="flex items-center justify-between gap-2 border-t border-line py-2">
            <span className="flex items-center gap-2"><input type="checkbox" checked={Boolean(data.cc[day]?.[row.id])} onChange={() => toggleFlag("cc", row.id, day)} />{row.txt}<small className="text-mute">{checklistLabel(row)}</small></span>
            <button type="button" aria-label="Excluir item" onClick={() => removeLog("check", row.id)}>✕</button>
          </label>
        ))}
      </Panel>
      {rows.length ? <Panel title="Conclusão nos últimos 7 dias (%)"><WeekChart points={chart} goal={100} /></Panel> : null}
      <Panel title="Novo item">
        <input className={controlClass} placeholder="Ex: Arrumar a cama" aria-label="Item" value={text} onChange={(e) => setText(e.target.value)} />
        <select className={controlClass} aria-label="Repetição" value={rep} onChange={(e) => setRep(e.target.value)}><option>Diária</option><option>Semanal</option><option>Mensal</option></select>
        {rep === "Semanal" ? <select className={controlClass} aria-label="Dia da semana" value={wd} onChange={(e) => setWd(e.target.value)}>{WEEKDAYS.map((name, i) => <option key={name} value={i}>{name}</option>)}</select> : null}
        {rep === "Mensal" ? <input className={controlClass} inputMode="numeric" aria-label="Dia do mês" value={dm} onChange={(e) => setDm(e.target.value)} /> : null}
        <Button onClick={() => {
          const result = addLog("check", { txt: text.trim(), rep, wd: Number(wd), dm: Number(dm) });
          if (!result.ok) return toast(result.error);
          setText("");
          toast("Item adicionado.", true);
        }}>Adicionar</Button>
      </Panel>
      <Panel title="Sugestões">
        <div className="flex flex-wrap gap-2">
          {CHECKLIST_SUGGESTIONS.filter(([label]) => !rows.some((row) => (row.txt || "").toLowerCase() === label.toLowerCase())).map(([label, repeat, extra]) => (
            <button key={label} type="button" className="rounded-full border border-line px-3 py-2 text-sm" onClick={() => {
              const result = addLog("check", { txt: label, rep: repeat, wd: extra, dm: extra });
              if (!result.ok) toast(result.error);
            }}>{label}</button>
          ))}
        </div>
      </Panel>
    </>
  );
}

function Bosses() {
  const toast = useToast();
  const data = useAppStore((s) => s.data);
  const rows = (data.d.habitos || []).filter((row) => row.tipo === "Ruim");
  const [nome, setNome] = useState("");
  const [dif, setDif] = useState("Comum");
  const [dur, setDur] = useState("");
  const [falhas, setFalhas] = useState("");
  const wins = rows.reduce((s, row) => s + (row.bat || []).filter((battle) => battle.res === "win").length + (bossState(data, row).st === "win" ? 1 : 0), 0);
  return (
    <>
      <Panel><p className="text-center text-3xl font-extrabold text-gold">{wins}</p><p className="text-center text-sm text-mute">chefões derrotados · {rows.length} em campo</p></Panel>
      {rows.map((row) => {
        const boss = bossState(data, row);
        const [title, epithet] = bossDisplayName(row.id).split(",");
        const fell = Boolean(data.hc[today()]?.[row.id]);
        return (
          <Panel key={row.id}>
            <p className="text-center text-lg font-extrabold tracking-wide text-gold">{title.toUpperCase()}</p>
            <p className="text-center text-sm text-mute">{epithet?.trim()}</p>
            <p className="text-center">Vício: <b>{row.nome}</b> · {row.dif || "Comum"}</p>
            <p className="mt-2 text-sm">Vida do chefão {boss.life}%</p>
            <Bar value={boss.life} tone="danger" />
            <p className="text-xs text-mute">Recompensa +{boss.r} XP · Punição −{boss.pn} XP · Falhas {boss.sl}/{boss.F} · Dias {Math.min(boss.el, boss.D)}/{boss.D}</p>
            {boss.st === "on" ? <Button className="mt-2" tone={fell ? "danger" : "quiet"} onClick={() => toggleFlag("hc", row.id)}>{fell ? "Caí hoje (desfazer)" : "Registrar queda hoje"}</Button> : null}
            {boss.st === "win" ? <p className="mt-2 font-bold text-ok">CHEFÃO DERROTADO! +{boss.r} XP</p> : null}
            {boss.st === "lose" ? <p className="mt-2 font-bold text-danger">DERROTA. O chefão venceu (−{boss.pn} XP).</p> : null}
            {boss.st !== "on" ? <Button className="mt-2" onClick={() => restart(row.id)}> {boss.st === "win" ? "Nova batalha" : "Recomeçar batalha"}</Button> : null}
            <button type="button" className="mt-2 block text-sm text-mute" onClick={() => removeLog("habitos", row.id)}>Excluir</button>
          </Panel>
        );
      })}
      <Panel title="Novo chefão">
        <input className={controlClass} placeholder="Vício ou mau hábito" aria-label="Nome do chefão" value={nome} onChange={(e) => setNome(e.target.value)} />
        <div className="mb-2 flex flex-wrap gap-2">{VICE_SUGGESTIONS.map((vice) => <button key={vice} type="button" className="rounded-full border border-line px-3 py-1 text-sm" onClick={() => setNome(vice)}>{vice}</button>)}</div>
        <select className={controlClass} aria-label="Dificuldade" value={dif} onChange={(e) => setDif(e.target.value)}>{Object.keys(BOSS_REWARDS).map((name) => <option key={name}>{name}</option>)}</select>
        <input className={controlClass} inputMode="numeric" placeholder="Duração em dias (padrão 30)" aria-label="Duração" value={dur} onChange={(e) => setDur(e.target.value)} />
        <input className={controlClass} inputMode="numeric" placeholder="Falhas permitidas (padrão 1)" aria-label="Falhas" value={falhas} onChange={(e) => setFalhas(e.target.value)} />
        <Button onClick={() => {
          if (!nome.trim()) return toast("Informe o vício ou mau hábito.");
          const result = addLog("habitos", { nome: nome.trim(), tipo: "Ruim", dif, dur: Math.max(3, Number(dur) || 30), falhas: falhas === "" ? 1 : Math.max(0, Number(falhas)) });
          if (!result.ok) return toast(result.error);
          setNome("");
          toast("Chefão criado.", true);
        }}>Criar chefão</Button>
      </Panel>
    </>
  );
}

function restart(id: number) {
  useAppStore.getState().update((state) => ({
    ...state,
    d: {
      ...state.d,
      habitos: (state.d.habitos || []).map((row) => {
        if (row.id !== id) return row;
        const boss = bossState(state, row);
        return { ...row, bs: today(), bat: [...(row.bat || []), { d: today(), res: boss.st, xp: boss.st === "win" ? boss.r : boss.st === "lose" ? -boss.pn : 0 }] };
      }),
    },
  }));
}

function GoodHabits() {
  const toast = useToast();
  const data = useAppStore((s) => s.data);
  const rows = data.d.habitos || [];
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("Bom");
  const day = today();
  return (
    <Panel title="Hoje">
      {rows.map((row) => {
        const bad = row.tipo === "Ruim";
        const marked = Boolean(data.hc[day]?.[row.id]);
        return (
          <div key={row.id} className="flex items-center justify-between gap-2 border-t border-line py-2">
            <div><b className={bad ? "text-danger" : "text-ok"}>{row.nome}</b><p className="text-xs text-mute">{bad ? "Hábito ruim" : "Hábito bom"}</p></div>
            <div className="flex items-center gap-2">
              <Button tone={marked ? (bad ? "danger" : "primary") : "quiet"} onClick={() => toggleFlag("hc", row.id)}>{bad ? (marked ? "Caí hoje" : "Registrar queda") : marked ? "Feito" : "Marcar"}</Button>
              <button type="button" aria-label="Excluir hábito" onClick={() => removeLog("habitos", row.id)}>✕</button>
            </div>
          </div>
        );
      })}
      {!rows.length ? <p className="text-sm text-mute">Hábitos bons dão +15 XP por dia. Hábitos ruins viram chefões.</p> : null}
      <input className={controlClass} placeholder="Nome do hábito" aria-label="Nome do hábito" value={nome} onChange={(e) => setNome(e.target.value)} />
      <select className={controlClass} aria-label="Tipo de hábito" value={tipo} onChange={(e) => setTipo(e.target.value)}><option>Bom</option><option>Ruim</option></select>
      <Button onClick={() => {
        const result = addLog("habitos", { nome: nome.trim(), tipo });
        if (!result.ok) return toast(result.error);
        setNome("");
        toast("Hábito criado.", true);
      }}>Adicionar</Button>
    </Panel>
  );
}

export function MissionsModule() {
  const toast = useToast();
  const rows = useAppStore((s) => s.data.d.metas ?? EMPTY_LOGS);
  const [filter, setFilter] = useState("Todas");
  const [form, setForm] = useState({ dif: "Média", area: "Física", termo: "Curto prazo", nome: "", ini: "", alvo: "", un: "", prazo: "" });
  const visible = rows.filter((row) => filter === "Todas" || missionStatus(row) === filter);
  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid grid-cols-3 text-center">
          {(["Ativa", "Concluída", "Fracassada"] as const).map((status) => <div key={status}><b className="text-2xl">{rows.filter((row) => missionStatus(row) === status).length}</b><p className="text-xs text-mute">{status.toLowerCase()}s</p></div>)}
        </div>
      </Panel>
      <Panel title="Quadro de missões">
        {MISSION_DIFFICULTIES.slice().reverse().map((name) => <div key={name} className="flex justify-between border-t border-line py-2 text-sm"><span>{name} · +{MISSION_XP[name]} XP</span><b>{activeMissionCount(rows, name)} / {MISSION_LIMITS[name] || "∞"}</b></div>)}
      </Panel>
      <div className="flex gap-2 overflow-x-auto">{["Todas", "Ativa", "Concluída", "Fracassada"].map((item) => <Button key={item} tone={filter === item ? "primary" : "quiet"} onClick={() => setFilter(item)}>{item}</Button>)}</div>
      {visible.map((row) => {
        const status = missionStatus(row);
        const progress = Math.max(0, Math.min(100, missionProgress(row)));
        return (
          <Panel key={row.id}>
            <div className="flex justify-between gap-2"><b>{row.nome}</b><span className="text-sm">{status}</span></div>
            <p className="text-xs text-mute">{row.dif} · {row.area} · {row.termo}</p>
            <Bar value={progress} tone={status === "Concluída" ? "ok" : status === "Fracassada" ? "danger" : "ember"} />
            <p className="text-sm">{row.atual} → {row.alvo} {row.un} · {progress}%</p>
            {status === "Ativa" ? <MissionUpdate row={row} /> : null}
            <button type="button" className="text-sm text-mute" onClick={() => removeLog("metas", row.id)}>Excluir</button>
          </Panel>
        );
      })}
      <Panel title="Nova missão">
        <select className={controlClass} aria-label="Dificuldade" value={form.dif} onChange={(e) => setForm({ ...form, dif: e.target.value })}>{MISSION_DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}</select>
        <select className={controlClass} aria-label="Área" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>{["Física", "Mental", "Espiritual", "Financeira"].map((item) => <option key={item}>{item}</option>)}</select>
        <select className={controlClass} aria-label="Prazo da missão" value={form.termo} onChange={(e) => setForm({ ...form, termo: e.target.value })}><option>Curto prazo</option><option>Longo prazo</option></select>
        <input className={controlClass} placeholder="Missão" aria-label="Nome da missão" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <input className={controlClass} inputMode="decimal" placeholder="Valor inicial" aria-label="Valor inicial" value={form.ini} onChange={(e) => setForm({ ...form, ini: e.target.value })} />
        <input className={controlClass} inputMode="decimal" placeholder="Valor alvo" aria-label="Valor alvo" value={form.alvo} onChange={(e) => setForm({ ...form, alvo: e.target.value })} />
        <input className={controlClass} placeholder="Unidade" aria-label="Unidade" value={form.un} onChange={(e) => setForm({ ...form, un: e.target.value })} />
        <input type="date" className={controlClass} aria-label="Prazo final" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
        <Button onClick={() => {
          const result = addLog("metas", { ...form, ini: Number(form.ini) || 0, alvo: Number(form.alvo) || 0 });
          if (!result.ok) return toast(result.error);
          setForm({ ...form, nome: "", ini: "", alvo: "", un: "", prazo: "" });
          toast("Missão criada.", true);
        }}>Adicionar</Button>
      </Panel>
    </div>
  );
}

function MissionUpdate({ row }: { row: LogEntry }) {
  const toast = useToast();
  const [value, setValue] = useState("");
  return (
    <div className="mt-2 flex gap-2">
      <input className={controlClass} inputMode="decimal" placeholder="Novo valor atual" aria-label="Novo valor atual" value={value} onChange={(e) => setValue(e.target.value)} />
      <Button onClick={() => {
        if (value === "") return;
        const next = { ...row, atual: Number(value) };
        patchLog("metas", row.id, { atual: Number(value) });
        const message = missionXpToast(next);
        if (message) toast(message, true);
        setValue("");
      }}>Atualizar</Button>
    </div>
  );
}

export function ReadingModule() {
  const data = useAppStore((s) => s.data);
  const goal = data.g.pages;
  const rows = data.d.leitura || [];
  const total = sumField(onDay(data, "leitura", today()), "pgs");
  const books: Record<string, { p: number; t: number }> = {};
  rows.forEach((row) => {
    const book = books[row.livro || ""] || { p: 0, t: 0 };
    book.p += Number(row.pgs) || 0;
    book.t = Math.max(book.t, Number(row.total) || 0);
    books[row.livro || ""] = book;
  });
  return (
    <div className="space-y-4">
      <Panel title={`Hoje: ${total} / ${goal} páginas`}>
        <Bar value={(total / goal) * 100} tone="ok" />
        <WeekChart points={weekSeries(data, "leitura", "pgs", today(), ago)} goal={goal} />
        <GoalField label="Meta diária (págs)" current={goal} onSave={(pages) => setGoals({ pages })} />
      </Panel>
      {Object.keys(books).length ? <Panel title="Livros">{Object.entries(books).map(([name, book]) => <div key={name}><small>{name} · {book.p}{book.t ? `/${book.t}` : ""} págs</small><Bar value={book.t ? (book.p / book.t) * 100 : 0} /></div>)}</Panel> : null}
      <SimpleForm module="leitura" fields={[["livro", "Título do livro", "text"], ["pgs", "Páginas lidas hoje", "number"], ["total", "Total de páginas do livro", "number"]]} />
    </div>
  );
}

export function SkillModule() {
  const data = useAppStore((s) => s.data);
  const rows = [...(data.d.skill || [])].reverse();
  const books: Record<string, { m: number; n: number; s: number }> = {};
  rows.forEach((row) => {
    const item = books[row.skill || ""] || { m: 0, n: 0, s: 0 };
    item.m += Number(row.min) || 0;
    item.s += 1;
    if (row.nivel) item.n = Number(row.nivel);
    books[row.skill || ""] = item;
  });
  return (
    <div className="space-y-4">
      <Panel title="Minutos praticados (7 dias)"><WeekChart points={weekSeries(data, "skill", "min", today(), ago)} /></Panel>
      {Object.keys(books).length ? <Panel title="Desempenho por habilidade">{Object.entries(books).map(([name, item]) => <div key={name}><small><b>{name}</b> · {(item.m / 60).toFixed(1)} h · nível {item.n}/10</small><Bar value={item.n * 10} tone="ok" /></div>)}</Panel> : null}
      <SimpleForm module="skill" fields={[["skill", "Habilidade", "text"], ["min", "Minutos", "number"], ["nivel", "Nível atual (1–10)", "number"], ["obs", "O que treinou", "text"]]} />
    </div>
  );
}

export function PeaceModule() {
  const data = useAppStore((s) => s.data);
  return (
    <div className="space-y-4">
      <Panel title="Minutos de paz (7 dias)">
        <WeekChart points={weekSeries(data, "paz", "min", today(), ago)} />
        <p className="text-sm text-mute">Hoje: {sumField(onDay(data, "paz", today()), "min")} min · {onDay(data, "paz", today()).length} momento(s)</p>
      </Panel>
      <SimpleForm module="paz" fields={[["tipo", "Tipo", "select", "Meditação,Oração,Autoavaliação,Gratidão,Silêncio"], ["min", "Minutos", "number"], ["nota", "Reflexão (opcional)", "text"]]} />
    </div>
  );
}

export function ObjectivesModule() {
  const toast = useToast();
  const rows = useAppStore((s) => s.data.d.obj ?? EMPTY_LOGS);
  const [nome, setNome] = useState("");
  const [termo, setTermo] = useState<keyof typeof OBJECTIVE_TERMS>("Curto prazo");
  const [prazo, setPrazo] = useState("");
  return (
    <div className="space-y-4">
      <Panel title="Objetivos">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between border-t border-line py-2">
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(row.done)} onChange={() => patchLog("obj", row.id, { done: !row.done })} />{row.nome}<small className="text-mute">{row.termo}</small></label>
            <button type="button" aria-label="Excluir objetivo" onClick={() => removeLog("obj", row.id)}>✕</button>
          </div>
        ))}
        <input className={controlClass} placeholder="Objetivo" aria-label="Objetivo" value={nome} onChange={(e) => setNome(e.target.value)} />
        <select className={controlClass} aria-label="Horizonte" value={termo} onChange={(e) => setTermo(e.target.value as keyof typeof OBJECTIVE_TERMS)}>{Object.keys(OBJECTIVE_TERMS).map((item) => <option key={item}>{item}</option>)}</select>
        <input type="date" className={controlClass} aria-label="Prazo" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        <Button onClick={() => {
          const result = addLog("obj", { nome: nome.trim(), termo, prazo, done: false });
          if (!result.ok) return toast(result.error);
          setNome("");
          toast(`Objetivo criado. Conquistar vale +${OBJECTIVE_TERMS[termo][1]} XP.`, true);
        }}>Adicionar</Button>
      </Panel>
    </div>
  );
}

function GoalField({ label, current, onSave }: { label: string; current: number; onSave: (value: number) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="mt-2 flex gap-2">
      <input className={controlClass} inputMode="numeric" placeholder={label} aria-label={label} value={value} onChange={(e) => setValue(e.target.value)} />
      <Button onClick={() => onSave(Number(value) || current)}>Definir</Button>
    </div>
  );
}

function SimpleForm({ module, fields }: { module: string; fields: [string, string, "text" | "number" | "select", string?][] }) {
  const toast = useToast();
  const rows = useAppStore((s) => s.data.d[module] ?? EMPTY_LOGS);
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <>
      <Panel title="Novo registro">
        {fields.map(([key, label, kind, options]) => kind === "select" ? (
          <select key={key} className={controlClass} aria-label={label} value={values[key] || options?.split(",")[0] || ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })}>
            {options?.split(",").map((option) => <option key={option}>{option}</option>)}
          </select>
        ) : (
          <input key={key} className={controlClass} inputMode={kind === "number" ? "decimal" : "text"} placeholder={label} aria-label={label} value={values[key] || ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
        ))}
        <Button onClick={() => {
          const payload: Record<string, string | number> = {};
          let any = false;
          fields.forEach(([key, , kind, options]) => {
            const raw = values[key] ?? (kind === "select" ? options?.split(",")[0] || "" : "");
            payload[key] = kind === "number" ? Number(raw) || 0 : raw;
            if (kind !== "select" && String(raw).trim()) any = true;
          });
          if (!any) return toast("Preencha pelo menos um campo antes de salvar.");
          addLog(module, payload as Partial<LogEntry>);
          setValues({});
          toast("Registro adicionado.", true);
        }}>Adicionar</Button>
      </Panel>
      <Panel title="Histórico">
        {rows.slice(0, 25).map((row) => (
          <div key={row.id} className="flex justify-between border-t border-line py-2 text-sm">
            <span>{fields.map(([key]) => String((row as unknown as Record<string, unknown>)[key] ?? "")).filter(Boolean).join(" · ")}<br /><small className="text-mute">{row.d}</small></span>
            <button type="button" aria-label="Excluir" onClick={() => removeLog(module, row.id)}>✕</button>
          </div>
        ))}
        {!rows.length ? <p className="text-sm text-mute">Nenhum registro ainda.</p> : null}
      </Panel>
    </>
  );
}
