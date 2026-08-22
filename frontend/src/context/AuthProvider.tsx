import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, AUTH_TOKEN_KEY, AUTH_USER_KEY, errorMessage } from '../lib/apiClient';
import { AuthContext } from './auth-context';
import type { AuthContextValue, LoginResult } from './auth-context';
import type { AdminUser } from '../types';

interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: AdminUser;
}

/** Corrupt or hand-edited localStorage should sign the user out, not crash the app on boot. */
function readStoredUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [user, setUser] = useState<AdminUser | null>(readStoredUser);

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    try {
      const { data } = await api.post<LoginResponse>('/login', { username, password });
      if (data.success && data.token) {
        const nextUser: AdminUser = data.user ?? { username };
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
        setToken(data.token);
        setUser(nextUser);
        return { success: true };
      }
      return { success: false, message: data.message ?? 'Authentication failed.' };
    } catch (caught) {
      return { success: false, message: errorMessage(caught, 'Invalid username or password.') };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated: Boolean(token), token, user, login, logout }),
    [token, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
