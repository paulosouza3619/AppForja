"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function NewPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const supabase = createBrowserSupabase();
    if (!supabase) return setMessage("Supabase não configurado.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setMessage("Não foi possível alterar a senha. Abra o link do e-mail de novo.");
    setMessage("Senha alterada.");
    router.push("/hoje");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <h1 className="mb-4 text-2xl font-extrabold">Nova senha</h1>
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-line bg-card p-5">
        <label className="block text-sm font-semibold" htmlFor="password">Senha</label>
        <input id="password" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-[#39414a] bg-[#101419] px-3 py-3" />
        <button className="min-h-11 w-full rounded-xl bg-gradient-to-br from-[#ff9138] to-[#e96613] font-bold text-[#17191c]">Salvar</button>
        {message ? <p role="status" className="text-sm">{message}</p> : null}
      </form>
    </main>
  );
}
