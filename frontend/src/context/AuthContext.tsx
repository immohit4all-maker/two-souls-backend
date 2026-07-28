import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: any;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('two_souls_admin_token'));
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('two_souls_admin_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('two_souls_admin_token', token);
    } else {
      localStorage.removeItem('two_souls_admin_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('two_souls_admin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('two_souls_admin_user');
    }
  }, [user]);

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      if (response.data.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Authentication failed' };
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Invalid username or password';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
