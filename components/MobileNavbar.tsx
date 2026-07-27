"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/refeicoes", label: "Refeições em tempo real", icon: "⏱️" },
  { href: "/colaboradores", label: "Colaboradores", icon: "🧑‍🤝‍🧑" },
  { href: "/relatorios", label: "Relatórios", icon: "📊" },
];

export default function MobileNavbar({ username, role }: { username: string; role: string }) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();

  // Fecha o menu automaticamente quando o utilizador muda de página
  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  // Bloqueia o scroll do ecrã de fundo quando o menu está aberto
  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [aberto]);

  return (
    // md:hidden garante que esta barra desaparece por completo em computadores
    <div className="md:hidden w-full bg-brand-green text-white border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-2 text-lg font-bold">
        <span>🍽️</span> iCantina
      </div>

      {/* Botão Hambúrguer */}
      <button
        onClick={() => setAberto(true)}
        type="button"
        className="rounded-xl bg-white/10 p-2 hover:bg-white/20 active:scale-95 transition-all outline-none"
        aria-label="Abrir menu"
      >
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* MENU FLUTUANTE (OVERLAY E GAVETA) */}
      {aberto && (
        <div className="fixed inset-0 z-50 flex animate-[fadeIn_0.2s_ease-out]">
          {/* Fundo escurecido atrás do menu para dar foco */}
          <div 
            onClick={() => setAberto(false)} 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Painel Lateral Móvel (Desliza da esquerda) */}
          <aside className="relative flex w-72 max-w-[80vw] h-full flex-col justify-between bg-brand-green text-white p-5 shadow-2xl animate-[slideInLeft_0.25s_ease-out]">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2 text-lg font-bold">
                  <span>🍽️</span> iCantina
                </div>
                {/* Botão para fechar o menu */}
                <button 
                  onClick={() => setAberto(false)}
                  className="rounded-xl bg-white/10 p-2 hover:bg-white/20 outline-none"
                >
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Links de Navegação */}
              <nav className="flex flex-col gap-1">
                {links.map((link) => {
                  const active = pathname?.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        active ? "bg-white/15 text-white shadow-xs" : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-base">{link.icon}</span>
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Secção do Perfil e Botão Sair */}
            <div className="border-t border-white/20 pt-4 text-sm">
              <p className="text-white/60 text-xs">Bem vindo</p>
              <p className="font-bold text-slate-100 truncate">{username}</p>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200 mt-0.5">Acesso: {role}</p>
              <form action="/api/logout" method="post" className="mt-4">
                <button className="w-full text-center rounded-xl bg-white/15 py-2.5 text-xs font-semibold hover:bg-white/25 active:scale-98 transition-all">
                  Sair da Conta
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
