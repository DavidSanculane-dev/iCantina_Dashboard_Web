"use client";

import { useState } from "react";

interface ExportButtonProps {
  clientId: string;
  dateStart: string;
  dateEnd: string;
  cantina: string;
  empresa: string;
}

export default function ExportCsvButton({ clientId, dateStart, dateEnd, cantina, empresa }: ExportButtonProps) {
  const [exportando, setExportando] = useState(false);

  const lidarComExportacao = () => {
    setExportando(true);

    // Monta a URL apontando para a nossa nova rota de API de Stream
    const params = new URLSearchParams({ clientId, dateStart, dateEnd, cantina, empresa });
    
    // Dispara o download nativo do browser de forma assíncrona
    window.location.href = `/api/exportar-csv?${params.toString()}`;

    // Como o download roda em background do browser, resetamos o estado após alguns segundos
    setTimeout(() => setExportando(false), 4000);
  };

  return (
    <button
      onClick={lidarComExportacao}
      disabled={exportando}
      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:bg-slate-300"
    >
      {exportando ? (
        <>
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
          A descarregar...
        </>
      ) : (
        "Exportar CSV"
      )}
    </button>
  );
}

