"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/refeicoes", label: "Refeicoes ao vivo", icon: "⏱️" },
  { href: "/colaboradores", label: "Colaboradores", icon: "🧑‍🤝‍🧑" },
  { href: "/relatorios", label: "Relatorios", icon: "📊" },
];

export default function Sidebar({
  username,
  role,
}: {
  username: string;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col justify-between bg-brand-green text-white">
      <div>
        <div className="flex items-center gap-2 px-6 py-6 text-xl font-bold">
          <span>🍽️</span> iCantina
        </div>
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {links.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/85 hover:bg-white/10"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/20 px-6 py-5 text-sm">
        <p className="text-white/70">Bem vindo</p>
        <p className="font-semibold">{username}</p>
        <p className="text-xs uppercase text-white/70">Acesso: {role}</p>
        <form action="/api/logout" method="post" className="mt-3">
          <button className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25">
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
