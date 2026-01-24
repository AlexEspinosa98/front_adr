import { httpClient } from "@/lib/http";

const authHeaders = (token?: string, tokenType: string = "Token") =>
  token
    ? {
        Authorization: `${tokenType} ${token}`,
      }
    : undefined;

type RawExtensionistProperty = {
  id?: number;
  property_id?: number;
  name?: string;
  property_name?: string;
  city?: string;
  municipality?: string;
  address?: string;
  product?: string;
  state?: string;
  village?: string;
  linea_productive_primary?: string;
  linea_productive_secondary?: string;
  area_in_production?: number | string | null;
  latitude?: string | number;
  longitude?: string | number;
  created_at?: string;
  surveys_state_summary?: SurveysStateSummary;
  survey_summary?: Record<string, unknown>;
  asnm?: string | number | null;
};

type RawPropertySurvey = {
  id?: number;
  survey_id?: number;
  surveyTypeId?: number;
  survey_type_id?: number;
  surveyType?: string;
  survey_type?: string;
  type?: string;
  status?: string;
  pdfUrl?: string;
  pdf_url?: string;
  createdAt?: string;
  created_at?: string;
};

interface ExtensionistPropertiesApiResponse {
  data: RawExtensionistProperty[] | { properties?: RawExtensionistProperty[]; surveys_state_summary?: SurveysStateSummary };
  message?: string;
  status?: string;
  success?: boolean;
}

interface PropertySurveysApiResponse {
  data: RawPropertySurvey[];
  message: string;
  status?: string;
}

export interface ExtensionistProperty {
  id: number;
  name: string;
  city?: string;
  municipality?: string;
  address?: string;
  product?: string;
  state?: string;
  village?: string;
  primaryLine?: string;
  secondaryLine?: string;
  areaInProduction?: string;
  latitude?: string;
  longitude?: string;
  createdAt?: string;
  asnm?: string | number | null;
  surveysStateSummary?: SurveysStateSummary;
  surveySummary?: Record<string, unknown>;
}

export interface ExtensionistPropertiesResponse {
  data: ExtensionistProperty[];
  message: string;
  status?: string;
  summary?: SurveysStateSummary;
}

export interface PropertySurvey {
  id: number;
  surveyTypeId: number;
  surveyType: string;
  status?: string;
  pdfUrl?: string;
  createdAt?: string;
}

export interface PropertySurveysResponse {
  data: PropertySurvey[];
  message: string;
  status?: string;
}

export type ExtensionistSummaryProperty = {
  id: number;
  name: string;
  city?: string;
  state?: string;
  municipality?: string;
  village?: string;
  latitude?: string;
  longitude?: string;
  asnm?: string | number | null;
  linea_productive_primary?: string;
  linea_productive_secondary?: string;
  area_in_production?: number | string | null;
  surveys?: {
    type_1?: {
      count?: number;
      states?: string[];
      latest_visit?: string | null;
      file_pdf?: string | null;
    };
    type_2?: {
      count?: number;
      states?: string[];
      latest_visit?: string | null;
      file_pdf?: string | null;
    };
    type_3?: {
      count?: number;
      states?: string[];
      latest_visit?: string | null;
      file_pdf?: string | null;
    };
  };
};

export interface ExtensionistSummaryResponse {
  success?: boolean;
  data?: {
    extensionist?: Record<string, unknown>;
    states_summary?: SurveysStateSummary;
    properties?: ExtensionistSummaryProperty[];
  };
}

export interface ExtensionistProducerProperty {
  id: number;
  name: string;
  city?: string;
  state?: string;
  village?: string;
}

export interface ExtensionistProducerSurveySummary {
  count?: number;
  states?: string[];
  latest_visit?: string | null;
  file_pdf?: string | null;
}

export interface ExtensionistProducer {
  id: number;
  name: string;
  phone?: string;
  type_id?: string;
  identification?: string;
  properties?: ExtensionistProducerProperty[];
  surveys?: {
    type_1?: ExtensionistProducerSurveySummary;
    type_2?: ExtensionistProducerSurveySummary;
    type_3?: ExtensionistProducerSurveySummary;
  };
  surveysStateSummary?: SurveysStateSummary;
  surveySummary?: ExtensionistProducer["surveys"];
}

