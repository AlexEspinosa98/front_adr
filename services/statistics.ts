import { httpClient } from "@/lib/http";

export type SurveyTotals = {
  survey_1: number;
  survey_2: number;
  survey_3: number;
  all_types: number;
};

export type DepartmentStat = {
  state: string;
  survey_1: number;
  survey_2: number;
  survey_3: number;
  total: number;
};

export type CityStat = {
  city: string;
  survey_1: number;
  survey_2: number;
  survey_3: number;
  total: number;
};

export type PropertiesStat = {
  magdalena: number;
  atlantico: number;
  total_magdalena_atlantico: number;
};

export type ExtensionistsStat = {
  unique_total: number;
};

export type PieDepartmentEntry = {
  state: string;
  visit_type: "visita_1" | "visita_2" | "visita_3";
  count: number;
  population_base?: number;
  percent?: number;
};

export type SubregionStat = {
  department: string;
  subregion: string;
  survey_1: number;
  survey_2: number;
  survey_3: number;
  total: number;
};

export type WorkflowStates = {
  pending: number;
  accepted: number;
  rejected: number;
};

export type WorkflowStatesByDepartment = Record<string, WorkflowStates>;

export interface SurveyStatisticsResponse {
  success: boolean;
  data: {
    total_visits: SurveyTotals;
    by_department: DepartmentStat[];
    by_city: CityStat[];
    bar_by_department?: DepartmentStat[];
    pie_by_department?: PieDepartmentEntry[];
    subregions?: SubregionStat[];
    workflow_states?: WorkflowStates;
    workflow_states_by_department?: WorkflowStatesByDepartment;
    unique_producers_survey_1?: number;
    properties: PropertiesStat;
    extensionists: ExtensionistsStat;
  };
}

export type SummarySurveyBucket = {
  count: number;
  latest_created_at?: string | null;
  states?: Record<string, number>;
};

export type CitySurveySummary = {
  properties_count: number;
  summary: {
    survey_1?: SummarySurveyBucket;
    survey_2?: SummarySurveyBucket;
    survey_3?: SummarySurveyBucket;
  };
  states_summary?: {
    survey_1?: Record<string, number>;
    survey_2?: Record<string, number>;
    survey_3?: Record<string, number>;
  };
  properties?: Array<{
    property?: {
      id?: number;
      name?: string;
      city?: string;
      state?: string;
    };
    survey_1?: SummarySurveyBucket;
    survey_2?: SummarySurveyBucket;
    survey_3?: SummarySurveyBucket;
  }>;
};

export interface SurveySummaryByCityResponse {
  success: boolean;
  data: CitySurveySummary;
}

export interface ExportSurveyExcelParams {
  state?: string;
  city?: string;
  token?: string;
  tokenType?: string;
}

