import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMealLogsToday, getEmployees, getMealTypesMap } from "@/lib/queries";
import RefeicoesLiveTable from "@/components/RefeicoesLiveTable";
import { Suspense } from "react";

// Indicador de carregamento discreto apenas para os dados e contadores, mantendo os inputs intactos
function LiveDataLoading() {
  return (
    <div className="space-y-6">
      {/* Esqueleto dos 3 blocos de contadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-sm animate-pulse border border-slate-50">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="mt-2 h-7 w-20 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      {/* Esqueleto da Tabela em Tempo Real */}
      <div className="w-full py-12 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
        <p className="text-xs font-medium text-slate-500 animate-pulse">
          A sincronizar fluxo de refeições de hoje...
        </p>
      </div>
    </div>
  );
}

interface SearchParams {
  cantina?: string;
  q?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

// 1. COMPONENTE ASSÍNCRONO: Processa a base de dados pesada de hoje em segundo plano
async function RefeicoesConteudo({
  clientId,
  cantinaFiltro,
  q,
}: {
  clientId: string;
  cantinaFiltro: string;
  q: string;
}) {
  const [todosLogsHoje, employees, mealTypes] = await Promise.all([
    getMealLogsToday(clientId),
    getEmployees(clientId),
    getMealTypesMap(clientId),
  ]);

  const employeeNames: Record<string, string> = {};
  for (const e of employees) employeeNames[e.client_entity_id] = e.nome;

  const mealTypeNames: Record<string, string> = {};
  for (const [id, mt] of mealTypes.entries()) mealTypeNames[id] = mt.nome;

  const logsValidos = todosLogsHoje.filter(
    (l) => employeeNames[l.employee_id] !== undefined
  );

  const logsFiltrados = logsValidos.filter((l) => {
    if (cantinaFiltro !== "todas" && l.cantina !== cantinaFiltro) return false;
    if (q) {
      const nome = employeeNames[l.employee_id]?.toLowerCase() ?? "";
      if (!nome.includes(q)) return false;
    }
    return true;
  });

  const totalRefeicoes = logsFiltrados.length;
  const totalValor = logsFiltrados.reduce(
    (acc, l) => acc + Number(l.valor_refeicao ?? 0),
    0
  );
  const colaboradoresUnicos = new Set(logsFiltrados.map((l) => l.employee_id)).size;

  return (
    <div className="animate-[fadeIn_0.2s_ease-out]">
      {/* Grid de Contadores Atualizados */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-50">
          <p className="text-sm font-medium text-slate-500">Total de refeições</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {totalRefeicoes.toLocaleString("pt-MZ")}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-50">
          <p className="text-sm font-medium text-slate-500">Colaboradores atendidos</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {colaboradoresUnicos.toLocaleString("pt-MZ")}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-50">
          <p className="text-sm font-medium text-slate-500">Total em valor</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {totalValor.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
          </p>
        </div>
      </div>

      {/* Componente que escuta o WebSocket / SSE para atualizações em live */}
      <RefeicoesLiveTable
        initialLogs={logsFiltrados}
        employeeNames={employeeNames}
        mealTypeNames={mealTypeNames}
        cantinaFiltro={cantinaFiltro}
        searchFiltro={q}
      />
    </div>
  );
}

// 2. COMPONENTE PRINCIPAL: Carrega a página instantaneamente a 0ms
export default async function RefeicoesPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const resolvedParams = await searchParams;
  const cantinaFiltro = resolvedParams.cantina || "todas";
  const q = (resolvedParams.q || "").trim().toLowerCase();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">
        Refeições processadas em tempo real
      </h1>

      {/* O Formulário de pesquisa fica fixo no topo e nunca desaparece ao filtrar */}
      <form
        action="/refeicoes"
        method="get"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Cantina
          </label>
          <select
            name="cantina"
            defaultValue={cantinaFiltro}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
          >
            <option value="todas">Todas</option>
            {/* Opções pré-definidas para evitar bloqueio assíncrono no formulário */}
            <option value="Cantina Principal">Cantina Principal</option>
            <option value="Cantina Secção 4">Cantina Secção 4</option>
            <option value="Cantina Alojamento">Cantina Alojamento</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Colaborador
          </label>
          <input
            type="text"
            name="q"
            defaultValue={resolvedParams.q ?? ""}
            placeholder="Pesquisar por nome..."
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-greenDark transition-colors"
        >
          🔍 Filtrar
        </button>
      </form>

      {/* A Key obriga o React a isolar o loading apenas nesta secção inferior */}
      <Suspense 
        key={`${cantinaFiltro}-${q}`} 
        fallback={<LiveDataLoading />}
      >
        <RefeicoesConteudo
          clientId={session.clientId}
          cantinaFiltro={cantinaFiltro}
          q={q}
        />
      </Suspense>
    </div>
  );
}