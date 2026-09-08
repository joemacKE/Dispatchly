import { createContext, useContext, useState, type ReactNode } from "react";

import {
  login as loginRequest,
  register as registerRequest,
  type RegisterPayload,
} from "../api/client";

import type { AuthUser } from "../types";

type AuthContextValue = {
  token: string | null;

  user: AuthUser | null;

  login(phone: string, password: string): Promise<AuthUser>;

  register(payload: RegisterPayload): Promise<AuthUser>;

  logout(): void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "reflex_access_token";

const USER_KEY = "reflex_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );

  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(USER_KEY);

    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved) as AuthUser;
    } catch {
      localStorage.removeItem(USER_KEY);

      return null;
    }
  });

  function saveSession(accessToken: string, authUser: AuthUser) {
    localStorage.setItem(TOKEN_KEY, accessToken);

    localStorage.setItem(USER_KEY, JSON.stringify(authUser));

    setToken(accessToken);

    setUser(authUser);
  }

  async function login(phone: string, password: string): Promise<AuthUser> {
    const response = await loginRequest(phone, password);

    saveSession(response.access_token, response.user);

    return response.user;
  }

  async function register(payload: RegisterPayload): Promise<AuthUser> {
    const response = await registerRequest(payload);

    saveSession(response.access_token, response.user);

    return response.user;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);

    localStorage.removeItem(USER_KEY);

    setToken(null);

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,

        user,

        login,

        register,

        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
