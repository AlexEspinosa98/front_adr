import { httpClient } from "@/lib/http";

type CountItem = {
  value: string;
  count: number;
};

export interface SurveyGroupStats {
  total: number;
  unique_extensionists: number;
  unique_producers: number;
  unique_properties: number;
  workflow_state_counts?: CountItem[];
  states?: {
    unique: number;
    counts: CountItem[];
  };
  cities?: {
    unique: number;
    counts: CountItem[];
  };
  villages?: {
    unique: number;
    counts: CountItem[];
  };
  primary_productive_lines?: CountItem[];
  secondary_productive_lines?: CountItem[];
  top_extensionists?: {
    id: number;
    name: string;
    count: number;
  }[];
}

export interface SurveyStatisticsResponse {
  success: boolean;
  data: {
    surveys: SurveyGroupStats;
    surveys_followup: SurveyGroupStats;
    surveys_final: SurveyGroupStats;
    totals: {
      total_all_types: number;
      unique_extensionists_all_types: number;
    };
  };
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
