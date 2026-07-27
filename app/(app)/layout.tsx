import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import MobileNavbar from "@/components/MobileNavbar"; // ✅ IMPORTANTE: Adicione este import

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    // ✅ ALTERAÇÃO: flex-col em mobile e md:flex-row no PC. min-h-screen garante que o fundo cinza cobre o ecrã inteiro.
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen overflow-hidden bg-brand-bg">
      
      {/* ✅ 1. MENU SUPERIOR MOBILE (Aparece apenas no telemóvel) */}
      <MobileNavbar username={session.username} role={session.role} />

      {/* 2. SIDEBAR DESKTOP (A nossa classe 'hidden md:flex' interna já a vai ocultar em mobile automaticamente) */}
      <Sidebar username={session.username} role={session.role} />
      
      {/* 3. CONTEÚDO PRINCIPAL DA PÁGINA */}
      {/* ✅ ALTERAÇÃO: Adicionado p-4 para mobile para os filtros não tocarem nas bordas e md:p-8 para o computador */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col justify-between">
        <div>
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}
