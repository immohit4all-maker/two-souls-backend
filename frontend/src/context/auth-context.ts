import { createContext, useContext } from 'react';
import type { AdminUser } from '../types';

export interface LoginResult {
  success: boolean;
  message?: string;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  token: string | null;
  user: AdminUser | null;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

/**
 * Context and hook live apart from the provider component: `react-refresh/only-export-components`
 * is an error in this project, so a file holding a component may not also export hooks.
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
