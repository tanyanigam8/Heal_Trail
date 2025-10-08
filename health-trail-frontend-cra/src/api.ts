import axios from "axios";

/**
 * Pick API base URL from env vars.
 * - CRA: uses process.env.REACT_APP_API_BASE (replaced at build time)
 * - Vite: uses import.meta.env.VITE_API_BASE (also replaced at build time)
 */
function getApiBase(): string {
  // Vite style (safe check)
  if (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE) {
    return (import.meta as any).env.VITE_API_BASE;
  }

  // CRA style (safe check)
  if (typeof process !== "undefined" && process.env?.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE as string;
  }

  // fallback
  return "http://127.0.0.1:8000";
}

const API_BASE = getApiBase();

export const api = axios.create({ baseURL: API_BASE });

export function setAuth(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}
