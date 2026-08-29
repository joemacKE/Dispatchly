import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { login as loginRequest } from "../api/client";
import type { AuthUser } from "../types";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;

  login: (
    phone: string,
    password: string
  ) => Promise<void>;

  logout: () => void;
};

const AuthContext =
  createContext<AuthContextValue | null>(null);

const TOKEN_KEY =
  "reflex_access_token";

const USER_KEY =
  "reflex_user";

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [token, setToken] =
    useState<string | null>(() => {
      return localStorage.getItem(TOKEN_KEY);
    });

  const [user, setUser] =
    useState<AuthUser | null>(() => {
      const saved =
        localStorage.getItem(USER_KEY);

      if (!saved) {
        return null;
      }

      try {
        return JSON.parse(saved) as AuthUser;
      } catch {
        return null;
      }
    });

  async function login(
    phone: string,
    password: string
  ) {
    const response =
      await loginRequest(
        phone,
        password
      );

    localStorage.setItem(
      TOKEN_KEY,
      response.access_token
    );

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(response.user)
    );

    setToken(response.access_token);
    setUser(response.user);
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
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
