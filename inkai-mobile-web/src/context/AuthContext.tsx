"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: any;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateUser: (data: any) => void;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isDocumentComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('inkai_token');
    if (savedToken) {
      setToken(savedToken);
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

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

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(identifier, password);
      if (response.data.status === 'success') {
        const newToken = response.data.token;
        setToken(newToken);
        localStorage.setItem('inkai_token', newToken);
        await fetchProfile();
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('inkai_token');
  };

  const updateUser = (newData: any) => {
    setUser((prev: any) => ({ ...prev, ...newData }));
  };

  const isProfileComplete = React.useMemo(() => {
    if (!user) return false;
    
    // Admins are exempt from member profile checks
    const isAdmin = Array.isArray(user.roles) && user.roles.some((r: any) => {
      const roleName = typeof r === 'string' ? r : r.name;
      return roleName && roleName.includes('ADMIN');
    });
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
  }, [user]);

  const isDocumentComplete = React.useMemo(() => {
    if (!user) return false;
    
    const isAdmin = Array.isArray(user.roles) && user.roles.some((r: any) => {
      const roleName = typeof r === 'string' ? r : r.name;
      return roleName && roleName.includes('ADMIN');
    });
    if (isAdmin) return true;

    const birthCertificateUrl = user.birthCertificateUrl || user.member?.birthCertificateUrl;
    const bpjsCardUrl = user.bpjsCardUrl || user.member?.bpjsCardUrl;
    
    // We check if they are non-empty strings
    if (!birthCertificateUrl || !bpjsCardUrl) return false;
    
    return true;
  }, [user]);

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