export interface ExtensionistProducersResponse {
  success?: boolean;
  data?: {
    extensionist?: Record<string, unknown>;
    surveys_state_summary?: SurveysStateSummary;
    states_summary?: SurveysStateSummary;
    producers?: ExtensionistProducer[];
  };
}

export const exportExtensionistExcel = async (
  extensionistId: number,
  token?: string,
  tokenType: string = "Token",
) => {
  const response = await httpClient.get<Blob>(
    `/admin/extensionists/${extensionistId}/export-excel/`,
    {
      responseType: "blob",
      headers: authHeaders(token, tokenType),
    },
  );
  return response.data;
};

export interface SurveyDetail {
  id?: number;
  surveyTypeId?: number;
  property?: Record<string, unknown>;
  producer?: Record<string, unknown>;
  extensionist?: Record<string, unknown>;
  recommendations?: string;
  status?: string;
  pdfUrl?: string;
  [key: string]: unknown;
}

export interface SurveyDetailResponse {
  data: SurveyDetail;
  message: string;
  status?: string;
}

export interface SurveysStateSummaryBucket {
  pending?: number;
  accepted?: number;
  rejected?: number;
  count?: number;
}

export interface SurveysStateSummary {
  survey_1?: SurveysStateSummaryBucket;
  survey_2?: SurveysStateSummaryBucket;
  survey_3?: SurveysStateSummaryBucket;
  total?: SurveysStateSummaryBucket;
  totals?: SurveysStateSummaryBucket;
}

export type SurveyStateValue = "accepted" | "rejected" | "pending";

export interface UpdateSurveyStateInput {
  surveyTypeId: number;
  surveyId: number;
  state: SurveyStateValue;
  stateReason?: string;
  perfil?: string;
  token?: string;
  tokenType?: string;
  csrfToken?: string;
}

export interface UpdateSurveyStateResponse {
  success?: boolean;
  message?: string;
  data?: SurveyDetail;
}

export interface BasicUpdateSurveyInput {
  surveyTypeId: number;
  surveyId: number;
  surveyData?: Record<string, unknown>;
  producterData?: Record<string, unknown>;
  propertyData?: Record<string, unknown>;
  files?: {
    photo_user?: File;
    photo_interaction?: File;
    photo_panorama?: File;
    phono_extra_1?: File;
    file_pdf?: File;
  };
  token?: string;
  tokenType?: string;
}

export interface BasicUpdateSurveyResponse {
  success?: boolean;
  message?: string;
  data?: SurveyDetail;
}

export interface PropertySurveyVisit {
  id?: number;
  extensionist_id?: number;
  user_producer_id?: number;
  property_id?: number;
  extensionist?: Record<string, unknown>;
  user_producer?: Record<string, unknown>;
  property?: Record<string, unknown>;
  classification_user?: {
    total?: number;
    detail?: Record<string, number>;
  };
  medition_focalization?: Record<
    string,
    { score?: number; obervation?: string | null }
  >;
  objetive_accompaniment?: string;
  initial_diagnosis?: string;
  recommendations_commitments?: string;
  observations_visited?: string;
  photo_user?: string;
  photo_interaction?: string;
  photo_panorama?: string;
  phono_extra_1?: string;
  file_pdf?: string | null;
  date_acompanamiento?: string;
  hour_acompanamiento?: string;
  visit_date?: string;
  date_hour_end?: string;
  origen_register?: string;
  approval_profile?: string;
  state?: string;
  state_reason?: string | null;
  state_updated_by?: string | null;
  state_updated_at?: string | null;
  name_acompanamiento?: string;
  attended_by?: string;
  attendee_role?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface PropertySurveyVisitResponse {
  success?: boolean;
  message?: string;
  data?: {
    property?: Record<string, unknown>;
    producer?: Record<string, unknown>;
    surveys?: PropertySurveyVisit[];
  };
}

export const fetchExtensionistProperties = async (
  extensionistId: number,
  token?: string,
  tokenType: string = "Token",
): Promise<ExtensionistPropertiesResponse> => {
  const { data } = await httpClient.get<ExtensionistPropertiesApiResponse>(
    `/admin/extensionists/${extensionistId}/product-properties`,
    {
      headers: authHeaders(token, tokenType),
    },
  );

  const rawData = data.data;
  const rawList = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.properties)
      ? rawData.properties ?? []
      : [];
  const summary = !Array.isArray(rawData) ? rawData?.surveys_state_summary : undefined;

