import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:5174/api/v1";

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 15000
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    return Promise.reject(error);
  }
);