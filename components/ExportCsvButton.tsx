"use client";

export type ReportRow = {
  colaborador: string;
  tipo: string;
  cantina: string;
  valor: number;
  data: string;
};

export default function ExportCsvButton({ rows }: { rows: ReportRow[] }) {
  const handleExport = () => {
    const header = ["Colaborador", "Tipo de refeicao", "Cantina", "Valor (MT)", "Data/Hora"];
    const lines = rows.map((r) =>
      [r.colaborador, r.tipo, r.cantina, r.valor.toFixed(2), r.data]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";")
    );
    const csv = [header.join(";"), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-icantina-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-greenDark shadow-sm hover:bg-slate-50"
    >
      ⬇️ Exportar CSV
    </button>
  );
}