  return {
    message: data.message ?? "",
    status: data.status,
    summary,
    data: rawList.map((property) => ({
      id: property.id ?? property.property_id ?? 0,
      name:
        property.name ??
        property.property_name ??
        "Propiedad sin nombre asignado",
      city: property.city ?? property.municipality,
      municipality: property.municipality ?? property.city,
      address: property.address,
      product: property.product,
      state: property.state,
      village: property.village,
      primaryLine: property.linea_productive_primary,
      secondaryLine: property.linea_productive_secondary,
      areaInProduction:
        property.area_in_production !== undefined && property.area_in_production !== null
          ? String(property.area_in_production)
          : undefined,
      latitude: property.latitude !== undefined ? String(property.latitude) : undefined,
      longitude: property.longitude !== undefined ? String(property.longitude) : undefined,
      createdAt: property.created_at,
      surveysStateSummary: property.surveys_state_summary,
      surveySummary: property.survey_summary,
      asnm: property.asnm,
    })),
  };
};

export const fetchExtensionistSummary = async (
  extensionistId: number,
  token?: string,
  tokenType: string = "Token",
): Promise<ExtensionistSummaryResponse> => {
  const { data } = await httpClient.get<ExtensionistSummaryResponse>(
    `/admin/extensionists/${extensionistId}/summary/`,
    {
      headers: authHeaders(token, tokenType),
    },
  );
  return data;
};

export const fetchExtensionistProducers = async (
  extensionistId: number,
  token?: string,
  tokenType: string = "Token",
): Promise<ExtensionistProducersResponse> => {
  const { data } = await httpClient.get<ExtensionistProducersResponse>(
    `/admin/extensionists/${extensionistId}/producers`,
    {
      headers: authHeaders(token, tokenType),
    },
  );

  const normalizeBucket = (bucket?: SurveysStateSummaryBucket): SurveysStateSummaryBucket => {
    const pending = bucket?.pending ?? 0;
    const accepted = bucket?.accepted ?? 0;
    const rejected = bucket?.rejected ?? 0;
    const count = bucket?.count ?? pending + accepted + rejected;
    return { pending, accepted, rejected, count };
  };

  const normalizeSummary = (summary?: SurveysStateSummary): SurveysStateSummary => {
    const keys: Array<keyof SurveysStateSummary> = ["survey_1", "survey_2", "survey_3", "total", "totals"];
    return keys.reduce<SurveysStateSummary>((acc, key) => {
      if (summary?.[key]) {
        acc[key] = normalizeBucket(summary[key]);
      }
      return acc;
    }, {});
  };

  const countStates = (states?: string[]) =>
    (states ?? []).reduce(
      (acc, state) => {
        if (state === "pending") acc.pending += 1;
        if (state === "accepted") acc.accepted += 1;
        if (state === "rejected") acc.rejected += 1;
        return acc;
      },
      { pending: 0, accepted: 0, rejected: 0 },
    );

  const producers = (data.data?.producers ?? []).map((producer) => {
    const typed = producer as ExtensionistProducer & Record<string, any>;
    const typeCounts = (key: "type_1" | "type_2" | "type_3") => {
      const rawStates = typed.surveys?.[key]?.states;
      const counted = countStates(rawStates);
      const count =
        typed.surveys?.[key]?.count ??
        rawStates?.length ??
        counted.pending + counted.accepted + counted.rejected;
      return normalizeBucket({
        pending: counted.pending,
        accepted: counted.accepted,
        rejected: counted.rejected,
        count,
      });
    };

    return {
      id: typed.id ?? (typed as any).producer_id ?? 0,
      name: typed.name ?? "Productor sin nombre",
      phone: typed.phone ?? (typed as any).number_phone ?? undefined,
      type_id: typed.type_id,
      identification: typed.identification,
      properties: (typed.properties ?? []).map((prop: any) => ({
        id: prop.id ?? prop.property_id ?? 0,
        name: prop.name ?? prop.property_name ?? "Predio sin nombre",
        city: prop.city ?? prop.municipality,
        state: prop.state,
        village: prop.village,
      })),
      surveys: typed.surveys,
      surveysStateSummary: {
        survey_1: typeCounts("type_1"),
        survey_2: typeCounts("type_2"),
        survey_3: typeCounts("type_3"),
      },
      surveySummary: typed.surveys,
    } as ExtensionistProducer;
  });

  const summary = normalizeSummary(
    data.data?.surveys_state_summary ?? data.data?.states_summary,
  );

  return {
    success: data.success,
    data: {
      extensionist: data.data?.extensionist,
      surveys_state_summary: summary,
      states_summary: summary,
      producers,
    },
  };
};

