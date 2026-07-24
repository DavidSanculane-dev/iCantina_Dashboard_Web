"use client";

import { useState } from "react";

interface ExportButtonProps {
  clientId: string;
  dateStart: string;
  dateEnd: string;
  cantina: string;
  empresa: string;
}

export default function ExportExcelButton({ clientId, dateStart, dateEnd, cantina, empresa }: ExportButtonProps) {
  const [exportando, setExportando] = useState(false);

  const lidarComExportacao = async () => {
    // Impede cliques duplos acidentais
    if (exportando) return; 
    
    setExportando(true);

    try {
      const params = new URLSearchParams({ clientId, dateStart, dateEnd, cantina, empresa });
      
      // 1. Faz o pedido assíncrono para a API
      const resposta = await fetch(`/api/exportar-excel?${params.toString()}`);

      if (!resposta.ok) {
        throw new Error("Não foi possível gerar o ficheiro no servidor.");
      }

      // 2. Converte a resposta em binário (Blob)
      const blob = await resposta.blob();

      // 3. Cria um link virtual temporário para disparar o download nativo
      const urlFicheiro = window.URL.createObjectURL(blob);
      const linkVirtual = document.createElement("a");
      linkVirtual.href = urlFicheiro;
      
      // Define o nome exato do ficheiro no download
      linkVirtual.download = `Relatorio_Refeicoes_${dateStart}_${dateEnd}.xlsx`;
      
      // Simula o clique e limpa a memória do browser
      document.body.appendChild(linkVirtual);
      linkVirtual.click();
      document.body.removeChild(linkVirtual);
      window.URL.revokeObjectURL(urlFicheiro);

    } catch (erro) {
      console.error("Erro ao descarregar Excel:", erro);
      alert("Ocorreu um erro ao exportar o relatório. Por favor, tente novamente.");
    } finally {
      // ✅ O botão só volta ao normal quando o processamento e o download terminarem a 100%
      setExportando(false);
    }
  };

  return (
    <button
      onClick={lidarComExportacao}
      disabled={exportando}
      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {exportando ? (
        <>
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
          A processar...
        </>
      ) : (
        "📊 Exportar Excel"
      )}
    </button>
  );
}


 