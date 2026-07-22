"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#6366f1", "#f59e0b", "#8b5cf6"];

interface DonutChartProps {
  data: { nome: string; total: number }[];
}

export default function DonutChart({ data }: DonutChartProps) {
  return (
    <div className="flex flex-col h-full justify-between">
      {/* Reduzido de 200px para 170px para garantir que tudo caiba no card */}
      <div className="relative w-full h-[170px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="nome"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
            >
              {data.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Margem superior sutil e padding inferior para manter dentro do card */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-1 mt-2 pb-2">
        {data.map((item, i) => (
          <div key={item.nome} className="flex items-center gap-2 min-w-0">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span 
              className="text-xs font-medium text-slate-600 truncate" 
              title={item.nome}
            >
              {item.nome}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}