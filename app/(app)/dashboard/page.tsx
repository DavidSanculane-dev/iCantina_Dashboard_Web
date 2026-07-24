import { getSession } from "@/lib/session";
import { getDashboardSummary, getMealTypesMap } from "@/lib/queries";
import StatCard from "@/components/StatCard";
import DateRangeFilter from "@/components/DateRangeFilter";
import TrendChart from "@/components/charts/TrendChart";
import DonutChart from "@/components/charts/DonutChart";
import CantinaBarChart from "@/components/charts/CantinaBarChart";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function formatMT(value: number) {
  return new Intl.NumberFormat("pt-MZ", { minimumFractionDigits: 2 }).format(value) + " MT";
}

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { dateStart: toISO(start), dateEnd: toISO(end) };
}

// 1. COMPONENTE DE LOADING LOCAL: Esqueleto cinzento discreto para o Dashboard não piscar a tela inteira
function DashboardDataLoading() {
  return (
    <div className="space-y-6 mt-6 animate-pulse">
      {/* Esqueleto dos 4 Cartões Estatísticos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white border border-slate-50 p-5 shadow-sm" />
        ))}
      </div>

      {/* Esqueleto dos Gráficos de Tendência e Pizza */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-80 rounded-2xl bg-white border border-slate-50 lg:col-span-2 shadow-sm" />
        <div className="h-80 rounded-2xl bg-white border border-slate-50 shadow-sm" />
      </div>

      {/* Esqueleto do Gráfico de Cantinas */}
      <div className="h-80 rounded-2xl bg-white border border-slate-50 shadow-sm" />
    </div>
  );
}

interface SearchParams {
  dateStart?: string;
  dateEnd?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

// 2. COMPONENTE ASSÍNCRONO: Processa as queries e cruza as informações no servidor
async function DashboardConteudo({ 
  clientId, 
  dateStart, 
  dateEnd 
}: { 
  clientId: string; 
  dateStart: string; 
  dateEnd: string; 
}) {
  const [summary, mealTypes] = await Promise.all([
    getDashboardSummary(clientId, dateStart, `${dateEnd}T23:59:59`),
    getMealTypesMap(clientId),
  ]);

  const distribuicao = Array.from(summary.distribuicaoPorTipo.entries()).map(
    ([tipoId, total]) => ({
      nome: mealTypes.get(tipoId)?.nome ?? `Tipo ${tipoId}`,
      total,
    })
  );

  return (
    <div className="space-y-6 mt-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Grid de Cartões de Estatísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total de refeições (período)"
          value={summary.totalRefeicoes.toLocaleString("pt-MZ")}
          icon="📈"
          bg="bg-lime-50/50"
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
          bg="bg-rose-50/50"
        />
      </div>

      {/* Secção de Gráficos Principais */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-50 lg:col-span-2">
          <h2 className="mb-3 font-semibold text-slate-700">
            Tendência de consumo de refeições
          </h2>
          <TrendChart data={summary.tendencia} />
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-50 flex flex-col justify-between">
          <h2 className="mb-3 font-semibold text-slate-700">
            Distribuição por tipo de refeição
          </h2>
          <div className="h-[240px]">
            <DonutChart data={distribuicao} />
          </div>
        </div>
      </div>

      {/* Gráfico Inferior por Cantina */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-50">
        <h2 className="mb-3 font-semibold text-slate-700">Refeições por cantina</h2>
        <CantinaBarChart data={summary.porCantina} />
      </div>
    </div>
  );
}

// 3. COMPONENTE PRINCIPAL: Carrega instantaneamente sem tocar na base de dados
export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const resolvedParams = await searchParams;
  const defaults = defaultRange();
  const dateStart = resolvedParams.dateStart || defaults.dateStart;
  const dateEnd = resolvedParams.dateEnd || defaults.dateEnd;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Dashboard</h1>

      {/* Filtro de data fixo na tela para não sofrer blur ou piscar ao mudar o período */}
      <DateRangeFilter action="/dashboard" dateStart={dateStart} dateEnd={dateEnd} />

      {/* A Key isola a atualização apenas para os componentes afetados pela troca de data */}
      <Suspense 
        key={`${dateStart}-${dateEnd}`} 
        fallback={<DashboardDataLoading />}
      >
        <DashboardConteudo
          clientId={session.clientId}
          dateStart={dateStart}
          dateEnd={dateEnd}
        />
      </Suspense>
    </div>
  );
}
