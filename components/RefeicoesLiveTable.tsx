"use client";

import { useEffect, useRef, useState } from "react";
import type { MealLog } from "@/lib/queries";

type Lookup = Record<string, string>;

export default function RefeicoesLiveTable({
  initialLogs,
  employeeNames,
  mealTypeNames,
  cantinaFiltro = "todas",
  searchFiltro = ""
}: {
  initialLogs: MealLog[];
  employeeNames: Lookup;
  mealTypeNames: Lookup;
  cantinaFiltro?: string;
  searchFiltro?: string;
}) {
  const [logs, setLogs] = useState<MealLog[]>(initialLogs);
  const [connected, setConnected] = useState(false);
  const seenIds = useRef(new Set(initialLogs.map((l) => l.id)));

  useEffect(() => {
    setLogs(initialLogs);
    seenIds.current = new Set(initialLogs.map((l) => l.id));
  }, [initialLogs]);

  const passaNoFiltro = (log: MealLog) => {
    const nome = employeeNames[log.employee_id];
    if (nome === undefined) return false;
    if (searchFiltro && !nome.toLowerCase().includes(searchFiltro)) return false;
    if (cantinaFiltro !== "todas" && log.cantina !== cantinaFiltro) return false;
    return true;
  };
  
  useEffect(() => {
   
    const source = new EventSource("/api/realtime/meal-log");

    source.addEventListener("open", () => setConnected(true));
    source.addEventListener("error", () => setConnected(false));

    source.addEventListener("meal-log", (event) => {
      const novos = JSON.parse((event as MessageEvent).data) as MealLog[];
      setLogs((prev) => {
        const toAdd = novos.filter((n) => !seenIds.current.has(n.id));
        toAdd.forEach((n) => seenIds.current.add(n.id));
        return [...toAdd.reverse(), ...prev].slice(0, 200);
      });
    });

    return () => source.close();
  }, [cantinaFiltro, searchFiltro, employeeNames]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-700">Refeicoes registadas agora</h2>
        <span
          className={`flex items-center gap-2 text-xs font-medium ${
            connected ? "text-green-600" : "text-slate-400"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-green-500" : "bg-slate-300"
            }`}
          />
          {connected ? "Ao vivo" : "Conectando..."}
        </span>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-white text-xs uppercase text-slate-400">
            <tr>
              <th className="py-2">Colaborador</th>
              <th className="py-2">Tipo de refeicao</th>
              <th className="py-2">Cantina</th>
              <th className="py-2">Valor</th>
              <th className="py-2">Hora</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-100">
                <td className="py-2">{employeeNames[log.employee_id] ?? "Colaborador removido"}</td>
                <td className="py-2">
                  {mealTypeNames[String(log.meal_type_id)] ?? log.meal_type_id}
                </td>
                <td className="py-2">{log.cantina}</td>
                <td className="py-2">
                  {Number(log.valor_refeicao).toLocaleString("pt-MZ", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  MT
                </td>
                <td className="py-2 text-slate-500">
                  {new Date(log.consumed_at).toLocaleString("pt-MZ")}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  Sem registos ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
