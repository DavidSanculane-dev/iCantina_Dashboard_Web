import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getEmployees, getDepartamentos, getEmpresas } from "@/lib/queries";

export default async function ColaboradoresPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const q = searchParams.q ?? "";
  const [employees, departamentos, empresas] = await Promise.all([
    getEmployees(session.clientId, q),
    getDepartamentos(session.clientId),
    getEmpresas(session.clientId),
  ]);

  const departamentoNomes: Record<string, string> = {};
  for (const d of departamentos) departamentoNomes[d.client_entity_id] = d.nome;

  const empresaNomes: Record<string, string> = {};
  for (const emp of empresas) empresaNomes[emp.client_entity_id] = emp.nome;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Colaboradores</h1>

      <form action="/colaboradores" method="get" className="mb-6 flex gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Pesquisar por nome..."
          className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
        />
        <button className="rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-greenDark">
          Pesquisar
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
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
            {employees.map((e) => (
              <tr key={e.client_entity_id} className="border-t border-slate-100">
                <td className="px-5 py-3">{e.codigo ?? "-"}</td>
                <td className="px-5 py-3 font-medium">{e.nome}</td>
                <td className="px-5 py-3">
                  {departamentoNomes[e.departamento_client_id ?? ""] ?? "-"}
                </td>
                <td className="px-5 py-3">
                  {empresaNomes[e.empresa_client_id ?? ""] ?? "-"}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      e.ativo
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {e.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/colaboradores/${e.client_entity_id}`}
                    className="text-sm font-medium text-brand-greenDark hover:underline"
                  >
                    Ver historico →
                  </Link>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                  Nenhum colaborador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
