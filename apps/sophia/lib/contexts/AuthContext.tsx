"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { qorAuth } from "@lib/api/qor-auth";
import type { Session, User, AuthResponse } from "@lib/types/index";

interface AuthContextType extends Session {
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize session from localStorage
  useEffect(() => {
    const initSession = async () => {
      try {
        const stored = localStorage.getItem("sophia_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          // Verify token is still valid
          const user = await qorAuth.verifyToken(parsed.accessToken);
          setSession({
            user,
            accessToken: parsed.accessToken,
            refreshToken: parsed.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setSession((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Session initialization failed:", error);
        localStorage.removeItem("sophia_session");
        setSession((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Session initialization failed",
        }));
      }
    };

    initSession();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      setSession((prev) => ({ ...prev, isLoading: true, error: null }));
      const response: AuthResponse = await qorAuth.login(username, password);
      
      const newSession = {
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      localStorage.setItem(
        "sophia_session",
        JSON.stringify({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        })
      );

      setSession(newSession);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      setSession((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
      }));
      throw error;
    }
  }, []);

  const signup = useCallback(async (username: string, email: string, password: string) => {
    try {
      setSession((prev) => ({ ...prev, isLoading: true, error: null }));
      const response: AuthResponse = await qorAuth.signup(username, email, password);

      const newSession = {
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      localStorage.setItem(
        "sophia_session",
        JSON.stringify({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        })
      );

      setSession(newSession);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Signup failed";
      setSession((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (session.accessToken) {
        await qorAuth.logout(session.accessToken);
      }
      localStorage.removeItem("sophia_session");
      setSession({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.removeItem("sophia_session");
      setSession((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Logout failed",
      }));
    }
  }, [session.accessToken]);

  const refreshSession = useCallback(async () => {
    if (!session.refreshToken) return;

    try {
      const response: AuthResponse = await qorAuth.refreshToken(session.refreshToken);
      
      const newSession = {
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      localStorage.setItem(
        "sophia_session",
        JSON.stringify({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        })
      );

      setSession(newSession);
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
    }
  }, [session.refreshToken, logout]);

  const setUser = useCallback((user: User | null) => {
    setSession((prev) => ({ ...prev, user }));
  }, []);

  const value: AuthContextType = {
    ...session,
    login,
    signup,
    logout,
    refreshSession,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
