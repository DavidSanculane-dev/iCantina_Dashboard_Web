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

// O Supabase/PostgREST limita cada consulta a 1000 linhas por padrao,
// independente do .limit() pedido no client. Esta funcao pagina
// automaticamente em blocos de 1000 ate trazer o conjunto completo.
async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: any; error: unknown }>
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  let from = 0;
  const all: T[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await buildQuery(from, to);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

// ---------- Dashboard ----------

export async function getDashboardSummary1(
  clientId: string,
  dateStart: string,
  dateEnd: string
) {
  type Row = {
    valor_refeicao: number;
    employee_id: string;
    meal_type_id: string;
    cantina: string;
    consumed_at: string;
  };

  const rows = await fetchAllRows<Row>((from, to) =>
    supabaseAdmin
      .from("meal_log")
      .select("valor_refeicao, employee_id, meal_type_id, cantina, consumed_at")
      .eq("client_id", clientId)
      .eq("is_deleted", false)
      .gte("consumed_at", dateStart)
      .lte("consumed_at", dateEnd)
      .range(from, to)
  );
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

export async function getDashboardSummary(
  clientId: string,
  dateStart: string,
  dateEnd: string
) {
  type Row = {
    employee_id: string;
    meal_type_id: string;
    cantina: string;
    valor_refeicao: number;
    consumed_at: string;
  };

  const rows: Row[] = [];
  const PAGE_SIZE = 1000;

  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseAdmin
      .from("meal_log")
      .select(
        "employee_id, meal_type_id, cantina, valor_refeicao, consumed_at"
      )
      .eq("client_id", clientId)
      .eq("is_deleted", false)
      .gte("consumed_at", dateStart)
      .lte("consumed_at", dateEnd)
      .range(
        page * PAGE_SIZE,
        ((page + 1) * PAGE_SIZE) - 1
      );

    if (error) throw error;

    const lote = data ?? [];

    rows.push(...lote);

    if (lote.length < PAGE_SIZE) {
      hasMore = false;
    } else {
      page++;
    }
  }

  const totalRefeicoes = rows.length;

  const colaboradoresUnicos = new Set(
    rows.map((r) => r.employee_id)
  ).size;

  const totalValor = rows.reduce(
    (acc, r) => acc + Number(r.valor_refeicao ?? 0),
    0
  );

  const custoMedio =
    totalRefeicoes > 0
      ? totalValor / totalRefeicoes
      : 0;

  const porDiaMap = new Map<string, number>();

  for (const r of rows) {
    const dia = r.consumed_at.slice(0, 10);

    porDiaMap.set(
      dia,
      (porDiaMap.get(dia) ?? 0) + 1
    );
  }

  const tendencia = Array.from(
    porDiaMap.entries()
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, total]) => ({
      data,
      total,
    }));

  const porTipoMap = new Map<string, number>();

  for (const r of rows) {
    const tipo = String(r.meal_type_id);

    porTipoMap.set(
      tipo,
      (porTipoMap.get(tipo) ?? 0) + 1
    );
  }

  const porCantinaMap = new Map<string, number>();

  for (const r of rows) {
    const cantina = r.cantina || "N/D";

    porCantinaMap.set(
      cantina,
      (porCantinaMap.get(cantina) ?? 0) + 1
    );
  }

  const porCantina = Array.from(
    porCantinaMap.entries()
  ).map(([cantina, total]) => ({
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

// Retorna as refeicoes do dia de hoje (fuso de Maputo, UTC+2), com filtro
// opcional de cantina. Usado na tela "Refeicoes ao vivo".
export async function getMealLogsToday(clientId: string, cantina?: string) {
  const nowUtc = new Date();
  const maputo = new Date(nowUtc.getTime() + 2 * 60 * 60 * 1000);
  const dateStr = maputo.toISOString().slice(0, 10);
  const dateStart = `${dateStr}T00:00:00`;
  const dateEnd = `${dateStr}T23:59:59.999`;

  const rows = await fetchAllRows<MealLog>((from, to) => {
    let query = supabaseAdmin
      .from("meal_log")
      .select(
        "id, employee_id, meal_type_id, cantina, valor_refeicao, consumed_at, created_at"
      )
      .eq("client_id", clientId)
      .eq("is_deleted", false)
      .gte("consumed_at", dateStart)
      .lte("consumed_at", dateEnd)
      .order("consumed_at", { ascending: false })
      .range(from, to);

    if (cantina && cantina !== "todas") {
      query = query.eq("cantina", cantina);
    }

    return query;
  });

  return rows;
}

// ---------- Colaboradores ----------

export async function getEmployees(clientId: string, q?: string) {
  const employees = [];
  let paginaEmployees = 0;
  let temMaisEmployees = true;
  const tamanhoPaginaEmployees = 1000;

  // Ciclo exaustivo para contornar o limite de 1000 linhas do Supabase
  while (temMaisEmployees) {
    let query = supabaseAdmin
      .from("employees")
      .select("client_entity_id, codigo, nome, departamento_client_id, empresa_client_id, id, ativo")
      .eq("client_id", clientId)
      .eq("is_deleted", false);

    // Se o utilizador digitou algo na barra de pesquisa, filtra direto no banco
    
    if (q && q.trim() !== "") {
        const filtro = q.trim();
        query = query.or(`nome.ilike.%${filtro}%,codigo.ilike.%${filtro}%`);
    }

    const { data: lote, error } = await query
      .order("nome", { ascending: true })
      .range(
        paginaEmployees * tamanhoPaginaEmployees, 
        (paginaEmployees + 1) * tamanhoPaginaEmployees - 1
      );

    if (error) {
      console.error("Erro ao carregar lote de colaboradores:", error.message);
      throw error;
    }

    if (!lote || lote.length === 0) {
      temMaisEmployees = false;
    } else {
      employees.push(...lote);
      
      // Se o lote veio menor que 1000, significa que chegámos ao fim dos registos
      if (lote.length < tamanhoPaginaEmployees) {
        temMaisEmployees = false;
      } else {
        paginaEmployees++;
      }
    }
  }

  return employees;
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
  return (data ?? []) as { id: number; client_entity_id: string; nome: string }[];
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

// Consulta leve (so a coluna "cantina") para popular o dropdown de filtro
// sem precisar carregar todas as refeicoes. Deduplica em memoria para
// evitar nomes repetidos vindos da sincronizacao.
export async function getDistinctCantinasFromMealLog(clientId: string) {
  const rows = await fetchAllRows<{ cantina: string }>((from, to) =>
    supabaseAdmin
      .from("meal_log")
      .select("cantina")
      .eq("client_id", clientId)
      .eq("is_deleted", false)
      .range(from, to)
  );
  return Array.from(new Set(rows.map((r) => r.cantina).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}


export async function getMealLogsForReport(
  clientId: string,
  dateStart: string,
  dateEnd: string,
  cantina?: string,
  empresaFiltro?: string // Novo parâmetro adicionado para o filtro cruzado
) {
  const inicioDia = new Date(dateStart);
  inicioDia.setHours(0, 0, 0, 0);

  const fimDia = new Date(dateEnd);
  fimDia.setHours(23, 59, 59, 999);

  // --- PASSO 1: Se houver filtro de empresa, descobrimos quais colaboradores pertencem a ela ---
  let idsColaboradoresFiltrados: string[] | null = null;

  if (empresaFiltro && empresaFiltro !== "todas") {
    const { data: employeesDaEmpresa, error: errEmp } = await supabaseAdmin
      .from("employees")
      .select("client_entity_id")
      .eq("client_id", clientId)
      .eq("empresa_client_id", empresaFiltro)
      .eq("is_deleted", false);

    if (errEmp) throw errEmp;
    
    // Mapeia os IDs válidos. Se a empresa não tiver ninguém, criamos um array com uma string vazia para a query retornar zero registros de forma segura
    idsColaboradoresFiltrados = employeesDaEmpresa && employeesDaEmpresa.length > 0
      ? employeesDaEmpresa.map((e) => e.client_entity_id)
      : ["nenhum_id_encontrado_vazio"];
  }

  const meals = [];
  let paginaMeals = 0;
  let temMaisMeals = true;
  const tamanhoPaginaMeals = 1000;

  // --- PASSO 2: Loop exaustivo de varrimento com aplicação de filtros combinados ---
  while (temMaisMeals) {
    let query = supabaseAdmin
      .from("meal_log")
      .select("id, employee_id, meal_type_id, cantina, consumed_at")
      .eq("is_deleted", false)
      .eq("client_id", clientId)
      .gte("consumed_at", inicioDia.toISOString())
      .lte("consumed_at", fimDia.toISOString());

    // 1. Aplicação segura do filtro de Cantina (Tratando caixa alta/baixa do formulário)
    if (cantina && cantina.toLowerCase() !== "todas") {
      query = query.eq("cantina", cantina.trim());
    }

    // 2. Aplicação do filtro de Empresa restrito via lista de IDs do Passo 1
    if (idsColaboradoresFiltrados !== null) {
      query = query.in("employee_id", idsColaboradoresFiltrados);
    }

    const { data: lote, error } = await query
      .order("consumed_at", { ascending: false })
      .range(paginaMeals * tamanhoPaginaMeals, (paginaMeals + 1) * tamanhoPaginaMeals - 1);

    if (error) throw error;

    if (!lote || lote.length === 0) {
      temMaisMeals = false;
    } else {
      meals.push(...lote);
      if (lote.length < tamanhoPaginaMeals) {
        temMaisMeals = false;
      } else {
        paginaMeals++;
      }
    }
  }

  return meals;
}