export const fetchProducerSurveyVisit = async (
  producerId: number,
  surveyTypeId: number,
  token?: string,
  tokenType: string = "Token",
): Promise<PropertySurveyVisitResponse> => {
  const { data } = await httpClient.get<PropertySurveyVisitResponse>(
    `/admin/producers/${producerId}/surveys/${surveyTypeId}`,
    {
      headers: authHeaders(token, tokenType),
    },
  );
  const rawProperty =
    (data.data as any)?.property ??
    (Array.isArray((data.data as any)?.surveys) ? (data.data as any).surveys?.[0]?.property : undefined) ??
    {};
  const mappedProperty =
    rawProperty && Object.keys(rawProperty).length > 0
      ? {
          ...rawProperty,
          id: rawProperty.id ?? rawProperty.property_id,
          name: rawProperty.name ?? rawProperty.property_name,
          city: rawProperty.city,
          municipality: rawProperty.city ?? rawProperty.municipality,
          state: rawProperty.state,
          village: rawProperty.village,
          primaryLine: rawProperty.linea_productive_primary,
          secondaryLine: rawProperty.linea_productive_secondary,
          linea_productive_primary: rawProperty.linea_productive_primary,
          linea_productive_secondary: rawProperty.linea_productive_secondary,
          areaInProduction:
            rawProperty.area_in_production !== undefined && rawProperty.area_in_production !== null
              ? String(rawProperty.area_in_production)
              : undefined,
          area_in_production: rawProperty.area_in_production,
          latitude:
            rawProperty.latitude !== undefined && rawProperty.latitude !== null
              ? String(rawProperty.latitude)
              : undefined,
          longitude:
            rawProperty.longitude !== undefined && rawProperty.longitude !== null
              ? String(rawProperty.longitude)
              : undefined,
          asnm: rawProperty.asnm,
        }
      : undefined;

  const rawProducer =
    (data.data as any)?.producer ??
    (data.data as any)?.user_producer ??
    (Array.isArray((data.data as any)?.surveys) ? (data.data as any).surveys?.[0]?.user_producer : undefined);
  const mappedProducer =
    rawProducer && Object.keys(rawProducer).length > 0
      ? {
          ...rawProducer,
          name: rawProducer.name,
          type_id: rawProducer.type_id,
          identification: rawProducer.identification,
          number_phone: rawProducer.number_phone ?? rawProducer.phone,
        }
      : undefined;

  const surveys =
    (data.data as any)?.surveys?.map((survey: any) => {
      const normalizedVisitDate =
        survey.visit_date ??
        survey.date_hour_end ??
        survey.date_acompanamiento ??
        null;
      return {
        ...survey,
        visit_date: normalizedVisitDate,
        property: mappedProperty ?? survey.property,
        user_producer: mappedProducer ?? survey.user_producer,
      };
    }) ?? data.data?.surveys ?? [];

  return {
    ...data,
    data: {
      property: mappedProperty,
      producer: mappedProducer,
      surveys,
    },
  };
};

