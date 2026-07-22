"use client";

import * as XLSX from "xlsx";
import type { ReportRow } from "./ExportCsvButton";

export default function ExportExcelButton({ rows }: { rows: ReportRow[] }) {
  const handleExport = () => {
    const dadosPlanilha = rows.map((r) => ({
      "No Interno": r.codigo,
      "Nome do colaborador": r.colaborador,
      Empresa: r.empresa,
      "Tipo de refeicao": r.tipo,
      Cantina: r.cantina,
      "Valor (MT)": r.valor,
      "Data/Hora": r.data,
    }));

    const planilha = XLSX.utils.json_to_sheet(dadosPlanilha);

    // Ajusta largura das colunas para melhor leitura
    planilha["!cols"] = [
      { wch: 12 }, // No Interno
      { wch: 30 }, // Nome do colaborador
      { wch: 22 }, // Empresa
      { wch: 22 }, // Tipo de refeicao
      { wch: 18 }, // Cantina
      { wch: 12 }, // Valor
      { wch: 20 }, // Data/Hora
    ];

    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, "Relatorio");

    const nomeArquivo = `relatorio-icantina-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(livro, nomeArquivo);
  };

  return (
    <button
      onClick={handleExport}
      className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-greenDark shadow-sm hover:bg-slate-50"
    >
      📊 Exportar Excel
    </button>
  );
}