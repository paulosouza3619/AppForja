"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FOCUS_AREAS, cycleStats, performanceWindow } from "@/domain/cycle";
import { MODULES, MODULE_GROUPS, MODULE_IMAGES } from "@/domain/catalog";
import { formatDay, today } from "@/domain/dates";
import { defaultForja } from "@/domain/types";
import { publicAvatarUrl, pushCloud, uploadAvatar } from "@/lib/sync";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { updateData } from "@/store/actions";
import { useAppStore, useForja } from "@/store/app-store";
import { Button, Panel, useToast } from "@/components/ui";

export function EvolutionView() {
  const forja = useForja();
  const stats = cycleStats(forja);
  const labels = Object.fromEntries(FOCUS_AREAS);
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Minha evolução</h1>
      <p className="text-mute">Seu objetivo, o plano que você assumiu e o que já foi executado.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_.8fr]">
        <Panel title="Seu ciclo atual">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold">30 dias · início em {forja.cycleStart}</p>
          <h2 className="my-2 text-2xl font-extrabold">{forja.cycleTitle}</h2>
          <p className="text-sm text-mute">Área principal: {labels[forja.focus] || forja.focus}. Tempo disponível: {forja.time} minutos por dia.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-bg p-3"><b className="block text-xl">{stats.rate}%</b><small className="text-mute">Execução</small></div>
            <div className="rounded-xl bg-bg p-3"><b className="block text-xl">{stats.days}</b><small className="text-mute">Dias ativos</small></div>
            <div className="rounded-xl bg-bg p-3"><b className="block text-xl">{stats.streak}</b><small className="text-mute">Sequência</small></div>
          </div>
          <h3 className="mb-2 mt-4 font-semibold">Ações do plano</h3>
          {(forja.actions || []).map((action) => (
            <div key={action.id} className="border-t border-line py-2">
              <b>{action.title}</b>
              <p className="text-sm text-mute">{action.area} · {action.duration} · {action.frequency}</p>
            </div>
          ))}
          <Button tone="quiet" className="mt-3" onClick={() => updateData((state) => ({ ...state, forja: { ...defaultForja(), ...(state.forja || {}), onboarded: false, step: 0 } }))}>Rever objetivo e ajustar o plano</Button>
        </Panel>
        <Panel title="Como interpretar">
          <p className="border-l-4 border-gold bg-bg p-3 text-sm">A taxa de execução compara ações marcadas como concluídas com as ações previstas até hoje. Se o número estiver baixo, ajuste a carga; não crie mais metas.</p>
          <Link href="/ferramentas" className="mt-4 block"><Button className="w-full">Ver ferramentas</Button></Link>
        </Panel>
      </div>
    </div>
  );
}

