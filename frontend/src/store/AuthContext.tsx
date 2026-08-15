import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor de contexto React que maneja el estado de sesión, almacenamiento local y tokens JWT.
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  // Guarda usuario y token en localStorage y actualiza el estado de autenticación.
  const login = useCallback((u: User, t: string) => {
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', t);
    setUser(u); setToken(t);
  }, []);

  // Limpia credenciales almacenadas y desautentica al usuario actual.
  const logout = useCallback(() => {
    localStorage.removeItem('user'); localStorage.removeItem('token');
    setUser(null); setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para acceder fácilmente al contexto de autenticación en cualquier componente.
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
