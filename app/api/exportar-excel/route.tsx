import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { 
  getMealLogsForExportPaged, 
  getEmployees, 
  getMealTypesMap, 
  getEmpresas 
} from "@/lib/queries";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId") || "";
    const dateStart = searchParams.get("dateStart") || "";
    const dateEnd = searchParams.get("dateEnd") || "";
    const cantinaFiltro = searchParams.get("cantina") || "todas";
    const empresaFiltro = searchParams.get("empresa") || "todas";

    if (!clientId || !dateStart || !dateEnd) {
      return new Response("Faltam parâmetros obrigatórios de filtragem.", { status: 400 });
    }

    // 1. Carregar mapeamentos em memória
    const [employees, mealTypes, empresas] = await Promise.all([
      getEmployees(clientId),
      getMealTypesMap(clientId),
      getEmpresas(clientId),
    ]);

    const employeeNames: Record<string, string> = {};
    const employeeCodigos: Record<string, string> = {};
    const employeeEmpresaId: Record<string, string> = {};

    for (const e of employees) {
      employeeNames[e.client_entity_id] = e.nome;
      employeeCodigos[e.client_entity_id] = e.codigo ?? "-";
      employeeEmpresaId[e.client_entity_id] = e.empresa_client_id ?? "";
    }

    const empresaNomes: Record<string, string> = {};
    for (const emp of empresas) {
      empresaNomes[emp.client_entity_id] = emp.nome;
    }

    // 2. Criar o Workbook em modo clássico para extração segura de Buffer
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Relatório de Refeições");

    worksheet.columns = [
      { header: "No Interno", key: "codigo", width: 15 },
      { header: "Nome do colaborador", key: "colaborador", width: 35 },
      { header: "Empresa", key: "empresa", width: 25 },
      { header: "Tipo de refeição", key: "tipo", width: 20 },
      { header: "Cantina", key: "cantina", width: 20 },
      { header: "Data", key: "data", width: 15 },
      { header: "Hora", key: "hora", width: 15 }
    ];

    // Estilizar o cabeçalho (Verde FluxoFácil)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "00A859" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // 3. Processamento em lotes da base de dados (Mesma lógica rápida)
    let paginaAtual = 1;
    const TAMANHO_LOTE = 1000;
    let temMaisRegistos = true;
    let counterLinhas = 0;

    while (temMaisRegistos) {
      const dadosLote = await getMealLogsForExportPaged(
        clientId,
        dateStart,
        dateEnd,
        cantinaFiltro,
        empresaFiltro,
        paginaAtual,
        TAMANHO_LOTE
      );

      if (!dadosLote || dadosLote.length === 0) {
        temMaisRegistos = false;
        break;
      }

      for (const l of dadosLote) {
        if (employeeNames[l.employee_id] === undefined) continue;

        const dataHora = new Date(l.consumed_at);
        counterLinhas++;
        const corLinhaZebra = counterLinhas % 2 === 0 ? "FFF9F9F9" : "FFFFFFFF";

        const row = worksheet.addRow({
          codigo: employeeCodigos[l.employee_id] ?? "-",
          colaborador: employeeNames[l.employee_id] ?? "-",
          empresa: empresaNomes[employeeEmpresaId[l.employee_id]] ?? "-",
          tipo: mealTypes.get(String(l.meal_type_id))?.nome ?? String(l.meal_type_id),
          cantina: l.cantina || "Principal",
          data: dataHora.toLocaleDateString("pt-MZ"),
          hora: dataHora.toLocaleTimeString("pt-MZ")
        });

        row.height = 20;
        row.eachCell((cell, colNumber) => {
          cell.font = { name: "Segoe UI", size: 10 };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: corLinhaZebra } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };

          if (colNumber === 2 || colNumber === 3) {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          } else {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }
        });
      }

      if (dadosLote.length < TAMANHO_LOTE) {
        temMaisRegistos = false;
      } else {
        paginaAtual++;
      }
    }

    // 4. CORREÇÃO: Escrever o Excel num Buffer binário direto na memória do Next.js
    const buffer = await workbook.xlsx.writeBuffer();

    // 5. Envia o buffer completo. O Next.js fecha a conexão na hora e destranca o botão!
    return new Response(buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Relatorio_Refeicoes_${dateStart}_${dateEnd}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });

  } catch (error: any) {
    console.error("Erro fatal na rota de exportação Excel:", error);
    return new Response(`Erro ao gerar ficheiro: ${error.message}`, { status: 500 });
  }
}
