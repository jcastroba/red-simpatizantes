/**
 * Authentication context for managing user and admin sessions.
 * Provides centralized auth state, token management, and session expiration handling.
 */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios, { AxiosError } from 'axios';
import { API_URL } from '../config';
import type { User, AdminUser } from '../types/api';

interface AuthContextType {
  // User auth
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;

  // Admin auth
  adminToken: string | null;
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  adminLogin: (token: string, user: AdminUser) => void;
  adminLogout: () => void;

  // Session state
  isSessionExpired: boolean;
  clearSessionExpired: () => void;

  // Loading state
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // User state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Admin state
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('adminToken'));
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem('adminUser');
    return stored ? JSON.parse(stored) : null;
  });

  // Session state
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Computed auth states
  const isAuthenticated = !!token && !!user;
  const isAdminAuthenticated = !!adminToken && !!adminUser;

  // User login
  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setIsSessionExpired(false);
  }, []);

  // User logout
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // Admin login
  const adminLogin = useCallback((newToken: string, newUser: AdminUser) => {
    setAdminToken(newToken);
    setAdminUser(newUser);
    localStorage.setItem('adminToken', newToken);
    localStorage.setItem('adminUser', JSON.stringify(newUser));
    setIsSessionExpired(false);
  }, []);

  // Admin logout
  const adminLogout = useCallback(() => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }, []);

  // Clear session expired state
  const clearSessionExpired = useCallback(() => {
    setIsSessionExpired(false);
  }, []);

  // Setup axios interceptor for handling 401 responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Check if it's an admin request
          const isAdminRequest = error.config?.url?.includes('/admin/');

          if (isAdminRequest && adminToken) {
            adminLogout();
            setIsSessionExpired(true);
          } else if (token) {
            logout();
            setIsSessionExpired(true);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token, adminToken, logout, adminLogout]);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      setIsLoading(true);

      // Verify user token
      if (token) {
        try {
          await axios.get(`${API_URL}/auth/dashboard/`, {
            headers: { Authorization: `Token ${token}` }
          });
        } catch (error) {
          // Token invalid, clear it
          logout();
        }
      }

      // Verify admin token
      if (adminToken) {
        try {
          await axios.get(`${API_URL}/admin/networks/`, {
            headers: { Authorization: `Token ${adminToken}` }
          });
        } catch (error) {
          // Token invalid, clear it
          adminLogout();
        }
      }

      setIsLoading(false);
    };

    verifyToken();
  }, []); // Only run on mount

  const value: AuthContextType = {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    adminToken,
    adminUser,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    isSessionExpired,
    clearSessionExpired,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
