"use client";

import { useEffect, useRef, useState } from "react";

const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function isoParaDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

function displayParaIso(display: string): string | null {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const dia = Number(d);
  const mes = Number(m);
  const ano = Number(y);
  if (mes < 1 || mes > 12) return null;
  const diasNoMes = new Date(ano, mes, 0).getDate();
  if (dia < 1 || dia > diasNoMes) return null;
  return `${y}-${m}-${d}`;
}

function aplicarMascara(valorDigitado: string, valorAnterior: string): string {
  const apenasDigitos = valorDigitado.replace(/\D/g, "").slice(0, 8);
  let resultado = apenasDigitos;
  if (apenasDigitos.length >= 5) {
    resultado = `${apenasDigitos.slice(0, 2)}/${apenasDigitos.slice(2, 4)}/${apenasDigitos.slice(4)}`;
  } else if (apenasDigitos.length >= 3) {
    resultado = `${apenasDigitos.slice(0, 2)}/${apenasDigitos.slice(2)}`;
  }
  return resultado;
}

export default function DatePickerField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string; // formato ISO yyyy-MM-dd
}) {
  const [isoValue, setIsoValue] = useState(defaultValue ?? "");
  const [displayValue, setDisplayValue] = useState(isoParaDisplay(defaultValue ?? ""));
  const [aberto, setAberto] = useState(false);
  const [mesVisivel, setMesVisivel] = useState(() => {
    const base = defaultValue ? new Date(defaultValue + "T00:00:00") : new Date();
    return { ano: base.getFullYear(), mes: base.getMonth() };
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const handleDigitar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoValor = aplicarMascara(e.target.value, displayValue);
    setDisplayValue(novoValor);
    const iso = displayParaIso(novoValor);
    if (iso) {
      setIsoValue(iso);
      const d = new Date(iso + "T00:00:00");
      setMesVisivel({ ano: d.getFullYear(), mes: d.getMonth() });
    }
  };

  const handleBlur = () => {
    const iso = displayParaIso(displayValue);
    if (!iso) {
      // valor invalido/incompleto: volta para o ultimo valor valido conhecido
      setDisplayValue(isoParaDisplay(isoValue));
    }
  };

  const selecionarDia = (dia: number) => {
    const iso = `${mesVisivel.ano}-${String(mesVisivel.mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    setIsoValue(iso);
    setDisplayValue(isoParaDisplay(iso));
    setAberto(false);
  };

  const mudarMes = (delta: number) => {
    setMesVisivel((prev) => {
      let mes = prev.mes + delta;
      let ano = prev.ano;
      if (mes < 0) {
        mes = 11;
        ano -= 1;
      } else if (mes > 11) {
        mes = 0;
        ano += 1;
      }
      return { ano, mes };
    });
  };

  const primeiroDiaSemana = new Date(mesVisivel.ano, mesVisivel.mes, 1).getDay();
  const totalDias = new Date(mesVisivel.ano, mesVisivel.mes + 1, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];

  const diaSelecionado = isoValue ? new Date(isoValue + "T00:00:00") : null;

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <input type="hidden" name={name} value={isoValue} />
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-brand-green">
        <input
          type="text"
          inputMode="numeric"
          placeholder="dd/MM/aaaa"
          value={displayValue}
          onChange={handleDigitar}
          onBlur={handleBlur}
          onFocus={() => setAberto(true)}
          className="w-24 text-sm outline-none"
        />
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="text-slate-400 hover:text-brand-greenDark"
          aria-label="Abrir calendario"
        >
          📅
        </button>
      </div>

      {aberto && (
        <div className="absolute z-20 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => mudarMes(-1)}
              className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {MESES[mesVisivel.mes]} {mesVisivel.ano}
            </span>
            <button
              type="button"
              onClick={() => mudarMes(1)}
              className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
            {DIAS_SEMANA.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {celulas.map((dia, idx) => {
              if (dia === null) return <div key={idx} />;
              const ehSelecionado =
                diaSelecionado &&
                diaSelecionado.getFullYear() === mesVisivel.ano &&
                diaSelecionado.getMonth() === mesVisivel.mes &&
                diaSelecionado.getDate() === dia;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selecionarDia(dia)}
                  className={`rounded-lg py-1 text-xs hover:bg-brand-green hover:text-white ${
                    ehSelecionado ? "bg-brand-green text-white" : "text-slate-700"
                  }`}
                >
                  {dia}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}