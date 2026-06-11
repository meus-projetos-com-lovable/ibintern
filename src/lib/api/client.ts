import type { ApiError } from "./types";

// ── Configuration ───────────────────────────────────────────────────
// Django dev server runs at 8000 by default
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// ── Token management (JWT access + refresh) ─────────────────────────
const ACCESS_KEY = "ibintern-access-token";
const REFRESH_KEY = "ibintern-refresh-token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  // Also clear legacy store data
  localStorage.removeItem("ibmec-estagios-store");
}

// ── Fetch wrapper ───────────────────────────────────────────────────
export class ApiRequestError extends Error {
  status: number;
  detail?: string;

  constructor({ status, message, detail }: ApiError) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.detail = detail;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function tryRefreshToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const response = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setTokens(data.access, data.refresh ?? refresh);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAccessToken();
  const { body, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  // Try token refresh on 401
  if (response.status === 401 && token) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getAccessToken()}`;
      response = await fetch(`${BASE_URL}${path}`, {
        ...rest,
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
      });
    }
  }

  if (response.status === 401) {
    clearTokens();
    window.location.href = "/";
    throw new ApiRequestError({ status: 401, message: "Sessão expirada. Faça login novamente." });
  }

  if (response.status === 403) {
    const errorBody = await response.json().catch(() => ({}));
    // Handle primeiro_acesso flow
    if (errorBody.error === "primeiro_acesso") {
      throw new ApiRequestError({
        status: 403,
        message: errorBody.message ?? "Você precisa redefinir sua senha.",
        detail: "primeiro_acesso",
      });
    }
    throw new ApiRequestError({
      status: 403,
      message: errorBody.error ?? errorBody.detail ?? "Acesso negado.",
    });
  }

  if (!response.ok) {
    let errorBody: Record<string, unknown> = {};
    try {
      errorBody = await response.json();
    } catch {
      /* non-JSON error body */
    }
    // DRF returns errors in many shapes — normalize
    const message =
      (errorBody.error as string) ??
      (errorBody.message as string) ??
      (errorBody.detail as string) ??
      `Erro ${response.status}`;
    throw new ApiRequestError({
      status: response.status,
      message,
      detail: JSON.stringify(errorBody),
    });
  }

  // 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

// ── Upload helper (multipart/form-data) ─────────────────────────────
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  // DO NOT set Content-Type — browser will set it with boundary for multipart

  let response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  // Try token refresh on 401
  if (response.status === 401 && token) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getAccessToken()}`;
      response = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers,
        body: formData,
      });
    }
  }

  if (response.status === 401) {
    clearTokens();
    window.location.href = "/";
    throw new ApiRequestError({ status: 401, message: "Sessão expirada." });
  }

  if (!response.ok) {
    let errorBody: Record<string, unknown> = {};
    try {
      errorBody = await response.json();
    } catch {
      /* empty */
    }
    const message =
      (errorBody.error as string) ??
      (errorBody.message as string) ??
      `Erro ${response.status}`;
    throw new ApiRequestError({
      status: response.status,
      message,
      detail: JSON.stringify(errorBody),
    });
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// ── Download helper (returns blob URL) ──────────────────────────────
export async function apiDownloadUrl(path: string): Promise<string> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, { headers });

  if (!response.ok) {
    throw new ApiRequestError({
      status: response.status,
      message: `Erro ao baixar arquivo (${response.status})`,
    });
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
