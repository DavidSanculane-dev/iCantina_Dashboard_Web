"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "./actions";
import Footer from "@/components/Footer";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand-green py-3 font-semibold text-white transition hover:bg-brand-greenDark disabled:opacity-60"
    >
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-2xl text-white">
            🍽️
          </div>
          <h1 className="text-2xl font-bold text-brand-greenDark">iCantina</h1>
          <p className="text-sm text-slate-500">Relatorios e historico de refeicoes</p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Usuario
            </label>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-brand-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Senha
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-brand-green"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>
      </div>

      <Footer />
    </div>
  );
}