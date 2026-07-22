import { getSession } from "@/lib/session";
import { getDashboardSummary, getMealTypesMap } from "@/lib/queries";
import StatCard from "@/components/StatCard";
import DateRangeFilter from "@/components/DateRangeFilter";
import TrendChart from "@/components/charts/TrendChart";
import DonutChart from "@/components/charts/DonutChart";
import CantinaBarChart from "@/components/charts/CantinaBarChart";
import { redirect } from "next/navigation";

function formatMT(value: number) {
  return new Intl.NumberFormat("pt-MZ", { minimumFractionDigits: 2 }).format(value) + " MT";
}

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 20);
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { dateStart: toISO(start), dateEnd: toISO(end) };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { dateStart?: string; dateEnd?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const defaults = defaultRange();
  const dateStart = searchParams.dateStart || defaults.dateStart;
  const dateEnd = searchParams.dateEnd || defaults.dateEnd;

  const [summary, mealTypes] = await Promise.all([
    getDashboardSummary(session.clientId, dateStart, `${dateEnd}T23:59:59`),
    getMealTypesMap(session.clientId),
  ]);

  const distribuicao = Array.from(summary.distribuicaoPorTipo.entries()).map(
    ([tipoId, total]) => ({
      nome: mealTypes.get(tipoId)?.nome ?? `Tipo ${tipoId}`,
      total,
    })
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Dashboard</h1>

      <DateRangeFilter action="/dashboard" dateStart={dateStart} dateEnd={dateEnd} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total de refeições (periodo)"
          value={summary.totalRefeicoes.toLocaleString("pt-MZ")}
          icon="📈"
          bg="bg-lime-50"
        />
        <StatCard
          label="Colaboradores atendidos"
          value={summary.colaboradoresUnicos.toLocaleString("pt-MZ")}
          icon="👥"
        />
        <StatCard
          label="Custo médio de refeição"
          value={formatMT(summary.custoMedio)}
          icon="🔄"
        />
        <StatCard
          label="Total em valor"
          value={formatMT(summary.totalValor)}
          icon="🏦"
          bg="bg-rose-50"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 font-semibold text-slate-700">
            Tendência de consumo de refeições
          </h2>
          <TrendChart data={summary.tendencia} />
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-700">
            Distribuição por tipo de refeição
          </h2>
          <div className = "h- [240px]">
            <DonutChart data={distribuicao} />
          </div>
          
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-700">Refeições por cantina</h2>
        <CantinaBarChart data={summary.porCantina} />
      </div>
    </div>
  );
}
