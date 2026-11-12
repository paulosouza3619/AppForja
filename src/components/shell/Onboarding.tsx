"use client";

import { useState } from "react";
import { FOCUS_AREAS, TIME_OPTIONS, buildPlan, recommendedTools } from "@/domain/cycle";
import { MODULES } from "@/domain/catalog";
import { defaultForja, type ForjaState } from "@/domain/types";
import { updateData } from "@/store/actions";
import { useAppStore, useForja } from "@/store/app-store";
import { Button, useToast } from "@/components/ui";

function readForja(): ForjaState {
  return { ...defaultForja(), ...(useAppStore.getState().data.forja || {}) };
}

function writeForja(forja: ForjaState) {
  updateData((state) => ({ ...state, forja }));
}

export function Onboarding() {
  const toast = useToast();
  const forja = useForja();
  const [reason, setReason] = useState(forja.reason || "");
  const [goal, setGoal] = useState(forja.goal || "");
  const step = forja.step || 0;
  const tools = MODULES.filter((m) => m.key !== "inicio" && m.key !== "config");

  function patch(partial: Partial<ForjaState>) {
    writeForja({ ...readForja(), ...partial });
  }

  function next() {
    const current = readForja();
    if (step === 0 && !(current.priorities || []).length && !current.focus) {
      toast("Escolha ao menos uma área para começar.");
      return;
    }
    if (step === 2 && (!goal.trim() || !current.time)) {
      toast("Defina um resultado e o tempo disponível.");
      return;
    }
    const focus = current.focus || current.priorities[0] || "";
    const selectedTools = step === 0 && !(current.selectedTools || []).length ? recommendedTools(focus).slice() : current.selectedTools;
    patch({ step: step + 1, reason, goal: goal.trim(), focus, selectedTools });
  }

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-black tracking-[0.16em]">FOR<span className="text-gold">JA</span></p>
        <span className="rounded-full bg-bg px-2 py-1 text-xs font-bold text-mute">COMECE POR AQUI</span>
      </div>
      <div className="mb-5 flex gap-1.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => <i key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-gold" : "bg-line"}`} />)}
      </div>
      {step === 0 ? (
        <>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold">Seu ponto de partida · 1 de 4</p>
          <h1 className="mt-2 text-3xl font-extrabold">O que você quer melhorar primeiro?</h1>
          <p className="mt-2 text-mute">Marque uma ou mais áreas. Isso só ajuda o Forja a entender o que importa agora.</p>
          <div className="my-4 grid gap-2 sm:grid-cols-2">
            {FOCUS_AREAS.map(([value, label]) => {
              const on = (forja.priorities || []).includes(value) || forja.focus === value;
              return (
                <button key={value} type="button" className={`min-h-16 rounded-xl border p-4 text-left font-semibold ${on ? "border-gold bg-gold/10" : "border-line bg-bg"}`} onClick={() => {
                  const priorities = forja.priorities?.includes(value) ? forja.priorities.filter((item) => item !== value) : [...(forja.priorities || []), value];
                  patch({ priorities, focus: priorities[0] || "" });
                }}>{on ? "✓ " : ""}{label}</button>
              );
            })}
          </div>
          <label className="block text-sm font-bold" htmlFor="f_reason">O que fez você querer começar agora? (opcional)</label>
          <textarea id="f_reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} onBlur={() => patch({ reason })} className="mt-2 w-full rounded-lg border border-[#39414a] bg-[#101419] p-3" />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold">Seu espaço de trabalho · 2 de 4</p>
          <h1 className="mt-2 text-3xl font-extrabold">Quais ferramentas quer deixar à mão?</h1>
          <div className="my-4 grid gap-2 sm:grid-cols-2">
            {tools.map((tool) => {
              const on = (forja.selectedTools || []).includes(tool.key);
              const suggested = recommendedTools(forja.focus).includes(tool.key);
              return (
                <button key={tool.key} type="button" className={`rounded-xl border p-4 text-left ${on ? "border-gold bg-gold/10" : "border-line bg-bg"}`} onClick={() => {
                  const selectedTools = on ? forja.selectedTools.filter((item) => item !== tool.key) : [...(forja.selectedTools || []), tool.key];
                  patch({ selectedTools });
                }}>
                  <b>{on ? "✓ " : ""}{tool.name}</b>
                  <small className="mt-1 block text-mute">{tool.description}{suggested ? " · sugerida" : ""}</small>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
      {step === 2 ? (
        <>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold">Seu compromisso · 3 de 4</p>
          <h1 className="mt-2 text-3xl font-extrabold">Escolha um resultado para os próximos 30 dias.</h1>
          <label className="mt-4 block text-sm font-bold" htmlFor="f_goal">O que você quer ter mudado ao final de 30 dias?</label>
          <textarea id="f_goal" rows={3} maxLength={180} value={goal} onChange={(e) => setGoal(e.target.value)} onBlur={() => patch({ goal: goal.trim() })} className="mt-2 w-full rounded-lg border border-[#39414a] bg-[#101419] p-3" />
          <div className="my-4 grid gap-2 sm:grid-cols-2">
            {TIME_OPTIONS.map(([value, label]) => (
              <button key={value} type="button" className={`min-h-16 rounded-xl border p-4 text-left font-semibold ${forja.time === value ? "border-gold bg-gold/10" : "border-line bg-bg"}`} onClick={() => patch({ time: value, goal: goal.trim() })}>{label}</button>
            ))}
          </div>
        </>
      ) : null}
      {step === 3 ? (
        <>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold">Tudo pronto · 4 de 4</p>
          <h1 className="mt-2 text-3xl font-extrabold">Seu Forja começa com foco.</h1>
          <div className="mt-4 space-y-2 rounded-2xl border border-line p-4 text-sm">
            <p><b>Áreas:</b> {(forja.priorities.length ? forja.priorities : [forja.focus]).map((v) => FOCUS_AREAS.find((a) => a[0] === v)?.[1] || v).join(" · ")}</p>
            <p><b>Ferramentas:</b> {(forja.selectedTools || []).map((key) => MODULES.find((m) => m.key === key)?.name || key).join(" · ") || "Nenhuma"}</p>
            <p><b>Resultado:</b> {forja.goal || goal || "Construir consistência e retomar o controle"}</p>
            <p><b>Tempo:</b> {forja.time} minutos por dia</p>
          </div>
        </>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        {step > 0 ? <Button tone="quiet" onClick={() => patch({ step: step - 1 })}>Voltar</Button> : null}
        {step < 3 ? <Button onClick={next}>Continuar</Button> : <Button onClick={() => writeForja(buildPlan({ ...readForja(), goal: (readForja().goal || goal).trim(), reason }))}>Montar meu plano e começar</Button>}
      </div>
    </div>
  );
}
