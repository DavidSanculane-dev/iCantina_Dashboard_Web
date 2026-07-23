import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  getMealLogsForReport,
  getEmployees,
  getMealTypesMap,
  getEmpresas,
  getDistinctCantinasFromMealLog,
} from "@/lib/queries";
import DateRangeFilter from "@/components/DateRangeFilter";
import ExportCsvButton, { type ReportRow } from "@/components/ExportCsvButton";
import ExportExcelButton from "@/components/ExportExcelButton";
import { Suspense } from "react";
import Link from "next/link";

function TabelaLoading() {
  return (
    <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white py-12 shadow-sm">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
      <p className="animate-pulse text-xs font-medium text-slate-500">
        A processar relatórios e a paginar registos...
      </p>
    </div>
  );
}

async function CantinaSelect({
  clientId,
  cantinaFiltro,
}: {
  clientId: string;
  cantinaFiltro: string;
}) {
  const cantinasDisponiveis = await getDistinctCantinasFromMealLog(clientId);
  return (
    <select
      name="cantina"
      defaultValue={cantinaFiltro}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
    >
      <option value="todas">Todas</option>
      {cantinasDisponiveis.map((nome) => (
        <option key={nome} value={nome}>
          {nome}
        </option>
      ))}
    </select>
  );
}

function CantinaSelectLoading() {
  return (
    <select disabled className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
      <option>Carregando...</option>
    </select>
  );
}

