import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getEmployees, getDepartamentos, getEmpresas } from "@/lib/queries";
import { Suspense } from "react";

function TabelaLoading() {
  return (
    <div className="w-full py-12 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
      <p className="text-xs font-medium text-slate-500 animate-pulse">
        A filtrar listagem de colaboradores...
      </p>
    </div>
  );
}

interface SearchParams {
  q?: string;
  page?: string; // Captura a página ativa via URL
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function ColaboradoresConteudo({ 
  clientId, 
  q,
  paginaAtiva
}: { 
  clientId: string; 
  q: string;
  paginaAtiva: number;
}) {
  const [employees, departamentos, empresas] = await Promise.all([
    getEmployees(clientId, q),
    getDepartamentos(clientId),
    getEmpresas(clientId),
  ]);

  const departamentoNomes: Record<string, string> = {};
  for (const d of departamentos) {
    departamentoNomes[d.client_entity_id] = d.nome;
  }

  const empresaNomes: Record<string, string> = {};
  for (const emp of empresas) {
    empresaNomes[emp.client_entity_id] = emp.nome;
  }

  // --- ALGORITMO DE PAGINAÇÃO QUANTITATIVA (IGUAL AO RELATÓRIO) ---
  const totalRegistos = employees.length;
  const ITENS_POR_PAGINA = 50;
  const totalPaginas = Math.ceil(totalRegistos / ITENS_POR_PAGINA) || 1;
  const paginaCorrente = Math.min(Math.max(paginaAtiva, 1), totalPaginas);

  const indiceInicial = (paginaCorrente - 1) * ITENS_POR_PAGINA;
  const indiceFinal = indiceInicial + ITENS_POR_PAGINA;
  const colaboradoresPaginados = employees.slice(indiceInicial, indiceFinal);

  const mostrandoDe = totalRegistos > 0 ? indiceInicial + 1 : 0;
  const mostrandoA = Math.min(indiceFinal, totalRegistos);

  const buildPageUrl = (novaPagina: number) => {
    return `/colaboradores?q=${encodeURIComponent(q)}&page=${novaPagina}`;
  };
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 animate-[fadeIn_0.2s_ease-out]">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-400">
          <tr>
            <th className="px-5 py-3">Nº Interno</th>
            <th className="px-5 py-3">Nome do Colaborador</th>
            <th className="px-5 py-3">Departamento</th>
            <th className="px-5 py-3">Empresa</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {colaboradoresPaginados.map((e) => (
            <tr key={e.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/50">
              <td className="px-5 py-3 font-medium text-slate-600">{e.codigo ?? "-"}</td>
              <td className="px-5 py-3 font-semibold text-slate-800">{e.nome}</td>
              <td className="px-5 py-3 text-slate-600">
                {departamentoNomes[e.departamento_client_id ?? ""] ?? "-"}
              </td>
              <td className="px-5 py-3 text-slate-600">
                {empresaNomes[e.empresa_client_id ?? ""] ?? "-"}
              </td>
              <td className="px-5 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    e.ativo
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {e.ativo ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                <Link 
                  href={`/colaboradores/${e.client_entity_id}`}
                  className="text-sm font-semibold text-brand-greenDark hover:text-brand-green hover:underline transition-colors"
                >
                  Ver histórico →
                </Link>
              </td>
            </tr>
          ))}
          {colaboradoresPaginados.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                Nenhum colaborador encontrado para a pesquisa ativa.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* --- RODAPÉ DE PAGINAÇÃO SIMÉTRICO --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/60 px-5 py-3.5 border-t border-slate-100 text-xs text-slate-500 font-medium">
        <div>
          Total de colaboradores encontrados: <span className="text-slate-700 font-bold">{totalRegistos}</span> (A mostrar de {mostrandoDe} a {mostrandoA})
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href={buildPageUrl(paginaCorrente - 1)}
            className={`rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm transition-all hover:bg-slate-50 ${
              paginaCorrente <= 1 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            ◀
          </Link>

          <div>
            Página <span className="text-slate-800 font-bold">{paginaCorrente}</span> de <span className="text-slate-800 font-bold">{totalPaginas}</span>
          </div>

          <Link
            href={buildPageUrl(paginaCorrente + 1)}
            className={`rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm transition-all hover:bg-slate-50 ${
              paginaCorrente >= totalPaginas ? "pointer-events-none opacity-40" : ""
            }`}
          >
            ▶
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function ColaboradoresPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const resolvedParams = await searchParams;
  const q = resolvedParams.q ?? "";
  const paginaAtiva = Number(resolvedParams.page) || 1;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Colaboradores</h1>

      <form action="/colaboradores" method="get" className="mb-6 flex gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Pesquisar por nº interno ou nome..."
          className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green bg-white transition-colors"
        />
        <button type="submit" className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-greenDark transition-colors">
          Pesquisar
        </button>
      </form>

      {/* A Key monitoriza o termo e a página para atualizar o bloco da tabela localmente */}
      <Suspense key={`${q}-${paginaAtiva}`} fallback={<TabelaLoading />}>
        <ColaboradoresConteudo clientId={session.clientId} q={q} paginaAtiva={paginaAtiva} />
      </Suspense>
    </div>
  );
}
