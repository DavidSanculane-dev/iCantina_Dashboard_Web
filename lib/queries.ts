import "server-only";
import { supabaseAdmin } from "./supabaseAdmin";

// ---------- Tipos ----------
export type MealLog = {
  id: number;
  local_id: number | null;
  client_id: string;
  employee_id: string;
  meal_type_id: string;
  cantina: string;
  valor_refeicao: number;
  consumed_at: string;
  created_at: string;
};

export type Employee = {
  id: number;
  client_entity_id: string;
  client_id: string;
  codigo: string | null;
  nome: string;
  departamento_client_id: string | null;
  empresa_client_id: string | null;
  cantina_client_id: string | null;
  ativo: boolean;
};

export type MealType = {
  id: number;
  client_id: string;
  nome: string;
  preco: number;
};

export type Cantina = {
  id: number;
  client_entity_id: string;
  client_id: string;
  nome: string;
};

// ---------- Dashboard ----------

export async function getDashboardSummary(
  clientId: string,
  dateStart: string,
  dateEnd: string
) {
  const { data, error } = await supabaseAdmin
    .from("meal_log")
    .select("valor_refeicao, employee_id, meal_type_id, cantina, consumed_at")
    .eq("client_id", clientId)
    .eq("is_deleted", false)
    .gte("consumed_at", dateStart)
    .lte("consumed_at", dateEnd);

  if (error) throw error;

  const rows = data ?? [];
  const totalRefeicoes = rows.length;
  const colaboradoresUnicos = new Set(rows.map((r) => r.employee_id)).size;
  const totalValor = rows.reduce((acc, r) => acc + Number(r.valor_refeicao ?? 0), 0);
  const custoMedio = totalRefeicoes > 0 ? totalValor / totalRefeicoes : 0;

  // Series por dia (para o grafico de tendencia)
  const porDiaMap = new Map<string, number>();
  for (const r of rows) {
    const dia = String(r.consumed_at).slice(0, 10);
    porDiaMap.set(dia, (porDiaMap.get(dia) ?? 0) + 1);
  }
  const tendencia = Array.from(porDiaMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([data, total]) => ({ data, total }));

  // Distribuicao por tipo de refeicao
  const porTipoMap = new Map<string, number>();
  for (const r of rows) {
    const tipo = String(r.meal_type_id);
    porTipoMap.set(tipo, (porTipoMap.get(tipo) ?? 0) + 1);
  }

  // Por cantina
  const porCantinaMap = new Map<string, number>();
  for (const r of rows) {
    const c = r.cantina ?? "N/D";
    porCantinaMap.set(c, (porCantinaMap.get(c) ?? 0) + 1);
  }
  const porCantina = Array.from(porCantinaMap.entries()).map(([cantina, total]) => ({
    cantina,
    total,
  }));

  return {
    totalRefeicoes,
    colaboradoresUnicos,
    custoMedio,
    totalValor,
    tendencia,
    distribuicaoPorTipo: porTipoMap,
    porCantina,
  };
}

export async function getMealTypesMap(clientId: string) {
  const { data, error } = await supabaseAdmin
    .from("meal_types")
    .select("id, nome, preco")
    .eq("client_id", clientId);
  if (error) throw error;
  const map = new Map<string, MealType>();
  for (const mt of data ?? []) map.set(String(mt.id), mt as MealType);
  return map;
}

// ---------- Refeicoes (tempo real / listagem) ----------