interface SearchParams {
  dateStart?: string;
  dateEnd?: string;
  cantina?: string;
  page?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function RelatoriosConteudo({
  clientId,
  dateStart,
  dateEnd,
  cantinaFiltro,
  paginaAtiva,
}: {
  clientId: string;
  dateStart: string;
  dateEnd: string;
  cantinaFiltro: string;
  paginaAtiva: number;
}) {
  const [todosLogs, employees, mealTypes, empresas] = await Promise.all([
    getMealLogsForReport(clientId, dateStart, dateEnd, cantinaFiltro),
    getEmployees(clientId),
    getMealTypesMap(clientId),
    getEmpresas(clientId),
  ]);

  const employeeNames: Record<string, string> = {};
  const employeeCodigos: Record<string, string> = {};
  const employeeEmpresaId: Record<string, string> = {};
  for (const e of employees) {
    employeeNames[e.client_entity_id] = e.nome;
    employeeCodigos[e.client_entity_id] = e.codigo ?? "-";
    employeeEmpresaId[e.client_entity_id] = e.empresa_client_id ?? "";
  }

  const empresaNomes: Record<string, string> = {};
  for (const emp of empresas) {
    empresaNomes[emp.client_entity_id] = emp.nome;
  }

  const logsValidos = todosLogs.filter((l) => employeeNames[l.employee_id] !== undefined);

  const rows: ReportRow[] = logsValidos.map((l) => {
    const dataHora = new Date(l.consumed_at);
    return {
      codigo: employeeCodigos[l.employee_id] ?? "-",
      colaborador: employeeNames[l.employee_id],
      empresa: empresaNomes[employeeEmpresaId[l.employee_id]] ?? "-",
      tipo: mealTypes.get(String(l.meal_type_id))?.nome ?? String(l.meal_type_id),
      cantina: l.cantina,
      data: dataHora.toLocaleDateString("pt-MZ"),
      hora: dataHora.toLocaleTimeString("pt-MZ"),
    };
  });

  const totalRegistos = rows.length;
  const ITENS_POR_PAGINA = 50;
  const totalPaginas = Math.ceil(totalRegistos / ITENS_POR_PAGINA) || 1;
  const paginaCorrente = Math.min(Math.max(paginaAtiva, 1), totalPaginas);

  const indiceInicial = (paginaCorrente - 1) * ITENS_POR_PAGINA;
  const indiceFinal = indiceInicial + ITENS_POR_PAGINA;
  const linhasPaginadas = rows.slice(indiceInicial, indiceFinal);

  const mostrandoDe = totalRegistos > 0 ? indiceInicial + 1 : 0;
  const mostrandoA = Math.min(indiceFinal, totalRegistos);

  const buildPageUrl = (novaPagina: number) => {
    return `/relatorios?dateStart=${dateStart}&dateEnd=${dateEnd}&cantina=${cantinaFiltro}&page=${novaPagina}`;
  };
  return (
    <div className="relative mt-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="absolute right-0 -top-1 z-10 flex gap-2">
        <ExportCsvButton rows={rows} />
        <ExportExcelButton rows={rows} />
      </div>

      <div className="mb-4 rounded-xl bg-white px-5 py-3 shadow-sm border border-slate-50 inline-block">
        <span className="text-sm text-slate-500 font-medium">
          Total: <span className="text-slate-800 font-bold">{totalRegistos}</span> refeições consumidas no período
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-5 py-3">No Interno</th>
              <th className="px-5 py-3">Nome do colaborador</th>
              <th className="px-5 py-3">Empresa</th>
              <th className="px-5 py-3">Tipo de refeição</th>
              <th className="px-5 py-3">Cantina</th>
              <th className="px-5 py-3">Data</th>
              <th className="px-5 py-3">Hora</th>
            </tr>
          </thead>
          <tbody>
            {linhasPaginadas.map((r, i) => (
              <tr key={i} className="border-t border-slate-100 transition-colors hover:bg-slate-50/50">
                <td className="px-5 py-3 font-medium text-slate-700">{r.codigo}</td>
                <td className="px-5 py-3 text-slate-900 font-semibold">{r.colaborador}</td>
                <td className="px-5 py-3 text-slate-600">{r.empresa}</td>
                <td className="px-5 py-3 text-slate-600">{r.tipo}</td>
                <td className="px-5 py-3 text-slate-600">{r.cantina}</td>
                <td className="px-5 py-3 text-slate-500">{r.data}</td>
                <td className="px-5 py-3 text-slate-500">{r.hora}</td>
              </tr>
            ))}
            {linhasPaginadas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                  Nenhum registo encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/60 px-5 py-3.5 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div>
            Total de linhas encontradas no relatório: <span className="text-slate-700 font-bold">{totalRegistos}</span> (A mostrar de {mostrandoDe} a {mostrandoA})
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
    </div>
  );
}

export default async function RelatoriosPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const resolvedParams = await searchParams;
  const possuiFiltroAtivo = Boolean(resolvedParams.dateStart && resolvedParams.dateEnd);

  const hoje = new Date();
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(hoje.getDate() - 30);
  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  const dateStart = resolvedParams.dateStart || toISO(trintaDiasAtras);
  const dateEnd = resolvedParams.dateEnd || toISO(hoje);
  const cantinaFiltro = resolvedParams.cantina || "todas";
  const paginaAtiva = Number(resolvedParams.page) || 1;

  return (
    <div className="relative min-h-[500px]">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
      </div>

      <DateRangeFilter
        action="/relatorios"
        dateStart={dateStart}
        dateEnd={dateEnd}
        extra={
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Cantina
            </label>
            <Suspense fallback={<CantinaSelectLoading />}>
              <CantinaSelect clientId={session.clientId} cantinaFiltro={cantinaFiltro} />
            </Suspense>
          </div>
        }
      />

      {!possuiFiltroAtivo ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mb-3 text-4xl">📅</div>
          <h3 className="text-base font-semibold text-slate-800">
            Consulta de Relatórios Históricos
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Selecione o intervalo de datas e a cantina desejada acima e clique em{" "}
            <span className="font-semibold text-slate-600">Consultar</span> para processar as informações de consumo.
          </p>
        </div>
      ) : (
        <Suspense 
          key={`${dateStart}-${dateEnd}-${cantinaFiltro}-${paginaAtiva}`} 
          fallback={<TabelaLoading />}
        >
          <RelatoriosConteudo
            clientId={session.clientId}
            dateStart={dateStart}
            dateEnd={dateEnd}
            cantinaFiltro={cantinaFiltro}
            paginaAtiva={paginaAtiva}
          />
        </Suspense>
      )}
    </div>
  );
}
