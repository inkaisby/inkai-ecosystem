"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/api';

export type LoginResult = { ok: true } | { ok: false; message: string };

interface AuthContextType {
  user: any;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateUser: (data: any) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isProfileComplete: boolean;
  isDocumentComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('inkai_token') || localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      loadSessionBootstrap();
    } else {
      setIsLoading(false);
    }
    // intentionally once on mount — token restores session via loadSessionBootstrap
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSessionBootstrap = async () => {
    try {
      const response = await authApi.getSession();
      if (response.data.status === 'success') {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Fetch session error:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  /** Muat `/members/me` lengkap — untuk halaman yang butuh ranks, attendance, registrations, dll. */
  const fetchProfile = async () => {
    try {
      const response = await authApi.getProfile();
      if (response.data.status === 'success') {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (identifier: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(identifier, password);
      if (response.data.status === 'success') {
        const newToken = response.data.token;
        setToken(newToken);
        localStorage.setItem('inkai_token', newToken);
        const sessionUser = response.data.data?.user;
        if (sessionUser) {
          setUser(sessionUser);
        } else {
          await loadSessionBootstrap();
        }
        return { ok: true };
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      const axiosErr = error as {
        response?: {
          data?: { message?: string; debug?: string };
          status?: number;
        };
      };
      const data = axiosErr.response?.data;
      let message =
        typeof data?.message === 'string'
          ? data.message
          : 'Login gagal. Periksa email/NIA dan kata sandi.';
      if (axiosErr.response?.status === 429) {
        message =
          typeof data?.message === 'string'
            ? data.message
            : 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
      }
      if (typeof data?.debug === 'string' && data.debug.trim()) {
        message = `${message} — ${data.debug}`;
      }
      return { ok: false, message };
    } finally {
      setIsLoading(false);
    }
    return { ok: false, message: 'Login gagal. Silakan coba lagi.' };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('inkai_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (newData: any) => {
    setUser((prev: any) => ({ ...prev, ...newData }));
  };

  const isAdmin = React.useMemo(() => {
    if (!user) return false;
    return Array.isArray(user.roles) && user.roles.some((r: any) => {
      const roleName = typeof r === 'string' ? r : r.name;
      return roleName && roleName.includes('ADMIN');
    });
  }, [user]);

  const isProfileComplete = React.useMemo(() => {
    if (!user) return false;
    if (isAdmin) return true;

    // Core User fields
    const fullName = user.fullName;
    const phoneNumber = user.phoneNumber;
    const photoUrl = user.photoUrl;

    if (!fullName || !phoneNumber || !photoUrl) return false;
    
    // Member specific fields
    const gender = user.gender || user.member?.gender;
    const birthDate = user.birthDate || user.member?.birthDate;
    const birthPlace = user.birthPlace || user.member?.birthPlace;
    const address = user.address || user.member?.address;
    const dojoId = user.dojoId || user.member?.dojoId;

    if (!gender || !birthDate || !birthPlace || !address || !dojoId) return false;
    
    return true;
  }, [user, isAdmin]);

  const isDocumentComplete = React.useMemo(() => {
    if (!user) return false;
    if (isAdmin) return true;

    const birthCertificateUrl = user.birthCertificateUrl || user.member?.birthCertificateUrl;
    const bpjsCardUrl = user.bpjsCardUrl || user.member?.bpjsCardUrl;
    
    // We check if they are non-empty strings
    if (!birthCertificateUrl || !bpjsCardUrl) return false;
    
    return true;
  }, [user, isAdmin]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      login, 
      logout, 
      fetchProfile,
      updateUser, 
      isAuthenticated: !!token, 
      isAdmin,
      isProfileComplete,
      isDocumentComplete 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
