import { httpClient } from "@/lib/http";

export interface Extensionist {
  id: number;
  name: string;
  identification: string;
  phone: string;
  city?: string;
}

export interface ExtensionistsResponse {
  data: Extensionist[];
  message: string;
  status?: string;
  success?: boolean;
}

export interface ExtensionistFilters {
  name?: string;
  identification?: string;
  phone?: string;
  city?: string;
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
    {
      params,
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    },
  );
  return data;
};