export function PerformanceView() {
  const toast = useToast();
  const forja = useForja();
  const stats = cycleStats(forja);
  const windowStats = performanceWindow(forja);
  const max = Math.max(1, ...windowStats.series.map((item) => item.n), forja.actions.length);
  const [good, setGood] = useState(forja.review?.good || "");
  const [block, setBlock] = useState(forja.review?.block || "");
  const [change, setChange] = useState(forja.review?.change || "");
  const trend = windowStats.change === null ? "Sem base anterior" : `${windowStats.change > 0 ? "+" : ""}${windowStats.change}% vs. semana anterior`;

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Desempenho</h1>
      <p className="text-mute">Um retrato objetivo da sua execução. Os gráficos usam somente o que você registrou.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel><small className="text-mute">Últimos 7 dias</small><b className="block text-3xl">{windowStats.wNow}</b><small className="text-mute">ações concluídas</small></Panel>
        <Panel><small className="text-mute">Consistência</small><b className="block text-3xl">{stats.rate}%</b><small className="text-mute">ações previstas</small></Panel>
        <Panel><small className="text-mute">Sequência atual</small><b className="block text-3xl">{stats.streak}</b><small className="text-mute">dias ativos</small></Panel>
        <Panel><small className="text-mute">Média diária</small><b className="block text-3xl">{windowStats.avg}</b><small className="text-mute">ações por dia</small></Panel>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Ritmo de execução">
          <div className="flex h-48 items-end gap-1">
            {windowStats.series.map((item) => (
              <div key={item.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${formatDay(item.day)}: ${item.n}`}>
                <span className="text-[10px] text-mute">{item.n || ""}</span>
                <i className="block w-full max-w-4 rounded-t bg-gradient-to-b from-ember to-[#b85b17]" style={{ height: `${item.n ? Math.max(8, Math.round((item.n / max) * 100)) : 4}%`, opacity: item.n ? 1 : 0.2 }} />
                <small className="text-[9px] capitalize text-mute">{new Date(`${item.day}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</small>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Comparativo semanal">
          <p className="text-sm text-mute">Semana anterior: {windowStats.wPrev} · Últimos 7 dias: {windowStats.wNow}</p>
          <p className="mt-3 border-l-4 border-gold bg-bg p-3 text-sm"><b>{trend}</b></p>
        </Panel>
      </div>
      <Panel title="Revisão semanal" className="mt-4">
        <label className="block text-sm font-bold" htmlFor="f_good">O que funcionou?</label>
        <textarea id="f_good" rows={3} value={good} onChange={(e) => setGood(e.target.value)} className="mb-3 mt-1 w-full rounded-lg border border-[#39414a] bg-[#101419] p-3" />
        <label className="block text-sm font-bold" htmlFor="f_block">O que atrapalhou?</label>
        <textarea id="f_block" rows={3} value={block} onChange={(e) => setBlock(e.target.value)} className="mb-3 mt-1 w-full rounded-lg border border-[#39414a] bg-[#101419] p-3" />
        <label className="block text-sm font-bold" htmlFor="f_change">O que vai mudar na próxima semana?</label>
        <textarea id="f_change" rows={3} value={change} onChange={(e) => setChange(e.target.value)} className="mb-3 mt-1 w-full rounded-lg border border-[#39414a] bg-[#101419] p-3" />
        <Button onClick={() => {
          updateData((state) => {
            const current = { ...defaultForja(), ...(state.forja || {}) };
            return { ...state, forja: { ...current, review: { good, block, change }, reviewAt: today() } };
          });
          toast("Revisão salva. Use a mudança escolhida na próxima semana.", true);
        }}>Salvar revisão</Button>
        {forja.reviewAt ? <p className="mt-3 text-sm text-mute">Última revisão: {forja.reviewAt}</p> : null}
      </Panel>
    </div>
  );
}

export function AdvisorView() {
  const forja = useForja();
  const stats = cycleStats(forja);
  const total = forja.actions.length;
  const done = stats.today;
  const title = !total ? "Defina seu próximo passo." : done === total ? "Mantenha a consistência." : done === 0 ? "Saia da inércia." : "Continue executando.";
  const message = !total
    ? "Seu plano ainda não tem prioridades. Revise o diagnóstico para definir um próximo passo."
    : done === total
      ? "Você concluiu as prioridades registradas para hoje. Preserve o ritmo e não aumente a carga sem necessidade."
      : done === 0
        ? "Nenhuma prioridade foi marcada como concluída hoje. Escolha a primeira e comece."
        : `Você concluiu ${done} de ${total} prioridades hoje. Termine o que foi combinado antes de criar novas metas.`;
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Orientador Forja</h1>
      <p className="text-mute">Orientação baseada no que você registrou, sem presumir resultados.</p>
      <Panel className="mt-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold">Leitura do momento</p>
        <h2 className="my-2 text-2xl font-extrabold">{title}</h2>
        <p className="border-l-4 border-gold bg-bg p-3">{message}</p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
          <li>{done} de {total} prioridades marcadas hoje.</li>
          <li>{stats.total} ações registradas no ciclo atual.</li>
          <li>{stats.days} dias com pelo menos um registro no ciclo.</li>
          <li>{stats.rate}% de execução das ações previstas até hoje.</li>
        </ul>
        <p className="mt-3 text-sm text-mute">O Forja não presume atividades que não foram registradas e não faz diagnóstico médico, psicológico ou financeiro.</p>
      </Panel>
    </div>
  );
}

export function ProfileView({ email }: { email: string }) {
  const toast = useToast();
  const router = useRouter();
  const avatar = useAppStore((s) => s.data.av);
  const src = publicAvatarUrl(avatar);

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Seu perfil</h1>
      <p className="text-mute">Personalize sua identificação e acompanhe sua conta.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Foto e identificação">
          <div className="mb-3 flex items-center gap-4">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="Foto do perfil" className="h-24 w-24 rounded-full object-cover" />
            ) : <div className="grid h-24 w-24 place-items-center rounded-full bg-bg text-mute">Sem foto</div>}
            <label className="cursor-pointer rounded-xl border border-line px-3 py-2 text-sm font-semibold">
              Escolher foto
              <input type="file" accept="image/*" className="sr-only" onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                try {
                  toast("Processando a foto…", true);
                  await uploadAvatar(file);
                  toast("Foto pronta.", true);
                } catch (error) {
                  toast(error instanceof Error ? error.message : "Não consegui abrir essa imagem.");
                }
              }} />
            </label>
          </div>
          <p className="text-xs text-mute">A foto fica na sua conta, não mais dentro do arquivo de dados.</p>
        </Panel>
        <Panel title="Conta">
          <p className="text-sm text-mute">Conectado como</p>
          <b className="break-all">{email}</b>
          <div className="mt-4 grid gap-2">
            <Link href="/hoje"><Button tone="quiet" className="w-full">Voltar para Hoje</Button></Link>
            <Button tone="quiet" onClick={() => {
              if (confirm("Refazer a configuração inicial? Seu histórico, tarefas e registros serão preservados.")) {
                updateData((state) => ({ ...state, forja: { ...defaultForja(), ...(state.forja || {}), onboarded: false, step: 0 } }));
              }
            }}>Refazer configuração inicial</Button>
            <Button tone="danger" onClick={async () => {
              const pushed = await pushCloud(useAppStore.getState().data);
              if (!pushed.ok) {
                toast("Não consegui salvar na nuvem agora. Faça um backup antes de sair.");
                return;
              }
              const supabase = createBrowserSupabase();
              await supabase?.auth.signOut();
              localStorage.removeItem("disc1");
              useAppStore.getState().replaceData({ d: {}, g: { water: 2500, kcal: 2500, p: 150, c: 280, f: 70, pages: 10 }, hc: {}, cc: {}, off: {} });
              router.push("/login");
              router.refresh();
            }}>Sair</Button>
            <p className="text-xs text-mute">Sair apaga os dados deste aparelho depois de salvar na conta.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function ToolsView() {
  const forja = useForja();
  const active = forja.selectedTools || [];
  function toggle(key: string) {
    updateData((state) => {
      const current = { ...defaultForja(), ...(state.forja || {}) };
      const selected = current.selectedTools.includes(key) ? current.selectedTools.filter((item) => item !== key) : [...current.selectedTools, key];
      return { ...state, forja: { ...current, selectedTools: selected } };
    });
  }
  const tools = MODULES.filter((m) => m.key !== "inicio" && m.key !== "config");
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Seu espaço de ferramentas</h1>
      <p className="text-mute">Remover da área ativa não apaga nenhum registro.</p>
      <Panel title="Suas ferramentas ativas" className="mt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {tools.filter((tool) => active.includes(tool.key)).map((tool) => (
            <ToolCard key={tool.key} name={tool.name} description={tool.description} image={MODULE_IMAGES[tool.key]} href={`/ferramentas/${tool.key}`} action="Remover" onAction={() => toggle(tool.key)} />
          ))}
          {!active.length ? <p className="text-mute">Você ainda não ativou ferramentas.</p> : null}
        </div>
      </Panel>
      {MODULE_GROUPS.map((group) => (
        <Panel key={group} title={group} className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {tools.filter((tool) => tool.group === group).map((tool) => (
              <ToolCard key={tool.key} name={tool.name} description={tool.description} image={MODULE_IMAGES[tool.key]} href={`/ferramentas/${tool.key}`} action={active.includes(tool.key) ? "Remover" : "Ativar"} onAction={() => toggle(tool.key)} />
            ))}
          </div>
        </Panel>
      ))}
      <Panel title="Acompanhamento e conta" className="mt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {MODULES.filter((m) => m.key === "inicio" || m.key === "config").map((tool) => (
            <ToolCard key={tool.key} name={tool.name} description={tool.description} image={MODULE_IMAGES[tool.key]} href={`/ferramentas/${tool.key}`} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ToolCard({ name, description, image, href, action, onAction }: { name: string; description: string; image: string; href: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="h-16 w-16 rounded-xl object-cover" />
      <Link href={href} className="min-w-0 flex-1">
        <b className="block">{name}</b>
        <small className="text-mute">{description}</small>
      </Link>
      {action && onAction ? <button type="button" onClick={onAction} className="rounded-xl border border-line px-2 py-2 text-xs">{action}</button> : null}
    </div>
  );
}
