"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { markLoginSync } from "@/lib/sync";

function explain(error: string): string {
  const m = error.toLowerCase();
  if (/invalid login|invalid_credentials/.test(m)) return "E-mail ou senha incorretos.";
  if (/not confirmed|email_not_confirmed/.test(m)) return "Confirme seu e-mail antes de entrar (veja a caixa de entrada e o spam).";
  if (/already registered|user_already_exists/.test(m)) return "Este e-mail já tem conta. Use Entrar.";
  if (/rate limit|over_.*rate/.test(m)) return "Muitas tentativas. Aguarde alguns minutos.";
  if (/password/.test(m) && /(short|least|weak)/.test(m)) return "Senha fraca ou curta demais (mínimo 6 caracteres).";
  if (/failed to fetch|network|load failed/.test(m)) return "Sem conexão com o servidor.";
  return error;
}

export function AuthForm({ mode }: { mode: "login" | "signup" | "recover" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const missing = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setOk(false);
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setMessage("Supabase ainda não está configurado. Preencha o arquivo .env.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "recover") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${location.origin}/auth/callback?next=/recuperar-senha`,
        });
        if (error) throw error;
        setOk(true);
        setMessage("Se este e-mail tiver conta, enviamos um link para redefinir a senha.");
        return;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        if (data.session) {
          markLoginSync();
          router.push("/hoje");
          router.refresh();
          return;
        }
        setOk(true);
        setMessage("Conta criada! Confirme seu e-mail (caixa de entrada e spam) e depois entre.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      markLoginSync();
      router.push("/hoje");
      router.refresh();
    } catch (error) {
      setMessage(explain(error instanceof Error ? error.message : "Erro ao continuar."));
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signup" ? "Criar conta" : mode === "recover" ? "Recuperar senha" : "Entrar";
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/forja-mark.png" alt="Forja" className="mx-auto mb-3 h-28 w-auto" />
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="mt-2 text-sm text-mute">Use o mesmo e-mail da compra na Hotmart.</p>
      </div>
      {missing ? <p className="mb-4 rounded-xl border border-danger p-3 text-sm text-danger">Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.</p> : null}
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-line bg-card p-5">
        <label className="block text-sm font-semibold" htmlFor="email">E-mail</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-[#39414a] bg-[#101419] px-3 py-3" />
        {mode !== "recover" ? (
          <>
            <label className="block text-sm font-semibold" htmlFor="password">Senha</label>
            <input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-[#39414a] bg-[#101419] px-3 py-3" />
          </>
        ) : null}
        <button disabled={busy} className="min-h-11 w-full rounded-xl bg-gradient-to-br from-[#ff9138] to-[#e96613] font-bold text-[#17191c] disabled:opacity-60">
          {busy ? "Aguarde…" : title}
        </button>
        {message ? <p className={ok ? "text-sm text-ok" : "text-sm text-danger"} role="status">{message}</p> : null}
      </form>
      <p className="mt-4 text-center text-sm text-mute">
        {mode === "login" ? <Link href="/signup">Criar conta</Link> : <Link href="/login">Entrar</Link>}
        {" · "}
        <Link href="/recuperar">Esqueci a senha</Link>
      </p>
    </main>
  );
}