export const fetchPropertySurveys = async (
  propertyId: number,
  token?: string,
  tokenType: string = "Token",
): Promise<PropertySurveysResponse> => {
  const { data } = await httpClient.get<PropertySurveysApiResponse>(
    `/admin/properties/${propertyId}/surveys`,
    {
      headers: authHeaders(token, tokenType),
    },
  );

  return {
    ...data,
    data: data.data.map((survey) => ({
      id: survey.id ?? survey.survey_id ?? 0,
      surveyTypeId:
        survey.surveyTypeId ?? survey.survey_type_id ?? survey.survey_id ?? 0,
      surveyType:
        survey.surveyType ??
        survey.survey_type ??
        survey.type ??
        "Tipo de encuesta sin nombre",
      status: survey.status,
      pdfUrl: survey.pdfUrl ?? survey.pdf_url,
      createdAt: survey.createdAt ?? survey.created_at,
    })),
  };
};

export const fetchSurveyDetail = async (
  surveyTypeId: number,
  surveyId: number,
  token?: string,
  tokenType: string = "Token",
): Promise<SurveyDetailResponse> => {
  const { data } = await httpClient.get<SurveyDetailResponse>(
    `/admin/surveys/${surveyTypeId}/${surveyId}`,
    {
      headers: authHeaders(token, tokenType),
    },
  );
  return data;
};

export const downloadSurveyPdf = async (
  surveyTypeId: number,
  surveyId: number,
  token?: string,
) => {
  const response = await httpClient.get<Blob>(
    `/admin/surveys/${surveyTypeId}/${surveyId}/pdf`,
    {
      headers: authHeaders(token),
      responseType: "blob",
    },
  );
  return response.data;
};

export const basicUpdateSurvey = async ({
  surveyTypeId,
  surveyId,
  surveyData,
  producterData,
  propertyData,
  files,
  token,
  tokenType = "Token",
}: BasicUpdateSurveyInput): Promise<BasicUpdateSurveyResponse> => {
  const hasFiles = files && Object.values(files).some(Boolean);

  if (hasFiles) {
    const formData = new FormData();
    if (surveyData) {
      formData.append("survey_data", JSON.stringify(surveyData));
    }
    if (producterData) {
      formData.append("producter_data", JSON.stringify(producterData));
    }
    if (propertyData) {
      formData.append("property_data", JSON.stringify(propertyData));
    }
    Object.entries(files ?? {}).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value as File);
      }
    });

    const { data } = await httpClient.post<BasicUpdateSurveyResponse>(
      `/admin/surveys/${surveyTypeId}/${surveyId}/basic-update`,
      formData,
      {
        headers: authHeaders(token, tokenType),
      },
    );
    return data;
  }

  const { data } = await httpClient.post<BasicUpdateSurveyResponse>(
    `/admin/surveys/${surveyTypeId}/${surveyId}/basic-update`,
    {
      survey_data: surveyData,
      producter_data: producterData,
      property_data: propertyData,
    },
    {
      headers: authHeaders(token, tokenType),
    },
  );
  return data;
};

export const updateSurveyState = async ({
  surveyTypeId,
  surveyId,
  state,
  stateReason,
  perfil,
  token,
  tokenType = "Token",
  csrfToken,
}: UpdateSurveyStateInput): Promise<UpdateSurveyStateResponse> => {
  const url = `/admin/surveys/${surveyTypeId}/${surveyId}/state/`;
  const { data } = await httpClient.post<UpdateSurveyStateResponse>(
    url,
    (() => {
      const payload: Record<string, unknown> = {
        state,
        state_reason: stateReason,
      };
      if (perfil) {
        payload.perfil = perfil;
      }
      return payload;
    })(),
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeaders(token, tokenType),
        ...(csrfToken ? { "X-CSRFTOKEN": csrfToken } : {}),
      },
    },
  );
  return data;
};

export const fetchPropertySurveyVisit = async (
  propertyId: number,
  visitNumber: number,
  token?: string,
  tokenType: string = "Token",
): Promise<PropertySurveyVisitResponse> => {
  const { data } = await httpClient.get<PropertySurveyVisitResponse>(
    `/admin/properties/${propertyId}/surveys/${visitNumber}`,
    {
      headers: authHeaders(token, tokenType),
    },
  );

  return {
    ...data,
    data: {
      property: data.data?.property,
      producer: data.data?.producer,
      surveys: data.data?.surveys ?? [],
    },
  };
};
