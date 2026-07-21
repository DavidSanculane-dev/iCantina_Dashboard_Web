import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  getMealLogsForReport,
  getEmployees,
  getMealTypesMap,
  getCantinas,
} from "@/lib/queries";
import DateRangeFilter from "@/components/DateRangeFilter";
import ExportCsvButton, { type ReportRow } from "@/components/ExportCsvButton";

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

  const [logs, employees, mealTypes, cantinas] = await Promise.all([
    getMealLogsForReport(session.clientId, dateStart, `${dateEnd}T23:59:59`, cantinaFiltro),
    getEmployees(session.clientId),
    getMealTypesMap(session.clientId),
    getCantinas(session.clientId),
  ]);

  const employeeNames: Record<string, string> = {};
  for (const e of employees) employeeNames[e.client_entity_id] = e.nome;

  const rows: ReportRow[] = logs.map((l) => ({
    colaborador: employeeNames[l.employee_id] ?? l.employee_id,
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
        <ExportCsvButton rows={rows} />
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
              {cantinas.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
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
              <th className="px-5 py-3">Colaborador</th>
              <th className="px-5 py-3">Tipo de refeicao</th>
              <th className="px-5 py-3">Cantina</th>
              <th className="px-5 py-3">Valor</th>
              <th className="px-5 py-3">Data / hora</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-5 py-3">{r.colaborador}</td>
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
                <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
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
