"use client";

import Link from "next/link";
import { isVisible } from "@/domain/records";
import { moduleByKey } from "@/domain/catalog";
import { setModuleOff } from "@/store/actions";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui";
import { BudgetModule, DietModule, FinanceModule, InvestModule, TrainingModule, WaterModule } from "@/components/modules/HealthMoney";
import { HabitsModule, MissionsModule, PeaceModule, ReadingModule, SkillModule, TodoModule } from "@/components/modules/LifeModules";
import { ProgressModule, SettingsModule } from "@/components/modules/AccountModules";

export function ModuleScreen({ module, email }: { module: string; email: string }) {
  const meta = moduleByKey(module);
  const data = useAppStore((s) => s.data);
  if (!meta) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Ferramenta não encontrada</h1>
        <Link href="/ferramentas" className="mt-3 inline-block text-gold">Voltar às ferramentas</Link>
      </div>
    );
  }
  const off = meta.key !== "config" && meta.key !== "inicio" && !isVisible(data, meta.key);
  return (
    <div>
      <Link href="/ferramentas" className="text-sm text-mute">← Voltar às ferramentas</Link>
      <h1 className="mt-2 text-3xl font-extrabold">{meta.name}</h1>
      <p className="mb-4 text-mute">{meta.description}</p>
      {off ? (
        <div className="rounded-2xl border border-line p-4">
          <p>Este módulo está desligado. Os registros continuam salvos.</p>
          <Button className="mt-3" onClick={() => setModuleOff(meta.key, false)}>Religar</Button>
        </div>
      ) : (
        <ModuleBody module={meta.key} email={email} />
      )}
    </div>
  );
}

function ModuleBody({ module, email }: { module: string; email: string }) {
  if (module === "todo") return <TodoModule />;
  if (module === "habitos") return <HabitsModule />;
  if (module === "metas") return <MissionsModule />;
  if (module === "treino") return <TrainingModule />;
  if (module === "agua") return <WaterModule />;
  if (module === "dieta") return <DietModule />;
  if (module === "leitura") return <ReadingModule />;
  if (module === "skill") return <SkillModule />;
  if (module === "paz") return <PeaceModule />;
  if (module === "fin") return <FinanceModule />;
  if (module === "plano") return <BudgetModule />;
  if (module === "inv") return <InvestModule />;
  if (module === "inicio") return <ProgressModule />;
  if (module === "config") return <SettingsModule email={email} />;
  return null;
}
