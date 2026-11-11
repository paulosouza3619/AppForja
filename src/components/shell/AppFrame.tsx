"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { normalizeAppData } from "@/domain/types";
import { pushCloud, syncCloud } from "@/lib/sync";
import { useAppStore } from "@/store/app-store";
import { Button, Panel, ToastProvider } from "@/components/ui";

const NAV = [
  ["/hoje", "Hoje"],
  ["/evolucao", "Minha evolução"],
  ["/ferramentas", "Ferramentas"],
  ["/desempenho", "Desempenho"],
  ["/orientador", "Orientador"],
  ["/perfil", "Perfil"],
];

function SyncBridge({ ready }: { ready: boolean }) {
  useEffect(() => {
    if (!ready) return;
    let timer = 0;
    const unsub = useAppStore.subscribe((state, prev) => {
      if (state.data === prev.data || state.conflict) return;
      state.setSync("pend");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void pushCloud(useAppStore.getState().data), 2500);
    });
    void syncCloud();
    const onVisible = () => {
      if (document.visibilityState === "visible" && !useAppStore.getState().conflict) void syncCloud("start");
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsub();
      document.removeEventListener("visibilitychange", onVisible);
      window.clearTimeout(timer);
    };
  }, [ready]);
  return null;
}

export function AppFrame({ email, overdue, children }: { email: string; overdue: boolean; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const onboarded = useAppStore((s) => Boolean(s.data.forja?.onboarded));
  const conflict = useAppStore((s) => s.conflict);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const syncError = useAppStore((s) => s.syncError);

  useEffect(() => {
    const finish = () => setReady(true);
    const unsub = useAppStore.persist.onFinishHydration(finish);
    if (useAppStore.persist.hasHydrated()) finish();
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!ready || conflict) return;
    if (!onboarded && pathname !== "/onboarding") router.replace("/onboarding");
    if (onboarded && pathname === "/onboarding") router.replace("/hoje");
  }, [ready, onboarded, pathname, router, conflict]);

  const status = syncStatus === "sync" || syncStatus === "pend" ? "Sincronizando…" : syncStatus === "ok" ? "Sincronizado" : syncStatus === "err" ? syncError || "Erro ao sincronizar" : "";

  return (
    <ToastProvider>
      <SyncBridge ready={ready} />
      <div className="mx-auto min-h-screen max-w-[1240px] px-4 py-6 pb-16">
        {overdue ? (
          <p className="mb-4 rounded-xl border border-gold px-4 py-3 text-sm text-gold" role="status">
            Sua assinatura está em atraso. Regularize na Hotmart para não perder o acesso. Conta: {email}
          </p>
        ) : null}
        {!ready ? <p className="text-mute">Carregando seus dados…</p> : null}
        {ready && conflict ? (
          <Panel title="Dados diferentes encontrados">
            <p className="mb-4 text-sm text-mute">Este aparelho já tem dados e a sua conta também. Qual manter?</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => useAppStore.getState().replaceData(normalizeAppData(conflict))}>Usar os dados da conta (substitui os deste aparelho)</Button>
              <Button tone="quiet" onClick={() => { useAppStore.getState().setConflict(null); void pushCloud(useAppStore.getState().data); }}>
                Usar os deste aparelho (substitui os da conta)
              </Button>
            </div>
          </Panel>
        ) : null}
        {ready && !conflict && onboarded && pathname !== "/onboarding" ? (
          <nav className="mb-5 flex gap-2 overflow-x-auto rounded-2xl border border-line bg-card p-2" aria-label="Seções">
            {NAV.map(([href, label]) => {
              const active = pathname === href || (href === "/ferramentas" && pathname.startsWith("/ferramentas"));
              return (
                <Link key={href} href={href} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold ${active ? "bg-ember text-[#15181b]" : "text-mute"}`}>
                  {label}
                </Link>
              );
            })}
          </nav>
        ) : null}
        {ready && !conflict ? children : null}
        {status ? <p className="mt-6 text-center text-xs text-mute">{status}</p> : null}
        <p className="mt-4 text-center text-[11px] text-mute">FORJA · Evolução construída com consistência</p>
      </div>
    </ToastProvider>
  );
}
