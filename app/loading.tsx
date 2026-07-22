import Image from "next/image";

export default function RootGlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-5">
        
        {/* Logótipo da iCantina com rotação contínua e efeito suave de pulsar */}
        <div className="relative h-28 w-28 animate-[spin_4s_linear_infinite] ease-in-out">
          <div className="animate-pulse">
            <Image
              src="/logo-icantina.png"
              alt="A carregar iCantina..."
              width={112}
              height={112}
              className="rounded-3xl shadow-xl border border-slate-100"
              priority
            />
          </div>
        </div>

        {/* Bloco de Texto Informativo */}
        <div className="text-center space-y-1">
          <p className="text-base font-bold text-slate-700 tracking-wide animate-pulse">
            A carregar o iCantina
          </p>
          <p className="text-xs text-slate-400 font-medium">
            A preparar os seus dados. Por favor, aguarde...
          </p>
        </div>

        {/* Barra de progresso horizontal em baixo para reforçar a sensação de movimento */}
        <div className="h-1.5 w-36 bg-slate-200 rounded-full overflow-hidden mt-2 relative">
          <div className="h-full bg-emerald-500 rounded-full animate-infinite-loading bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400" />
        </div>

      </div>

      {/* Injeção dos estilos de animação CSS puros para a barra de progresso */}
      <style>{`
        @keyframes infiniteLoading {
          0% { left: -100%; width: 50%; }
          50% { left: 25%; width: 60%; }
          100% { left: 100%; width: 50%; }
        }
        .animate-infinite-loading {
          position: absolute;
          animation: infiniteLoading 1.6s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}