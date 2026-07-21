import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iCantina Web",
  description: "Relatorios e historico de refeicoes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="text-slate-800">{children}</body>
    </html>
  );
}
