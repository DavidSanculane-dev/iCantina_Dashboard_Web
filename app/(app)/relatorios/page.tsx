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

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { dateStart: toISO(start), dateEnd: toISO(end) };
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { dateStart?: string; dateEnd?: string; cantina?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const defaults = defaultRange();
  const dateStart = searchParams.dateStart || defaults.dateStart;
  const dateEnd = searchParams.dateEnd || defaults.dateEnd;
  const cantinaFiltro = searchParams.cantina || "todas";

  // Busca TODOS os registros do periodo de uma vez so (sem filtro de
  // cantina no banco). O filtro e a lista de cantinas disponiveis sao
  // resolvidos aqui em memoria, evitando duplicatas/inconsistencias.
  const [todosLogs, employees, mealTypes, empresas] = await Promise.all([
    getMealLogsForReport(session.clientId, dateStart, `${dateEnd}T23:59:59`),
    getEmployees(session.clientId),
    getMealTypesMap(session.clientId),
    getEmpresas(session.clientId),
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

  // Ignora refeicoes de colaboradores apagados (is_deleted = true)
  const logsValidos = todosLogs.filter((l) => employeeNames[l.employee_id] !== undefined);

  // Lista de cantinas derivada dos proprios dados (evita duplicatas)
  const cantinasDisponiveis = Array.from(
    new Set(logsValidos.map((l) => l.cantina).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Relatorios</h1>
        <div className="flex gap-2">
          <ExportCsvButton rows={rows} />
          <ExportExcelButton rows={rows} />
        </div>
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
            <select
              name="cantina"
              defaultValue={cantinaFiltro}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="todas">Todas</option>
              {cantinasDisponiveis.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="mb-4 rounded-xl bg-white px-5 py-3 shadow-sm">
        <span className="text-sm text-slate-500">
          {rows.length} refeicoes no periodo &middot;{" "}
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
              <th className="px-5 py-3">Tipo de refeicao</th>
              <th className="px-5 py-3">Cantina</th>
              <th className="px-5 py-3">Valor</th>
              <th className="px-5 py-3">Data / hora</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-5 py-3">{r.codigo}</td>
                <td className="px-5 py-3">{r.colaborador}</td>
                <td className="px-5 py-3">{r.empresa}</td>
                <td className="px-5 py-3">{r.tipo}</td>
                <td className="px-5 py-3">{r.cantina}</td>
                <td className="px-5 py-3">
                  {r.valor.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
                </td>
                <td className="px-5 py-3 text-slate-500">{r.data}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-slate-400">
                  Nenhum registo encontrado no periodo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}