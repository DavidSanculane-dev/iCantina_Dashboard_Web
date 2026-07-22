"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

// Cores premium e alternadas para destacar cada uma das cantinas de forma clara
const COLORS = ["#3b82f6", "#10b981", "#6366f1", "#f59e0b"];

interface CantinaBarChartProps {
  data: { cantina: string; total: number }[];
}

export default function CantinaBarChart({ data }: CantinaBarChartProps) {
  // Validação simples caso os dados demorem a carregar ou venham vazios
  if (!data || data.length === 0) {
    return (
      <div className="h-[260px] w-full flex items-center justify-center text-sm text-slate-400">
        Sem dados de cantinas para o período selecionado.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart 
        data={data} 
        layout="vertical" 
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        {/* Linhas de grelha verticais discretas para acompanhar a evolução horizontal */}
        <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" horizontal={false} />
        
        {/* Eixo X com números formatados localmente */}
        <XAxis 
          type="number" 
          tick={{ fontSize: 11, fill: "#64748b" }} 
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => value.toLocaleString("pt-MZ")}
          dy={5}
        />
        
        {/* Eixo Y com os nomes das cantinas alinhados à esquerda */}
        <YAxis 
          type="category" 
          dataKey="cantina" 
          tick={{ fontSize: 12, fill: "#334155", fontWeight: 500 }} 
          width={140}
          axisLine={false}
          tickLine={false}
        />
        
        {/* Tooltip moderno com cantos arredondados e sombra suave */}
        <Tooltip 
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
            fontSize: "12px",
          }}
          cursor={{ fill: "#f8fafc" }} // Destaque sutil ao passar o rato por cima da linha da cantina
          formatter={(value: number) => [value.toLocaleString("pt-MZ"), "Refeições"]}
        />
        
        {/* Barras horizontais com cantos arredondados apenas na extremidade direita */}
        <Bar 
          dataKey="total" 
          radius={[0, 6, 6, 0]} 
          barSize={24} // Altura controlada da barra para não ficar desproporcional
        >
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
