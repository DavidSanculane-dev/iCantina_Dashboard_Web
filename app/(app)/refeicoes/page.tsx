import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMealLogsToday, getEmployees, getMealTypesMap } from "@/lib/queries";
import RefeicoesLiveTable from "@/components/RefeicoesLiveTable";

export default async function RefeicoesPage({
  searchParams,
}: {
  searchParams: { cantina?: string; q?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const cantinaFiltro = searchParams.cantina || "todas";
  const q = (searchParams.q || "").trim().toLowerCase();

  // Busca TODAS as refeicoes de hoje de uma vez so (sem filtro no banco).
  // O filtro de cantina e a busca por nome sao aplicados aqui em memoria,
  // garantindo que "Todas" e a soma das cantinas sempre batem entre si.
  const [todosLogsHoje, employees, mealTypes] = await Promise.all([
    getMealLogsToday(session.clientId),
    getEmployees(session.clientId),
    getMealTypesMap(session.clientId),
  ]);

  const employeeNames: Record<string, string> = {};
  for (const e of employees) employeeNames[e.client_entity_id] = e.nome;

  const mealTypeNames: Record<string, string> = {};
  for (const [id, mt] of mealTypes.entries()) mealTypeNames[id] = mt.nome;

  // So considera refeicoes de colaboradores ativos (nao removidos)
  const logsValidos = todosLogsHoje.filter(
    (l) => employeeNames[l.employee_id] !== undefined
  );

  // Lista de cantinas derivada dos proprios dados de hoje (evita
  // duplicatas/nomes divergentes vindos da tabela "cantinas")
  const cantinasDisponiveis = Array.from(
    new Set(logsValidos.map((l) => l.cantina).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

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
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Refeicoes ao vivo</h1>

      <form
        action="/refeicoes"
        method="get"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm"
      >
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
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Colaborador
          </label>
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Pesquisar por nome..."
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-greenDark"
        >
          🔍 Filtrar
        </button>
      </form>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total de refeicoes</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {totalRefeicoes.toLocaleString("pt-MZ")}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Colaboradores atendidos</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {colaboradoresUnicos.toLocaleString("pt-MZ")}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total em valor</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {totalValor.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
          </p>
        </div>
      </div>

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
