import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../types';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUser: IUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(() => {
    const saved = localStorage.getItem('dosebloom_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('dosebloom_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await apiClient.auth.me();
      setUser(res.data.user);
      localStorage.setItem('dosebloom_user', JSON.stringify(res.data.user));
    } catch (err) {
      console.warn('[AuthContext] Session expired or invalid');
      setUser(null);
      setToken(null);
      localStorage.removeItem('dosebloom_token');
      localStorage.removeItem('dosebloom_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (credentials: any) => {
    const res = await apiClient.auth.login(credentials);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('dosebloom_token', newToken);
    localStorage.setItem('dosebloom_user', JSON.stringify(newUser));
  };

  const register = async (data: any) => {
    const res = await apiClient.auth.register(data);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('dosebloom_token', newToken);
    localStorage.setItem('dosebloom_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      await apiClient.auth.logout();
    } catch (err) {
      // Ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('dosebloom_token');
      localStorage.removeItem('dosebloom_user');
    }
  };

  const updateUser = (updatedUser: IUser) => {
    setUser(updatedUser);
    localStorage.setItem('dosebloom_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
