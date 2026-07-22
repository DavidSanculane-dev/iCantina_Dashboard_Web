import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  getMealLogsForReport,
  getEmployees,
  getMealTypesMap,
  getEmpresas,
} from "@/lib/queries";
import DateRangeFilter from "@/components/DateRangeFilter";
import ExportCsvButton, { type ReportRow } from "@/components/ExportCsvButton";
import ExportExcelButton from "@/components/ExportExcelButton";
import { Suspense } from "react";

function TabelaLoading() {
  return (
    <div className="w-full py-12 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl shadow-sm border border-slate-100 mt-6">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
      <p className="text-xs font-medium text-slate-500 animate-pulse">
        A processar relatórios e cruzar dados...
      </p>
    </div>
  );
}

interface SearchParams {
  dateStart?: string;
  dateEnd?: string;
  cantina?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

// 1. COMPONENTE ASSÍNCRONO: Só é chamado se o utilizador clicar em Consultar
async function RelatoriosConteudo({ 
  clientId, 
  dateStart, 
  dateEnd, 
  cantinaFiltro 
}: { 
  clientId: string; 
  dateStart: string; 
  dateEnd: string; 
  cantinaFiltro: string; 
 }) {
  const [todosLogs, employees, mealTypes, empresas] = await Promise.all([
    getMealLogsForReport(clientId, dateStart, `${dateEnd}T23:59:59`),
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
  for (const emp of empresas) empresaNomes[emp.client_entity_id] = emp.nome;

  const logsValidos = todosLogs.filter((l) => employeeNames[l.employee_id] !== undefined);

  const logsFiltrados = logsValidos.filter(
    (l) => cantinaFiltro === "todas" || l.cantina === cantinaFiltro
  );

  const rows: ReportRow[] = logsFiltrados.map((l) => ({
    codigo: employeeCodigos[l.employee_id] ?? "-",
    colaborador: employeeNames[l.employee_id],
    empresa: empresaNomes[employeeEmpresaId[l.employee_id]] ?? "-",
    tipo: mealTypes.get(String(l.meal_type_id))?.nome ?? String(l.meal_type_id),
    cantina: l.cantina,
    valor: Number(l.valor_refeicao ?? 0),
    data: new Date(l.consumed_at).toLocaleString("pt-MZ"),
  }));

  const total = rows.reduce((acc, r) => acc + r.valor, 0);

  return (
    <div className="mt-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Botões de exportação (só aparecem quando há dados carregados) */}
      <div className="absolute top-6 right-6 flex gap-2 z-10">
        <ExportCsvButton rows={rows} />
        <ExportExcelButton rows={rows} />
      </div>

      <div className="mb-4 rounded-xl bg-white px-5 py-3 shadow-sm">
        <span className="text-sm text-slate-500">
          {rows.length} refeições no período &middot;{" "}
        </span>
        <span className="font-semibold text-slate-800">
          {total.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-5 py-3">No Interno</th>
              <th className="px-5 py-3">Nome do colaborador</th>
              <th className="px-5 py-3">Empresa</th>
              <th className="px-5 py-3">Tipo de refeição</th>
              <th className="px-5 py-3">Cantina</th>
              <th className="px-5 py-3">Valor</th>
              <th className="px-5 py-3">Data / hora</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-700">{r.codigo}</td>
                <td className="px-5 py-3 text-slate-900">{r.colaborador}</td>
                <td className="px-5 py-3 text-slate-600">{r.empresa}</td>
                <td className="px-5 py-3 text-slate-600">{r.tipo}</td>
                <td className="px-5 py-3 text-slate-600">{r.cantina}</td>
                <td className="px-5 py-3 font-semibold text-slate-700">
                  {r.valor.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
                </td>
                <td className="px-5 py-3 text-slate-500">{r.data}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                  Nenhum registo encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 2. COMPONENTE PRINCIPAL: Carrega instantaneamente sem tocar na base de dados
export default async function RelatoriosPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const resolvedParams = await searchParams;

  // IMPORTANTE: Detetamos se o utilizador já clicou em pesquisar através da presença das datas na URL
  const possuiFiltroAtivo = Boolean(resolvedParams.dateStart && resolvedParams.dateEnd);

  // Valores padrão para os inputs (mas não disparamos a busca automática se possuiFiltroAtivo for falso)
  const hoje = new Date();
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(hoje.getDate() - 30);
  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  const dateStart = resolvedParams.dateStart || toISO(trintaDiasAtras);
  const dateEnd = resolvedParams.dateEnd || toISO(hoje);
  const cantinaFiltro = resolvedParams.cantina || "todas";

  return (
    <div className="relative min-h-[500px]">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
      </div>

      {/* Caixa de filtros estática e instantânea */}
      <DateRangeFilter
        action="/relatorios"
        dateStart={dateStart}
        dateEnd={dateEnd}
        extra={
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
              {/* Opções estáticas para evitar uma query extra na abertura rápida */}
              <option value="Cantina Principal">Cantina Principal</option>
              <option value="Cantina Secção 4">Cantina Secção 4</option>
              <option value="Cantina Alojamento">Cantina Alojamento</option>
            </select>
          </div>
        }
      />

      {/* Condicional Inteligente: Se não filtrou, pede para filtrar. Se filtrou, busca e exibe */}
      {!possuiFiltroAtivo ? (
        <div className="mt-8 flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-base font-semibold text-slate-800">Consulta de Relatórios Históricos</h3>
          <p className="text-sm text-slate-400 max-w-sm mt-1">
            Selecione o intervalo de datas e a cantina desejada acima e clique em <span className="font-semibold text-slate-600">Consultar</span> para processar as informações.
          </p>
        </div>
      ) : (
        <Suspense 
          key={`${dateStart}-${dateEnd}-${cantinaFiltro}`} 
          fallback={<TabelaLoading />}
        >
          <RelatoriosConteudo
            clientId={session.clientId}
            dateStart={dateStart}
            dateEnd={dateEnd}
            cantinaFiltro={cantinaFiltro}
          />
        </Suspense>
      )}
    </div>
  );
}