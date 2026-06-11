import { create } from "zustand";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/lib/api/client";

export type Role = "aluno" | "secretaria" | "coordenador";

export interface AuthUser {
  id: number;
  username: string; // matrícula
  email: string;
  role: Role;
}

interface AppState {
  user: AuthUser | null;
  isAuthenticated: boolean;

  setAuth: (user: AuthUser, access: string, refresh: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  hydrateFromToken: () => void;
}

/**
 * Decode a JWT payload without verification (client-side only).
 * We use this to extract user_id from the token for API calls.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export const useAppStore = create<AppState>()((set) => ({
  user: null,
  isAuthenticated: !!getAccessToken(),

  setAuth: (user, access, refresh) => {
    setTokens(access, refresh);
    set({ user, isAuthenticated: true });
  },

  setUser: (user) => {
    set({ user });
  },

  logout: () => {
    const refresh = getRefreshToken();
    // Best-effort blacklist — don't block on failure
    if (refresh) {
      fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}/auth/logout/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        },
      ).catch(() => {});
    }
    clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  hydrateFromToken: () => {
    const token = getAccessToken();
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    const payload = decodeJwtPayload(token);
    if (payload && payload.user_id) {
      // We can only know user_id from the token; the rest gets filled
      // after the first API call or login. Keep existing user if present.
      set((state) => ({
        isAuthenticated: true,
        user: state.user ?? {
          id: payload.user_id as number,
          username: "",
          email: "",
          role: "aluno" as Role,
        },
      }));
    }
  },
}));
