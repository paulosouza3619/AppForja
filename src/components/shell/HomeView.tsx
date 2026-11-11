"use client";

import Link from "next/link";
import { cycleStats } from "@/domain/cycle";
import { MODULES, MODULE_IMAGES } from "@/domain/catalog";
import { today } from "@/domain/dates";
import { defaultForja } from "@/domain/types";
import { updateData } from "@/store/actions";
import { useAppStore } from "@/store/app-store";
import { Button, Panel, useToast } from "@/components/ui";

export function HomeView() {
  const toast = useToast();
  const forja = useAppStore((s) => ({ ...defaultForja(), ...(s.data.forja || {}) }));
  const stats = cycleStats(forja);
  const day = today();
  const done = forja.done[day] || {};
  const actions = forja.actions || [];
  const finished = actions.length > 0 && stats.today === actions.length;
  const next = actions.find((action) => !done[action.id]);

  function toggle(id: string) {
    const willDo = !done[id];
    updateData((state) => {
      const current = { ...defaultForja(), ...(state.forja || {}) };
      const todayDone = { ...(current.done[day] || {}), [id]: willDo };
      return { ...state, forja: { ...current, done: { ...current.done, [day]: todayDone } } };
    });
    if (willDo) toast("Prioridade concluída. Registre a próxima execução.", true);
  }

  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <p className="font-black tracking-[0.16em]">FOR<span className="text-gold">JA</span></p>
        <span className="rounded-full bg-card px-2 py-1 text-xs font-bold text-mute">CICLO DE {forja.cycleDays || 30} DIAS</span>
      </header>
      <h1 className="text-3xl font-extrabold tracking-tight">Seu próximo passo começa aqui.</h1>
      <p className="mt-1 text-mute">Uma prioridade por vez. O objetivo é executar, não passar o dia organizando o aplicativo.</p>
      <section className="relative my-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#111c30] to-[#1e3555] p-6 text-white">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold">Ciclo de evolução · Dia {stats.elapsed} de {forja.cycleDays || 30}</p>
        <h2 className="mt-2 text-3xl font-extrabold">{forja.cycleTitle || "Construir consistência"}</h2>
        <p className="mt-2 max-w-xl text-[#d0d8e5]">Seu resultado desejado para este ciclo. Volte aqui para executar o próximo passo.</p>
        <div className="mt-4 max-w-xl">
          <div className="flex justify-between text-xs text-[#d0d8e5]"><span>Execução do plano no ciclo</span><b>{stats.rate}%</b></div>
          <div className="mt-1.5 h-2 rounded-full bg-white/20"><i className="block h-2 rounded-full bg-[#d4ad5b]" style={{ width: `${stats.rate}%` }} /></div>
          <p className="mt-2 text-xs text-[#d0d8e5]">{stats.total} de {stats.planned} ações previstas concluídas · {stats.remaining ? `${stats.remaining} dias restantes` : "ciclo encerrado"}</p>
        </div>
      </section>
      <Panel title="Seu espaço ativo">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm text-mute">Só as ferramentas que você escolheu para este momento.</p>
          <Link href="/ferramentas" className="rounded-xl border border-line px-3 py-2 text-sm">Gerenciar</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(forja.selectedTools || []).slice(0, 4).map((key) => {
            const tool = MODULES.find((item) => item.key === key);
            if (!tool) return null;
            return (
              <Link key={key} href={`/ferramentas/${key}`} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MODULE_IMAGES[key]} alt="" className="h-16 w-16 rounded-xl object-cover" />
                <span><b className="block">{tool.name}</b><small className="text-mute">Abrir ferramenta</small></span>
              </Link>
            );
          })}
        </div>
      </Panel>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_.8fr]">
        <div className="space-y-4">
          <Panel title="O que fazer hoje">
            <p className="mb-2 text-xs font-bold text-mute">{stats.today}/{actions.length} concluídas</p>
            {actions.map((action) => (
              <div key={action.id} className="flex flex-wrap items-center gap-3 border-t border-line py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MODULE_IMAGES[action.module] || MODULE_IMAGES.todo} alt="" className="h-11 w-11 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <strong className="block">{action.title}</strong>
                  <small className="text-mute">{action.area} · {action.duration}</small>
                </div>
                <Link href={`/ferramentas/${action.module}`} className="rounded-xl bg-ember px-3 py-2 text-sm font-bold text-[#15181b]">Abrir</Link>
                <button type="button" onClick={() => toggle(action.id)} className={`min-h-11 rounded-xl px-3 text-sm font-bold ${done[action.id] ? "bg-ok text-white" : "border border-line bg-bg"}`}>
                  {done[action.id] ? "Feito ✓" : "Concluir"}
                </button>
              </div>
            ))}
            {finished ? <p className="mt-3 border-l-4 border-gold bg-bg p-3 text-sm">Você cumpriu o combinado de hoje. Pare por aqui.</p> : null}
            {!finished && next ? <p className="mt-3 border-l-4 border-gold bg-bg p-3 text-sm"><b>Comece por esta:</b> {next.title}.</p> : null}
          </Panel>
          <Panel title="Orientação do Forja">
            <p className="border-l-4 border-gold bg-bg p-3 text-sm">
              {finished ? "Você cumpriu as prioridades registradas para hoje. Preserve o ritmo." : stats.today === 0 ? "Você ainda não concluiu nenhuma prioridade hoje. Comece pela primeira." : "Você começou. Termine o que foi combinado antes de adicionar novas tarefas."}
            </p>
          </Panel>
        </div>
        <aside className="space-y-4">
          <Panel title="Seu acompanhamento">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-bg p-3"><b className="block text-xl">{stats.today}/{actions.length}</b><small className="text-mute">Hoje</small></div>
              <div className="rounded-xl bg-bg p-3"><b className="block text-xl">{stats.total}</b><small className="text-mute">No ciclo</small></div>
              <div className="rounded-xl bg-bg p-3"><b className="block text-xl">{stats.days}</b><small className="text-mute">Dias ativos</small></div>
            </div>
            <Link href="/desempenho" className="mt-3 block"><Button tone="quiet" className="w-full">Ver meu desempenho</Button></Link>
          </Panel>
          <Panel title={stats.remaining ? "Próxima revisão" : "Ciclo concluído"}>
            <p className="mb-3 text-sm text-mute">{stats.remaining ? "Reserve alguns minutos no fim da semana para avaliar o que funcionou." : "Seu ciclo de 30 dias terminou. Revise os dados antes do próximo objetivo."}</p>
            <Link href="/desempenho"><Button className="w-full">{stats.remaining ? "Fazer revisão" : "Revisar ciclo"}</Button></Link>
            {!stats.remaining ? <Button tone="quiet" className="mt-2 w-full" onClick={() => updateData((state) => ({ ...state, forja: { ...defaultForja(), ...(state.forja || {}), onboarded: false, step: 0, view: "hoje" } }))}>Planejar novo ciclo</Button> : null}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
