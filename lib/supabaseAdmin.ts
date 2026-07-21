import "server-only";
import { createClient } from "@supabase/supabase-js";

// Este cliente SO deve ser importado em codigo que roda no servidor
// (Server Components, Route Handlers, Server Actions). Nunca em "use client".
// Usa a Service Role Key, que ignora RLS -- por isso todo filtro de
// client_id tem que ser aplicado manualmente em cada query (ver lib/queries.ts).

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos nas variaveis de ambiente."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
