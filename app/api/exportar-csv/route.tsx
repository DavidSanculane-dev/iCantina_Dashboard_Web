import { NextRequest } from "next/server";
import { 
  getMealLogsForExportPaged, // Terá de criar este método simplificado na sua lib/queries
  getEmployees, 
  getMealTypesMap, 
  getEmpresas 
} from "@/lib/queries";

// Força a API a comportar-se como uma função de execução longa (se estiver na Vercel/AWS)
export const maxDuration = 60; 

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") || "";
  const dateStart = searchParams.get("dateStart") || "";
  const dateEnd = searchParams.get("dateEnd") || "";
  const cantinaFiltro = searchParams.get("cantina") || "todas";
  const empresaFiltro = searchParams.get("empresa") || "todas";

  // 1. Carregar mapeamentos estáticos pequenos em memória (Tabelas de apoio)
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

  // Helper para escapar caracteres especiais do CSV (como aspas e vírgulas)
  const escapeCSV = (val: string) => `"${val.replace(/"/g, '""')}"`;

  // 2. Configurar o Stream de Resposta
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Escrever o cabeçalho (BOM UTF-8 para o Excel abrir os acentos corretamente)
      controller.enqueue(encoder.encode("\uFEFF"));
      
      // Escrever títulos das colunas do CSV
      const headers = ["No Interno", "Nome do colaborador", "Empresa", "Tipo de refeicao", "Cantina", "Data", "Hora"];
      controller.enqueue(encoder.encode(headers.join(",") + "\n"));

      let paginaAtual = 1;
      const TAMANHO_LOTE = 1000; // Puxa de 1.000 em 1.000 registos
      let temMaisRegistos = true;

      while (temMaisRegistos) {
        // Puxa apenas o lote atual da base de dados
        // Nota: Garanta que esta query implementa LIMIT e OFFSET usando paginaAtual e TAMANHO_LOTE
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

        // Processa o lote atual e escreve-o imediatamente no stream
        let linhasCsvChunk = "";
        for (const l of dadosLote) {
          if (employeeNames[l.employee_id] === undefined) continue;

          const dataHora = new Date(l.consumed_at);
          const dataMZ = dataHora.toLocaleDateString("pt-MZ");
          const horaMZ = dataHora.toLocaleTimeString("pt-MZ");

          const colunas = [
            escapeCSV(employeeCodigos[l.employee_id] ?? "-"),
            escapeCSV(employeeNames[l.employee_id] ?? "-"),
            escapeCSV(empresaNomes[employeeEmpresaId[l.employee_id]] ?? "-"),
            escapeCSV(mealTypes.get(String(l.meal_type_id))?.nome ?? String(l.meal_type_id)),
            escapeCSV(l.cantina || "Principal"),
            escapeCSV(dataMZ),
            escapeCSV(horaMZ)
          ];

          linhasCsvChunk += colunas.join(",") + "\n";
        }

        // Envia este bloco de texto para o utilizador, limpando a memória RAM do servidor
        controller.enqueue(encoder.encode(linhasCsvChunk));

        // Se o lote veio incompleto, significa que chegámos ao fim dos 70.000 registos
        if (dadosLote.length < TAMANHO_LOTE) {
          temMaisRegistos = false;
        } else {
          paginaAtual++;
        }
      }

      // Fecha o canal de transmissão quando tudo terminar
      controller.close();
    },
  });

  // Retorna o fluxo de dados configurado como um ficheiro de download para o browser
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="Relatorio_Refeicoes_${dateStart}_${dateEnd}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
