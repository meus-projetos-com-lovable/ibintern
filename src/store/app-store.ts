import { create } from "zustand";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/lib/api/client";
import { auth } from "@/lib/api/endpoints";

export type Role = "aluno" | "secretaria" | "coordenador";

export interface AuthUser {
  id: number;
  username: string; // matrícula
  nome: string;
  email: string;
  role: Role;
}

interface AppState {
  user: AuthUser | null;
  isAuthenticated: boolean;

  setAuth: (user: AuthUser, access: string, refresh: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  hydrateFromToken: () => Promise<void>;
}

export const useAppStore = create<AppState>()((set, get) => ({
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

  hydrateFromToken: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    try {
      const me = await auth.me();
      const role = me.role.toLowerCase() as Role;
      set({
        isAuthenticated: true,
        user: {
          id: me.id,
          username: me.matricula,
          nome: me.nome,
          email: me.email,
          role,
        },
      });
    } catch {
      // Token is invalid or expired — clear state
      clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },
}));
