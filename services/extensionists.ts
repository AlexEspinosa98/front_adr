import { httpClient } from "@/lib/http";

export interface Extensionist {
  id: number;
  name: string;
  email?: string;
  identification: string;
  phone: string;
  city?: string;
  zone?: string;
  signing_image_path?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  surveys_state_summary?: {
    survey_1?: {
      pending?: number;
      accepted?: number;
      rejected?: number;
    };
    survey_2?: {
      pending?: number;
      accepted?: number;
      rejected?: number;
    };
    survey_3?: {
      pending?: number;
      accepted?: number;
      rejected?: number;
    };
    total?: {
      pending?: number;
      accepted?: number;
      rejected?: number;
    };
  };
}

export interface ExtensionistsResponse {
  data: Extensionist[];
  message: string;
  status?: string;
  success?: boolean;
}

export interface ExtensionistFilters {
  name?: string;
  email?: string;
  identification?: string;
  phone?: string;
  city?: string;
  zone?: string;
}

const sanitizeFilters = (filters: ExtensionistFilters) => {
  const sanitized: ExtensionistFilters = {};

  (Object.entries(filters) as [keyof ExtensionistFilters, string | undefined][])
    .map(([key, value]) => [key, value?.trim()] as const)
    .forEach(([key, value]) => {
      if (value) {
        sanitized[key] = value;
      }
    });

  return sanitized;
};

export const fetchExtensionists = async (
  filters: ExtensionistFilters = {},
  token?: string,
): Promise<ExtensionistsResponse> => {
  const params = sanitizeFilters(filters);
  const { data } = await httpClient.get<ExtensionistsResponse>(
    "/admin/extensionists/names-ids-phones",
    token
      ? {
          params,
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      : { params },
  );
  return data;
};

export const fetchExtensionistsFull = async (
  filters: Pick<ExtensionistFilters, "name" | "email" | "city" | "zone"> = {},
  token?: string,
  tokenType: string = "Token",
) => {
  const params = sanitizeFilters(filters);
  const { data } = await httpClient.get<{
    success: boolean;
    data: { extensionists: Extensionist[] };
  }>("/admin/extensionists", {
    params,
    headers:
      token && tokenType
        ? {
            Authorization: `${tokenType} ${token}`,
          }
        : undefined,
  });

  return {
    success: data.success,
    data: data.data.extensionists,
  };
};
