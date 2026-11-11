import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BlockedPage() {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) redirect("/login");
  const checkout = process.env.HOTMART_CHECKOUT_URL;
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5">
      <p className="text-lg font-black tracking-[0.16em]">FOR<span className="text-gold">JA</span></p>
      <h1 className="mt-4 text-3xl font-extrabold">Assinatura necessária</h1>
      <p className="mt-3 text-mute">
        A conta {user.email} ainda não tem uma assinatura Hotmart ativa. O pagamento acontece na Hotmart. Quando a compra for aprovada para este e-mail, o aplicativo libera sozinho.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {checkout ? (
          <a href={checkout} className="rounded-xl bg-gradient-to-br from-[#ff9138] to-[#e96613] px-5 py-3 font-bold text-[#17191c]">
            Comprar na Hotmart
          </a>
        ) : (
          <p className="text-sm text-mute">O link de compra ainda não foi configurado.</p>
        )}
        <Link href="/login" className="rounded-xl border border-line px-5 py-3 font-semibold">
          Trocar de conta
        </Link>
      </div>
    </main>
  );
}
