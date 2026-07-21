"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSession } from "@/lib/session";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Preencha usuario e senha." };
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, client_id, client_entity_id, username, password, role")
    .eq("username", username)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    console.error("Erro Supabase no login:", error);
    return { error: "Erro ao contactar o servidor. Tente novamente." };
  }

  if (!user) {
    return { error: "Usuario ou senha invalidos." };
  }

  // O app desktop grava a senha com BCrypt.Net.BCrypt.HashPassword(),
  // que produz hashes bcrypt padrao ($2a$/$2b$), totalmente compativeis
  // com bcryptjs no lado do servidor.
  const stored = String(user.password ?? "");
  const senhaValida = await bcrypt.compare(password, stored);

  if (!senhaValida) {
    return { error: "Usuario ou senha invalidos." };
  }

  await createSession({
    userId: user.id,
    username: user.username,
    role: user.role,
    clientId: user.client_id,
    clientEntityId: user.client_entity_id,
  });

  redirect("/dashboard");
}