export const fetchSurveyStatistics = async (
  token?: string,
): Promise<SurveyStatisticsResponse> => {
  const { data } = await httpClient.get<
    SurveyStatisticsResponse & {
      data: {
        total_visits?: Record<string, any>;
        by_department?: Array<Record<string, any>>;
        by_city?: Array<Record<string, any>>;
        visit_summary_by_department?: Array<Record<string, any>>;
        bar_chart_by_department?: Array<Record<string, any>>;
        pie_chart_by_department?: Array<Record<string, any>>;
        subregions?: Record<string, Record<string, any>>;
        workflow_states?: Record<string, number>;
        workflow_states_by_department?: Record<string, Record<string, number>>;
        unique_producers_survey_1?: number;
      };
    }
  >(
    "/admin/surveys/statistics",
    token
      ? {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      : undefined,
  );
  const normalizeTotals = (totals: Record<string, any> | undefined): SurveyTotals => ({
    survey_1: totals?.survey_1 ?? totals?.visita_1 ?? 0,
    survey_2: totals?.survey_2 ?? totals?.visita_2 ?? 0,
    survey_3: totals?.survey_3 ?? totals?.visita_3 ?? 0,
    all_types: totals?.all_types ?? totals?.total ?? 0,
  });

  const normalizeDept = (item: Record<string, any>): DepartmentStat => ({
    state: item.state ?? "",
    survey_1: item.survey_1 ?? item.visita_1 ?? 0,
    survey_2: item.survey_2 ?? item.visita_2 ?? 0,
    survey_3: item.survey_3 ?? item.visita_3 ?? 0,
    total:
      item.total ??
      (item.survey_1 ?? item.visita_1 ?? 0) +
        (item.survey_2 ?? item.visita_2 ?? 0) +
        (item.survey_3 ?? item.visita_3 ?? 0),
  });

  const normalizeCity = (item: Record<string, any>): CityStat => ({
    city: item.city ?? "",
    survey_1: item.survey_1 ?? item.visita_1 ?? 0,
    survey_2: item.survey_2 ?? item.visita_2 ?? 0,
    survey_3: item.survey_3 ?? item.visita_3 ?? 0,
    total: item.total ?? 0,
  });

  const normalizeStateLabel = (state?: string) => {
    const trimmed = (state ?? "").trim();
    if (/^atlantico$/i.test(trimmed) || /^atlántico$/i.test(trimmed)) return "Atlántico";
    if (/^magdalena$/i.test(trimmed)) return "Magdalena";
    return trimmed;
  };

  const mergeDepartments = (items: Array<Record<string, any>>) => {
    const merged: Record<string, DepartmentStat> = {};
    items.forEach((raw) => {
      const state = normalizeStateLabel(raw.state);
      if (!state || /^total$/i.test(state)) return;
      if (/^cundinamarca$/i.test(state)) return; // descartar
      const normalized = normalizeDept({ ...raw, state });
      if (!merged[state]) {
        merged[state] = { ...normalized };
      } else {
        merged[state].survey_1 += normalized.survey_1;
        merged[state].survey_2 += normalized.survey_2;
        merged[state].survey_3 += normalized.survey_3;
        merged[state].total += normalized.total;
      }
    });
    const list = Object.values(merged);
    const totalRow = list.reduce<DepartmentStat>(
      (acc, item) => ({
        state: "Total",
        survey_1: acc.survey_1 + item.survey_1,
        survey_2: acc.survey_2 + item.survey_2,
        survey_3: acc.survey_3 + item.survey_3,
        total: acc.total + item.total,
      }),
      { state: "Total", survey_1: 0, survey_2: 0, survey_3: 0, total: 0 },
    );
    return { list, totalRow };
  };

  const normalizePieEntry = (item: Record<string, any>): PieDepartmentEntry | null => {
    const state = normalizeStateLabel(item.state);
    if (!state || /^total$/i.test(state)) return null;
    if (/^cundinamarca$/i.test(state)) return null;
    const visit_type = (item.visit_type ?? item.type ?? "").toLowerCase();
    if (!visit_type || !["visita_1", "visita_2", "visita_3"].includes(visit_type)) return null;
    const count = Number(item.count ?? 0) || 0;
    const population_base = Number(item.population_base ?? 0) || undefined;
    const percent = item.percent ?? (population_base ? (count / population_base) * 100 : undefined);
    return { state, visit_type: visit_type as PieDepartmentEntry["visit_type"], count, population_base, percent };
  };

  const mergePieEntries = (entries: PieDepartmentEntry[]): PieDepartmentEntry[] => {
    const BASE_POP: Record<string, number> = { Magdalena: 2360, "Atlántico": 1100 };
    const merged: Record<string, PieDepartmentEntry> = {};
    entries.forEach((entry) => {
      const key = `${entry.state}-${entry.visit_type}`;
      if (!merged[key]) {
        merged[key] = { ...entry };
      } else {
        merged[key].count += entry.count;
        merged[key].population_base = merged[key].population_base ?? entry.population_base;
      }
      const base = merged[key].population_base ?? BASE_POP[entry.state];
      merged[key].population_base = base;
      if (base) {
        merged[key].percent = (merged[key].count / base) * 100;
      }
    });
    return Object.values(merged);
  };

  const SUBREGION_BY_CITY: Record<string, Record<string, string>> = {
    "Magdalena": {
      "SANTA MARTA": "NORTE",
      "CIENAGA": "NORTE",
      "CIÉNAGA": "NORTE",
      "ZONA BANANERA": "NORTE",
      "ARACATACA": "NORTE",
      "FUNDACION": "NORTE",
      "FUNDACIÓN": "NORTE",
      "ARIGUANI": "CENTRO",
      "ARIGUANÍ": "CENTRO",
      "SABANAS DE SAN ANGEL": "CENTRO",
      "SABANA DE SAN ANGEL": "CENTRO",
      "SABANA DE SAN ÁNGEL": "CENTRO",
      "NUEVA GRANADA": "CENTRO",
      "CHIBOLO": "CENTRO",
      "TENERIFE": "CENTRO",
      "PLATO": "CENTRO",
      "CERRO SAN ANTONIO": "RÍO",
      "CONCORDIA": "RÍO",
      "PEDRAZA": "RÍO",
      "SALAMINA": "RÍO",
      "EL PIÑON": "RÍO",
      "EL PIÑÓN": "RÍO",
      "PIVIJAY": "RÍO",
      "ZAPAYAN": "RÍO",
      "ZAPAYÁN": "RÍO",
      "SAN ZENON": "SUR",
      "SAN ZENÓN": "SUR",
      "GUAMAL": "SUR",
      "EL BANCO": "SUR",
    },
    "Atlántico": {
      "MALAMBO": "METROPOLITANA",
      "TUBARA": "COSTERA",
      "TUBARÁ": "COSTERA",
      "PALMAR DE VARELA": "ORIENTAL",
      "PONEDERA": "ORIENTAL",
      "BARANOA": "CENTRO",
      "SABANALARGA": "CENTRO",
      "LURUACO": "CENTRO",
      "MANATI": "SUR",
      "MANATÍ": "SUR",
      "SANTA LUCIA": "SUR",
      "SANTA LUCÍA": "SUR",
      "SUAN": "SUR",
    },
  };

  const normalizeSubregions = (raw?: Record<string, Record<string, any>>): SubregionStat[] => {
    if (!raw) return [];
    const aggregated: Record<string, SubregionStat> = {};
    const fromMunicipalities: Record<string, SubregionStat> = {};
    const normalizeUpper = (value?: string) => (value ?? "").normalize("NFC").trim().toUpperCase();
    Object.entries(raw).forEach(([dept, subregions]) => {
      const department = normalizeStateLabel(dept);
      if (!department || /^cundinamarca$/i.test(department)) return;
      Object.entries(subregions ?? {}).forEach(([subregionName, values]) => {
        const keyUpper = normalizeUpper(subregionName);
        const mapping = SUBREGION_BY_CITY[department] ?? {};
        const mapped = mapping[keyUpper];
        const knownSubregion = ["SUR", "CENTRO", "NORTE", "RÍO", "RIO", "METROPOLITANA", "COSTERA", "ORIENTAL"].includes(keyUpper)
          ? (keyUpper === "RIO" ? "RÍO" : subregionName.trim())
          : undefined;
        const subregionLabel = mapped ?? knownSubregion ?? subregionName.trim();
        const survey_1 = values?.survey_1 ?? values?.visita_1 ?? 0;
        const survey_2 = values?.survey_2 ?? values?.visita_2 ?? 0;
        const survey_3 = values?.survey_3 ?? values?.visita_3 ?? 0;
        const total = values?.total ?? survey_1 + survey_2 + survey_3;
        const accKey = `${department}-${subregionLabel}`;
        const bucket = knownSubregion ? aggregated : fromMunicipalities;
        if (!bucket[accKey]) {
          bucket[accKey] = { department, subregion: subregionLabel, survey_1: 0, survey_2: 0, survey_3: 0, total: 0 };
        }
        bucket[accKey].survey_1 += survey_1;
        bucket[accKey].survey_2 += survey_2;
        bucket[accKey].survey_3 += survey_3;
        bucket[accKey].total += total;
      });
    });
    // Prefer aggregated totals if present; otherwise use sums by municipio.
    const result: Record<string, SubregionStat> = { ...aggregated };
    Object.entries(fromMunicipalities).forEach(([key, value]) => {
      if (!result[key]) {
        result[key] = value;
      }
    });
    return Object.values(result);
  };

  const normalizeWorkflowByDepartment = (
    raw?: Record<string, Record<string, number>>,
  ): WorkflowStatesByDepartment => {
    if (!raw) return {};
    const merged: WorkflowStatesByDepartment = {};
    Object.entries(raw).forEach(([stateRaw, values]) => {
      const state = normalizeStateLabel(stateRaw);
      if (!state || /^total$/i.test(state) || /^cundinamarca$/i.test(state)) return;
      if (!merged[state]) {
        merged[state] = { pending: 0, accepted: 0, rejected: 0 };
      }
      merged[state].pending += values?.pending ?? 0;
      merged[state].accepted += values?.accepted ?? 0;
      merged[state].rejected += values?.rejected ?? 0;
    });
    return merged;
  };

  return {
    success: data.success,
    data: {
      total_visits: normalizeTotals(data.data?.total_visits),
      ...(() => {
        const sourceDepts =
          data.data?.visit_summary_by_department ??
          data.data?.bar_chart_by_department ??
          data.data?.by_department ??
          [];
        const { list, totalRow } = mergeDepartments(sourceDepts);
        return {
          by_department: [...list, totalRow],
          bar_by_department: list,
        };
      })(),
      by_city: (data.data?.by_city ?? []).map(normalizeCity),
      pie_by_department: mergePieEntries(
        ((data.data?.pie_chart_by_department ?? [])
          .map(normalizePieEntry)
          .filter(Boolean) as PieDepartmentEntry[])
      ),
      subregions: normalizeSubregions(data.data?.subregions),
      workflow_states: {
        pending: data.data?.workflow_states?.pending ?? 0,
        accepted: data.data?.workflow_states?.accepted ?? 0,
        rejected: data.data?.workflow_states?.rejected ?? 0,
      },
      workflow_states_by_department: normalizeWorkflowByDepartment(
        data.data?.workflow_states_by_department,
      ),
      unique_producers_survey_1: data.data?.unique_producers_survey_1,
      properties: data.data?.properties ?? { magdalena: 0, atlantico: 0, total_magdalena_atlantico: 0 },
      extensionists: data.data?.extensionists ?? { unique_total: 0 },
    },
  };
};

export const exportSurveyExcel = async ({
  state,
  city,
  token,
  tokenType = "Token",
}: ExportSurveyExcelParams) => {
  // Normalize to NFC so tildes/acentos are encoded consistently when hitting the API.
  const normalizedState = state?.normalize("NFC");
  const normalizedCity = city?.normalize("NFC");

  const response = await httpClient.get<Blob>("/admin/surveys/export-excel", {
    params: {
      ...(normalizedState ? { state: normalizedState } : {}),
      ...(normalizedCity ? { city: normalizedCity } : {}),
    },
    responseType: "blob",
    headers:
      token && tokenType
        ? {
            Authorization: `${tokenType} ${token}`,
          }
        : undefined,
  });
  return response.data;
};

export const fetchSurveySummaryByCity = async (
  city: string,
  token?: string,
  tokenType: string = "Token",
): Promise<SurveySummaryByCityResponse> => {
  const { data } = await httpClient.get<SurveySummaryByCityResponse>(
    `/admin/surveys/summary-by-city`,
    {
      params: { city },
      headers:
        token && tokenType
          ? {
              Authorization: `${tokenType} ${token}`,
            }
          : undefined,
    },
  );
  return data;
};
