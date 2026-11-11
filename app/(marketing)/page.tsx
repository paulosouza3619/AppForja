import Image from "next/image";
import Link from "next/link";

const tools = [
  ["Ciclo de 30 dias", "Um resultado concreto, com tempo que cabe na sua rotina."],
  ["Prioridades do dia", "Poucas ações. O objetivo é executar, não organizar o aplicativo."],
  ["Ferramentas de apoio", "Tarefas, hábitos, treino, alimentação, leitura e finanças no mesmo lugar."],
  ["Desempenho", "Gráficos só com o que você registrou. Sem métrica de valor pessoal."],
];

export default function LandingPage() {
  const checkout = process.env.HOTMART_CHECKOUT_URL;
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <header className="mb-10 flex items-center justify-between gap-4">
        <p className="text-lg font-black tracking-[0.16em]">
          FOR<span className="text-gold">JA</span>
        </p>
        <Link href="/login" className="rounded-xl border border-line px-4 py-2 text-sm font-semibold">
          Entrar
        </Link>
      </header>
      <section className="grid items-center gap-8 md:grid-cols-[1.2fr_.8fr]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold">Evolução com consistência</p>
          <h1 className="mt-3 max-w-xl text-4xl font-extrabold tracking-tight md:text-5xl">
            Um ciclo de cada vez. O próximo passo, hoje.
          </h1>
          <p className="mt-4 max-w-xl text-mute">
            O Forja organiza planejamento, execução e revisão em ciclos de 30 dias. A landing é pública. O aplicativo, o histórico e a sincronização exigem uma assinatura ativa.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {checkout ? (
              <a href={checkout} className="rounded-xl bg-gradient-to-br from-[#ff9138] to-[#e96613] px-5 py-3 font-bold text-[#17191c]">
                Assinar na Hotmart
              </a>
            ) : null}
            <Link href="/signup" className="rounded-xl border border-line px-5 py-3 font-semibold">
              Já assinei — criar conta
            </Link>
          </div>
        </div>
        <Image src="/forja-mark.png" alt="Marca Forja" width={640} height={360} priority className="mx-auto h-auto w-full max-w-md" />
      </section>
      <section className="mt-14 grid gap-4 sm:grid-cols-2">
        {tools.map(([title, text]) => (
          <article key={title} className="rounded-2xl border border-line bg-card p-5 shadow-card">
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm text-mute">{text}</p>
          </article>
        ))}
      </section>
      <section className="mt-10 rounded-2xl border border-line bg-card p-6">
        <h2 className="text-2xl font-bold">Como o acesso funciona</h2>
        <ol className="mt-4 space-y-2 text-sm text-mute">
          <li>1. Sem conta, você vê só esta página.</li>
          <li>2. A compra acontece na Hotmart. O Forja não processa o pagamento.</li>
          <li>3. Depois da compra aprovada, crie a conta com o mesmo e-mail.</li>
          <li>4. Com a assinatura ativa, o ciclo, as ferramentas e o histórico ficam liberados.</li>
        </ol>
      </section>
    </main>
  );
}
