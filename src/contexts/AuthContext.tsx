import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../lib/api';
import type { Admin } from '../lib/types';

interface AuthContextValue {
  admin: Admin | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  // Validasi cookie masih valid tiap kali app pertama kali dimuat/refresh
  useEffect(() => {
    api.getMe()
      .then((result) => {
        if (result.success && result.admin) {
          setAdmin(result.admin);
        } else {
          setAdmin(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    if (result.success && result.admin) {
      setAdmin(result.admin);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(async () => {
  await api.logout();
  setAdmin(null);
}, []);

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: !!admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
