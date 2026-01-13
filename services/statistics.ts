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

export interface SurveyStatisticsResponse {
  success: boolean;
  data: {
    total_visits: SurveyTotals;
    by_department: DepartmentStat[];
    by_city: CityStat[];
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
    total: item.total ?? 0,
  });

  const normalizeCity = (item: Record<string, any>): CityStat => ({
    city: item.city ?? "",
    survey_1: item.survey_1 ?? item.visita_1 ?? 0,
    survey_2: item.survey_2 ?? item.visita_2 ?? 0,
    survey_3: item.survey_3 ?? item.visita_3 ?? 0,
    total: item.total ?? 0,
  });

  return {
    success: data.success,
    data: {
      total_visits: normalizeTotals(data.data?.total_visits),
      by_department: (data.data?.by_department ?? []).map(normalizeDept),
      by_city: (data.data?.by_city ?? []).map(normalizeCity),
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
