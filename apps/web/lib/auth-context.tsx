'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, UserProfile, setAccessToken } from './api-client';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  registerConsumer: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => Promise<void>;
  registerBrand: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    registrationNum?: string;
    websiteUrl?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await api.auth.me();
      setUser(profile);
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Attempt to hydrate active session on mount
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(credentials);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const registerConsumer = async (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => {
    setIsLoading(true);
    try {
      await api.auth.register(data);
      // Automatically log in after registration
      await login({ email: data.email, password: data.password });
    } finally {
      setIsLoading(false);
    }
  };

  const registerBrand = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    registrationNum?: string;
    websiteUrl?: string;
    phone?: string;
  }) => {
    setIsLoading(true);
    try {
      await api.auth.registerBrand(data);
      // Automatically log in after registration
      await login({ email: data.email, password: data.password });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        registerConsumer,
        registerBrand,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
