import Image from "next/image";

export default function RootGlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-5">
        
        {/* Logótipo com rotação contínua e pulsação nativas do Tailwind */}
        <div className="relative h-28 w-28 animate-spin [animation-duration:3s]">
          <div className="animate-pulse">
            <Image
              src="/logo-icantina.png"
              alt="A carregar iCantina..."
              width={112}
              height={112}
              className="rounded-3xl shadow-xl border border-slate-100"
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

        {/* Barra de progresso horizontal simples com efeito pulse */}
        <div className="h-1.5 w-36 bg-slate-200 rounded-full overflow-hidden mt-2">
          <div className="h-full w-full bg-emerald-500 rounded-full animate-pulse" />
        </div>

      </div>
    </div>
  );
}