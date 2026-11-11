"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-danger p-6" role="alert">
      <h2 className="text-xl font-bold">Algo quebrou nesta tela</h2>
      <p className="mt-2 text-sm text-mute">Seus dados locais continuam no navegador. Tente de novo.</p>
      <button onClick={reset} className="mt-4 min-h-11 rounded-xl bg-ember px-4 font-bold text-on">
        Tentar de novo
      </button>
    </div>
  );
}
