"use client";

import { useState } from "react";
import { parseBackup, toBackup } from "@/domain/backup";
import { TOGGLEABLE_MODULES } from "@/domain/catalog";
import { today } from "@/domain/dates";
import { disciplineReport, radarScores } from "@/domain/reports";
import { isVisible } from "@/domain/records";
import { levelFromXp, streakDays, totalXp } from "@/domain/xp";
import { applyPreset, setModuleOff, updateData } from "@/store/actions";
import { useAppStore } from "@/store/app-store";
import { Bar, Button, Panel, Radar, useToast } from "@/components/ui";
import { ObjectivesModule } from "@/components/modules/LifeModules";

export function ProgressModule() {
  const data = useAppStore((s) => s.data);
  const xp = totalXp(data);
  const level = levelFromXp(xp);
  const streak = streakDays(data);
  const report = disciplineReport(data);
  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex items-end justify-between">
          <div><small className="text-mute">{level.title}</small><p className="text-3xl font-extrabold">Nível {level.lv}</p></div>
          <div className="text-right"><p className="text-3xl font-extrabold text-gold">{streak}</p><small className="text-mute">dia(s) de ofensiva</small></div>
        </div>
        <Bar value={level.pct * 100} />
        <p className="text-sm text-mute">{xp} XP · faltam {level.remain} para o nível {level.lv + 1}</p>
        <Radar scores={radarScores(data)} />
        <details className="mt-2 text-xs text-mute">
          <summary>Como ganhar XP</summary>
          <p>Treino +30 · Paz +15 · Tarefa concluída +10 · Hábito bom +15 · Meta de água no dia +20 · Calorias na meta no dia +25 · Leitura +1 a cada 2 págs · Prática +1 a cada 2 min · Lançamento financeiro +3 · Missão concluída +20 a +320 · Missão fracassada −metade · Dia sem cair em hábito ruim +5 · Queda em hábito ruim −20 · Item do checklist +5 · Chefão derrotado +200 a +1000 · Objetivo conquistado +100, +250 ou +500.</p>
        </details>
      </Panel>
      <Panel>
        <p className="text-center text-sm text-mute">Índice de disciplina · últimos 7 dias</p>
        <p className="text-center text-5xl font-extrabold text-gold">{report.good.length + report.bad.length ? `${report.score}%` : "—"}</p>
        <Bar value={report.score} />
      </Panel>
      <Panel title="O que está indo bem">
        {report.good.length ? report.good.map((item) => <p key={item}>• {item}</p>) : <p className="text-sm text-mute">Ainda nada. Comece hoje.</p>}
      </Panel>
      <Panel title="O que precisa melhorar">
        {report.bad.length ? report.bad.map((item) => <p key={item}>• {item}</p>) : <p className="text-sm text-mute">Tudo em dia. Mantenha o ritmo.</p>}
      </Panel>
      <ObjectivesModule />
    </div>
  );
}

export function SettingsModule({ email }: { email: string }) {
  const toast = useToast();
  const data = useAppStore((s) => s.data);
  const [raw, setRaw] = useState("");
  const [pending, setPending] = useState<ReturnType<typeof parseBackup> | null>(null);
  const count = Object.values(data.d).reduce((sum, rows) => sum + rows.length, 0);

  async function copy() {
    const json = JSON.stringify(toBackup(useAppStore.getState().data));
    updateData((state) => ({ ...state, lb: today() }));
    try {
      await navigator.clipboard.writeText(json);
      toast("Backup copiado. Cole em um lugar seguro.", true);
    } catch {
      setRaw(json);
      toast("Não consegui copiar sozinho. Selecione o texto abaixo e copie.");
    }
  }

  function download() {
    const json = JSON.stringify(toBackup(useAppStore.getState().data));
    updateData((state) => ({ ...state, lb: today() }));
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    link.download = `backup-forja-${today()}.json`;
    link.click();
    toast("Arquivo de backup gerado.", true);
  }

  function read(text: string) {
    try {
      setPending(parseBackup(text));
    } catch {
      toast("Backup inválido. Confira se copiou o texto inteiro.");
    }
  }

  return (
    <div className="space-y-4">
      <Panel title="Conta">
        <p className="text-sm text-mute">Conectado como</p>
        <b className="break-all">{email || "conta autenticada"}</b>
      </Panel>
      <Panel title="Módulos">
        <p className="mb-2 text-sm text-mute">Desligue o que você não usa. Seus dados continuam salvos e voltam quando religar.</p>
        <div className="mb-3 flex gap-2">
          <Button onClick={() => applyPreset(true)}>Modo essencial</Button>
          <Button tone="quiet" onClick={() => applyPreset(false)}>Mostrar tudo</Button>
        </div>
        {TOGGLEABLE_MODULES.map(([key, name, hint]) => (
          <label key={key} className="flex items-center justify-between gap-3 border-t border-line py-2">
            <span>{name}{hint ? <small className="block text-mute">{hint}</small> : null}</span>
            <input type="checkbox" checked={isVisible(data, key)} onChange={(event) => setModuleOff(key, !event.target.checked)} />
          </label>
        ))}
      </Panel>
      {pending ? (
        <Panel title="Restaurar este backup?">
          <p className="text-sm text-mute">{Object.values(pending.d).reduce((sum, rows) => sum + rows.length, 0)} registros. Isso substitui os dados atuais deste aparelho.</p>
          <div className="mt-3 flex gap-2">
            <Button tone="danger" onClick={() => { useAppStore.getState().replaceData(pending); setPending(null); toast("Backup restaurado!", true); }}>Sim, restaurar</Button>
            <Button tone="quiet" onClick={() => setPending(null)}>Cancelar</Button>
          </div>
        </Panel>
      ) : null}
      <Panel title="Backup dos dados">
        <p className="text-sm text-mute">{data.lb ? `Último backup: ${data.lb.split("-").reverse().join("/")}` : "Nenhum backup feito ainda"} · {count} registros</p>
        <div className="mt-3 flex gap-2">
          <Button onClick={download}>Salvar arquivo</Button>
          <Button tone="quiet" onClick={() => void copy()}>Copiar código</Button>
        </div>
      </Panel>
      <Panel title="Restaurar backup">
        <input type="file" accept=".json,application/json" aria-label="Arquivo de backup" onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => read(String(reader.result || ""));
          reader.readAsText(file);
        }} />
        <textarea rows={4} className="mt-2 w-full rounded-lg border border-[#39414a] bg-[#101419] p-3" placeholder="Ou cole aqui o código do backup" aria-label="Código do backup" value={raw} onChange={(e) => setRaw(e.target.value)} />
        <Button onClick={() => read(raw)}>Restaurar do texto</Button>
      </Panel>
    </div>
  );
}
