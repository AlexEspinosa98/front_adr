import { httpClient } from "@/lib/http";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    access_token?: string;
    api_token?: string;
    token_type?: string;
  };
  message: string;
  success: boolean;
}

export const login = async (
  payload: LoginPayload,
): Promise<LoginResponse> => {
  const { data } = await httpClient.post<LoginResponse>(
    "/admin/login",
    payload,
  );
  return data;
};
