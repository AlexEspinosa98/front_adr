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
  data: RawExtensionistProperty[] | { properties?: RawExtensionistProperty[] };
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
}

export interface ExtensionistPropertiesResponse {
  data: ExtensionistProperty[];
  message: string;
  status?: string;
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

  const rawList = Array.isArray(data.data)
    ? data.data
    : Array.isArray((data.data as { properties?: RawExtensionistProperty[] })?.properties)
      ? ((data.data as { properties?: RawExtensionistProperty[] }).properties as RawExtensionistProperty[])
      : [];

  return {
    message: data.message ?? "",
    status: data.status,
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
      state: (property as any).state,
      village: (property as any).village,
      primaryLine: (property as any).linea_productive_primary,
      secondaryLine: (property as any).linea_productive_secondary,
      areaInProduction: (property as any).area_in_production,
      latitude: (property as any).latitude,
      longitude: (property as any).longitude,
      createdAt: (property as any).created_at,
    })),
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
