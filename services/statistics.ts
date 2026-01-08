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
  const { data } = await httpClient.get<SurveyStatisticsResponse>(
    "/admin/surveys/statistics",
    token
      ? {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      : undefined,
  );
  return data;
};

export const exportSurveyExcel = async ({
  state,
  city,
  token,
  tokenType = "Token",
}: ExportSurveyExcelParams) => {
  const response = await httpClient.get<Blob>("/admin/surveys/export-excel", {
    params: { state, city },
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
