"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function FiltroCantinasChips() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lista fixa das cantinas oficiais do iCantina
  const cantinasDisponiveis = ["Cantina Alojamento", "Cantina Principal", "Cantina Secção 4"];

  // Lê o parâmetro atual da URL
  const paramCantina = searchParams.get("cantina") || "todas";
  
  // Se for "todas", o array interno de seleção explícita começa vazio
  const selecionadas = paramCantina === "todas" ? [] : paramCantina.split(",");

  const alternarSelecao = (nomeCantina: string) => {
    let novasSelecionadas = [...selecionadas];

    if (novasSelecionadas.includes(nomeCantina)) {
      // Se já estava selecionada, remove da lista
      novasSelecionadas = novasSelecionadas.filter((c) => c !== nomeCantina);
    } else {
      // Se não estava selecionada, adiciona à lista
      novasSelecionadas.push(nomeCantina);
    }

    const novosParams = new URLSearchParams(searchParams.toString());
    
    // Regra de Ouro: Se desmarcar todas OU se selecionar todas ao mesmo tempo,
    // o filtro volta ao estado global de "todas" na URL para simplificar.
    if (novasSelecionadas.length === 0 || novasSelecionadas.length === cantinasDisponiveis.length) {
      novosParams.set("cantina", "todas");
    } else {
      novosParams.set("cantina", novasSelecionadas.join(","));
    }
    
    novosParams.set("page", "1"); // Faz reset para a primeira página da tabela
    router.push(`/relatorios?${novosParams.toString()}`);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label superior informativo igual ao da sua imagem */}
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        Filtro de Cantinas:{" "}
        <span className="text-blue-600 font-extrabold normal-case">
          {selecionadas.length === 0 ? "TODAS" : selecionadas.join(", ")}
        </span>
      </span>

      {/* Lista de Botões */}
      <div className="flex flex-wrap gap-2">
        {cantinasDisponiveis.map((cantina) => {
          // Uma cantina aparece "ativa (verde)" se o estado for TODAS ou se foi clicada
          const estaAtiva = selecionadas.length === 0 || selecionadas.includes(cantina);

          return (
            <button
              key={cantina}
              type="button"
              onClick={() => alternarSelecao(cantina)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm border transition-all duration-200 select-none
                ${
                  estaAtiva
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" // Ativo corporativo
                    : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 opacity-60"  // Inativo
                }`}
            >
              {/* Ícone de confirmação visual */}
              {estaAtiva && (
                <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {cantina}
            </button>
          );
        })}
      </div>
    </div>
  );
}