export async function getRecentMealLogs(clientId: string, limit = 50) {
  const { data, error } = await supabaseAdmin
    .from("meal_log")
    .select(
      "id, employee_id, meal_type_id, cantina, valor_refeicao, consumed_at, created_at"
    )
    .eq("client_id", clientId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as MealLog[];
}

export async function getMealLogsCreatedAfter(clientId: string, afterIso: string) {
  const { data, error } = await supabaseAdmin
    .from("meal_log")
    .select(
      "id, employee_id, meal_type_id, cantina, valor_refeicao, consumed_at, created_at"
    )
    .eq("client_id", clientId)
    .eq("is_deleted", false)
    .gt("created_at", afterIso)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as MealLog[];
}

// ---------- Colaboradores ----------

export async function getEmployees(clientId: string, search?: string) {
  let query = supabaseAdmin
    .from("employees")
    .select(
      "id, client_entity_id, codigo, nome, departamento_client_id, empresa_client_id, cantina_client_id, ativo"
    )
    .eq("client_id", clientId)
    .eq("is_deleted", false)
    .order("nome", { ascending: true });

  if (search && search.trim().length > 0) {
    query = query.ilike("nome", `%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Employee[];
}

export async function getEmployeeById(clientId: string, clientEntityId: string) {
  const { data, error } = await supabaseAdmin
    .from("employees")
    .select("*")
    .eq("client_id", clientId)
    .eq("client_entity_id", clientEntityId)
    .eq("is_deleted", false)
    .maybeSingle();
  if (error) throw error;
  return data as Employee | null;
}

export async function getEmployeeMealHistory(
  clientId: string,
  employeeClientEntityId: string,
  dateStart?: string,
  dateEnd?: string
) {
  let query = supabaseAdmin
    .from("meal_log")
    .select("id, meal_type_id, cantina, valor_refeicao, consumed_at")
    .eq("client_id", clientId)
    .eq("employee_id", employeeClientEntityId)
    .eq("is_deleted", false)
    .order("consumed_at", { ascending: false });

  if (dateStart) query = query.gte("consumed_at", dateStart);
  if (dateEnd) query = query.lte("consumed_at", dateEnd);

  const { data, error } = await query.limit(500);
  if (error) throw error;
  return (data ?? []) as MealLog[];
}

// ---------- Cantinas / Relatorios ----------

export async function getCantinas(clientId: string) {
  const { data, error } = await supabaseAdmin
    .from("cantinas")
    .select("id, client_entity_id, nome")
    .eq("client_id", clientId)
    .eq("is_deleted", false);
  if (error) throw error;
  return (data ?? []) as Cantina[];
}

export async function getMealLogsForReport(
  clientId: string,
  dateStart: string,
  dateEnd: string,
  cantina?: string
) {
  let query = supabaseAdmin
    .from("meal_log")
    .select(
      "id, employee_id, meal_type_id, cantina, valor_refeicao, consumed_at"
    )
    .eq("client_id", clientId)
    .eq("is_deleted", false)
    .gte("consumed_at", dateStart)
    .lte("consumed_at", dateEnd)
    .order("consumed_at", { ascending: false });

  if (cantina && cantina !== "todas") {
    query = query.eq("cantina", cantina);
  }

  const { data, error } = await query.limit(5000);
  if (error) throw error;
  return (data ?? []) as MealLog[];
}

export async function getDepartamentos(clientId: string) {
  const { data, error } = await supabaseAdmin
    .from("departamentos")
    .select("id, client_entity_id, nome")
    .eq("client_id", clientId)
    .eq("is_deleted", false);
  if (error) throw error;
  return (data ?? []) as { id: number; client_entity_id: string; nome: string }[];
}

export async function getEmpresas(clientId: string) {
  const { data, error } = await supabaseAdmin
    .from("empresas")
    .select("id, client_entity_id, nome")
    .eq("client_id", clientId)
    .eq("is_deleted", false);
  if (error) throw error;
  return (data ?? []) as { id: number; client_entity_id: string; nome: string }[];
}

export async function getAllEmployeeNames(clientId: string) {
  const { data, error } = await supabaseAdmin
    .from("employees")
    .select("client_entity_id, nome")
    .eq("client_id", clientId);
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const e of data ?? []) map[e.client_entity_id] = e.nome;
  return map;
}

// Retorna as refeicoes do dia de hoje (fuso de Maputo, UTC+2), com filtro
// opcional de cantina. Usado na tela "Refeicoes ao vivo".
export async function getMealLogsToday(clientId: string, cantina?: string) {
  const nowUtc = new Date();
  const maputo = new Date(nowUtc.getTime() + 2 * 60 * 60 * 1000);
  const dateStr = maputo.toISOString().slice(0, 10);
  const dateStart = `${dateStr}T00:00:00`;
  const dateEnd = `${dateStr}T23:59:59.999`;

  let query = supabaseAdmin
    .from("meal_log")
    .select(
      "id, employee_id, meal_type_id, cantina, valor_refeicao, consumed_at, created_at"
    )
    .eq("client_id", clientId)
    .eq("is_deleted", false)
    .gte("consumed_at", dateStart)
    .lte("consumed_at", dateEnd)
    .order("consumed_at", { ascending: false });

  if (cantina && cantina !== "todas") {
    query = query.eq("cantina", cantina);
  }

  const { data, error } = await query.limit(3000);
  if (error) throw error;
  return (data ?? []) as MealLog[];
}