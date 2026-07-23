"use client";

export type ReportRow = {
  codigo: string;
  colaborador: string;
  empresa: string;
  tipo: string;
  cantina: string;
  //valor: number;
  data: string;
  hora: string;
};

export default function ExportCsvButton({ rows }: { rows: ReportRow[] }) {
  const handleExport = () => {
    const header = [
      "No Interno",
      "Nome do colaborador",
      "Empresa",
      "Tipo de refeicao",
      "Cantina",
      "Valor (MT)",
      "Data",
      "Hora",
    ];
    const lines = rows.map((r) =>
      [r.codigo, r.colaborador, r.empresa, r.tipo, r.cantina, r.data, r.hora]
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
