import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forja",
  description: "Desenvolvimento pessoal com ciclos de 30 dias, prioridades diárias e acompanhamento da evolução.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
