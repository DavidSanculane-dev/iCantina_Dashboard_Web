import { Metadata } from "next";
import "@/app/globals.css"; 

export const metadata: Metadata = {
  title: "iCantina Web",
  description: "Painel de Gestão iCantina",
  icons: {
    icon: "/ico-icantina.ico", // Caminho correto partindo da pasta /public
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="text-slate-800">{children}</body>
    </html>
  );
}
