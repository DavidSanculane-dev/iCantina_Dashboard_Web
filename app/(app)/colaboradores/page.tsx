import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getEmployees, getDepartamentos, getEmpresas } from "@/lib/queries";
import { Suspense } from "react";

// Carregamento discreto local apenas para a listagem da tabela
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
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

// 1. COMPONENTE ASSÍNCRONO: Processa a base de dados pesada em segundo plano
async function ColaboradoresConteudo({ clientId, q }: { clientId: string; q: string }) {
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

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100">
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
            <tr key={e.id}>
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
                <Link href={`/colaboradores/${e.id}`}>
                  Ver histórico →
                </Link>
              </td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                Nenhum colaborador encontrado para a pesquisa ativa.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// 2. COMPONENTE PRINCIPAL: Resposta imediata na mudança de rotas da Sidebar
export default async function ColaboradoresPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const resolvedParams = await searchParams;
  const q = resolvedParams.q ?? "";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Colaboradores</h1>

      {/* Formulário estático fixo na tela */}
      <form action="/colaboradores" method="get" className="mb-6 flex gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Pesquisar por nome..."
          className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green bg-white transition-colors"
        />
        <button type="submit" className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-greenDark transition-colors">
          Pesquisar
        </button>
      </form>

      {/* A Key obriga o React a isolar a atualização apenas na tabela ao pesquisar */}
      <Suspense key={q} fallback={<TabelaLoading />}>
        <ColaboradoresConteudo clientId={session.clientId} q={q} />
      </Suspense>
    </div>
  );
}