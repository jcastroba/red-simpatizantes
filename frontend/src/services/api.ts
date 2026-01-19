/**
 * Centralized API service with typed methods and error handling.
 */
import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { API_URL } from '../config';
import type {
  LoginResponse,
  AdminLoginResponse,
  CheckUserResponse,
  DashboardData,
  NetworkData,
  NetworkRoot,
  Sympathizer,
  Department,
  Municipality,
  PaginatedResponse,
  ApiError,
} from '../types/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to add auth header
const authHeader = (token: string): AxiosRequestConfig => ({
  headers: { Authorization: `Token ${token}` },
});

// Error handler
const handleError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    const message = axiosError.response?.data?.error || axiosError.message;
    throw new Error(message);
  }
  throw error;
};

// ============ Auth API ============

export const authApi = {
  checkUser: async (cedula: string): Promise<CheckUserResponse> => {
    try {
      const response = await api.post<CheckUserResponse>('/auth/check-user/', { cedula });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { exists: false };
      }
      throw handleError(error);
    }
  },

  requestPassword: async (cedula: string): Promise<{ message: string }> => {
    try {
      const response = await api.post('/auth/request-password/', { cedula });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  forgotPassword: async (cedula: string): Promise<{ message: string }> => {
    try {
      const response = await api.post('/auth/forgot-password/', { cedula });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  setPassword: async (uid: string, token: string, password: string): Promise<{ message: string }> => {
    try {
      const response = await api.post('/auth/set-password/', { uid, token, password });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  login: async (cedula: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login/', { cedula, password });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  getDashboard: async (token: string): Promise<DashboardData> => {
    try {
      const response = await api.get<DashboardData>('/auth/dashboard/', authHeader(token));
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  getNetwork: async (token: string): Promise<NetworkData> => {
    try {
      const response = await api.get<NetworkData>('/auth/network/', authHeader(token));
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
};

// ============ Admin API ============

export const adminApi = {
  login: async (username: string, password: string): Promise<AdminLoginResponse> => {
    try {
      const response = await api.post<AdminLoginResponse>('/admin/login/', { username, password });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  getNetworks: async (token: string): Promise<NetworkRoot[]> => {
    try {
      const response = await api.get<NetworkRoot[]>('/admin/networks/', authHeader(token));
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  createNetwork: async (token: string, data: Partial<Sympathizer>): Promise<{ id: number; referral_code: string }> => {
    try {
      const response = await api.post('/admin/networks/', data, authHeader(token));
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  getUsers: async (
    token: string,
    params?: { q?: string; page?: number; page_size?: number; status?: string }
  ): Promise<PaginatedResponse<Sympathizer>> => {
    try {
      const response = await api.get<PaginatedResponse<Sympathizer>>('/admin/users/', {
        ...authHeader(token),
        params,
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  getUser: async (token: string, id: number): Promise<Sympathizer & { total_network_size: number }> => {
    try {
      const response = await api.get(`/admin/users/${id}/`, authHeader(token));
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  updateUser: async (token: string, id: number, data: Partial<Sympathizer>): Promise<Sympathizer> => {
    try {
      const response = await api.patch(`/admin/users/${id}/`, data, authHeader(token));
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  deleteUser: async (token: string, id: number): Promise<void> => {
    try {
      await api.delete(`/admin/users/${id}/`, authHeader(token));
    } catch (error) {
      throw handleError(error);
    }
  },

  toggleLink: async (token: string, id: number): Promise<{ link_enabled: boolean }> => {
    try {
      const response = await api.post(`/admin/users/${id}/toggle-link/`, {}, authHeader(token));
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  toggleSuspension: async (token: string, id: number): Promise<{ is_suspended: boolean; is_active: boolean }> => {
    try {
      const response = await api.post(`/admin/users/${id}/toggle-suspension/`, {}, authHeader(token));
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  exportUsers: async (token: string, query?: string): Promise<Blob> => {
    try {
      const response = await api.get('/admin/users/export/', {
        ...authHeader(token),
        params: { q: query },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
};

// ============ Public API ============

export const publicApi = {
  getDepartments: async (): Promise<Department[]> => {
    try {
      const response = await api.get<Department[]>('/locations/');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  getMunicipalities: async (departmentId: number): Promise<Municipality[]> => {
    try {
      const response = await api.get<Municipality[]>(`/locations/${departmentId}/municipalities/`);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  getReferrer: async (code: string): Promise<{ nombres: string; apellidos: string }> => {
    try {
      const response = await api.get(`/sympathizers/referrer/${code}/`);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  checkCedula: async (cedula: string): Promise<{ exists: boolean; phone_hint?: string }> => {
    try {
      const response = await api.post('/sympathizers/check_cedula/', { cedula });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  register: async (data: Partial<Sympathizer> & { referrer_code?: string }): Promise<Sympathizer> => {
    try {
      const response = await api.post<Sympathizer>('/sympathizers/', data);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
};

export default api;
