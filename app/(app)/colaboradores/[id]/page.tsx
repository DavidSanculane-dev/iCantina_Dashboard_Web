import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import {
  getEmployeeById,
  getEmployeeMealHistory,
  getMealTypesMap,
} from "@/lib/queries";
import DateRangeFilter from "@/components/DateRangeFilter";

export default async function ColaboradorDetalhePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { dateStart?: string; dateEnd?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const employee = await getEmployeeById(session.clientId, params.id);
  if (!employee) notFound();

  const dateStart = searchParams.dateStart;
  const dateEnd = searchParams.dateEnd;

  const [historico, mealTypes] = await Promise.all([
    getEmployeeMealHistory(
      session.clientId,
      params.id,
      dateStart,
      dateEnd ? `${dateEnd}T23:59:59` : undefined
    ),
    getMealTypesMap(session.clientId),
  ]);

  const totalValor = historico.reduce((acc, h) => acc + Number(h.valor_refeicao ?? 0), 0);

  return (
    <div>
      <Link href="/colaboradores" className="text-sm text-brand-greenDark hover:underline">
        ← Voltar para colaboradores
      </Link>

      <div className="mt-3 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{employee.nome}</h1>
          <p className="text-sm text-slate-500">Codigo: {employee.codigo ?? "-"}</p>
        </div>
        <div className="rounded-xl bg-white px-5 py-3 text-right shadow-sm">
          <p className="text-xs text-slate-400">Total no periodo</p>
          <p className="text-xl font-bold text-slate-800">
            {totalValor.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
          </p>
        </div>
      </div>

      <DateRangeFilter
        action={`/colaboradores/${params.id}`}
        dateStart={dateStart ?? ""}
        dateEnd={dateEnd ?? ""}
      />

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-5 py-3">Data / hora</th>
              <th className="px-5 py-3">Tipo de refeicao</th>
              <th className="px-5 py-3">Cantina</th>
              <th className="px-5 py-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {historico.map((h) => (
              <tr key={h.id} className="border-t border-slate-100">
                <td className="px-5 py-3">
                  {new Date(h.consumed_at).toLocaleString("pt-MZ")}
                </td>
                <td className="px-5 py-3">
                  {mealTypes.get(String(h.meal_type_id))?.nome ?? h.meal_type_id}
                </td>
                <td className="px-5 py-3">{h.cantina}</td>
                <td className="px-5 py-3">
                  {Number(h.valor_refeicao).toLocaleString("pt-MZ", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  MT
                </td>
              </tr>
            ))}
            {historico.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-slate-400">
                  Nenhuma refeicao encontrada no periodo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
