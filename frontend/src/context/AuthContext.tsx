"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser } from "../services/auth";
import { UserLogin } from "../types/index";

interface AuthContextType {
  user: any | null;
  token: string | null;
  labName: string | null;
  darkMode: boolean;
  loading: boolean;
  login: (credentials: UserLogin, labSlug: string) => Promise<void>;
  logout: () => void;
  toggleDarkMode: () => void;
  setAuthFromToken: (data: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [labName, setLabName] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and hydrate authentication details
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("medilab_access_token");
      const storedUser = localStorage.getItem("medilab_user");
      const storedLabName = localStorage.getItem("medilab_lab_name");
      const isDark = localStorage.getItem("medilab_dark_mode") === "true";

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setLabName(storedLabName);
      }
      
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      
      setLoading(false);
    }
  }, []);

  const login = async (credentials: UserLogin, labSlug: string) => {
    try {
      const response = await loginUser(credentials, labSlug);
      
      localStorage.setItem("medilab_access_token", response.access_token);
      localStorage.setItem("medilab_refresh_token", response.refresh_token);
      
      const userProfile = {
        name: response.name,
        role: response.role,
        email: credentials.email,
        lab_id: response.lab_id
      };
      
      localStorage.setItem("medilab_user", JSON.stringify(userProfile));
      localStorage.setItem("medilab_lab_name", response.lab_name);
      localStorage.setItem("medilab_lab_slug", labSlug);

      setUser(userProfile);
      setToken(response.access_token);
      setLabName(response.lab_name);
    } catch (error) {
      throw error;
    }
  };

  // Used by Google/OTP login to hydrate context in-memory without a full page reload
  const setAuthFromToken = (data: any) => {
    const userProfile = { name: data.name, role: data.role, lab_id: data.lab_id };
    setUser(userProfile);
    setToken(data.access_token);
    setLabName(data.lab_name);
  };

  const logout = () => {
    localStorage.removeItem("medilab_access_token");
    localStorage.removeItem("medilab_refresh_token");
    localStorage.removeItem("medilab_user");
    localStorage.removeItem("medilab_lab_name");
    localStorage.removeItem("medilab_lab_slug");
    
    setUser(null);
    setToken(null);
    setLabName(null);
    
    window.location.href = "/auth/login";
  };

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem("medilab_dark_mode", String(nextDark));
    
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        labName,
        darkMode,
        loading,
        login,
        logout,
        toggleDarkMode,
        setAuthFromToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
