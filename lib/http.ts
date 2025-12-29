import axios from "axios";

// Use the local proxy in the browser to avoid CORS issues
// On the server we need an absolute URL or Node will throw ERR_INVALID_URL
const PROXY_PATH = "/api/proxy";
const serverBaseUrl =
  process.env.API_BASE_URL ??
  (process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL.replace(/\/$/, "")}${PROXY_PATH}`
    : undefined) ??
  `http://localhost:3000${PROXY_PATH}`;

const baseURL = typeof window === "undefined" ? serverBaseUrl : PROXY_PATH;

export const httpClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("access_token");
    const tokenType = window.localStorage.getItem("access_token_type");
    if (token) {
      config.headers = config.headers ?? {};
      if (!config.headers.Authorization) {
        const headerPrefix = tokenType ?? "Token";
        config.headers.Authorization = `${headerPrefix} ${token}`;
      }
    }
  }
  return config;
});
