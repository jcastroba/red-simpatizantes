/**
 * TypeScript type definitions for API responses and data models.
 */

// Base types
export interface Department {
  id: number;
  name: string;
}

export interface Municipality {
  id: number;
  name: string;
  department: number;
}

// Sympathizer types
export interface Sympathizer {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string | null;
  phone: string;
  sexo: 'M' | 'F' | 'O';
  department_id: number | null;
  municipio_id: number | null;
  department_name: string | null;
  municipio_name: string | null;
  referral_code: string;
  referrer: number | null;
  referrer_name: string | null;
  link_enabled: boolean;
  is_suspended: boolean;
  is_active: boolean;
  has_account: boolean;
  created_at: string;
  activated_at: string | null;
}

export interface SubReferral {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  phone: string;
  email: string | null;
  created_at: string;
}

export interface Referral extends SubReferral {
  referrals_count: number;
  sub_referrals: SubReferral[];
}

// Auth types
export interface User {
  nombres: string;
  apellidos: string;
  referral_code: string;
}

export interface AdminUser {
  username: string;
  email: string;
  is_superuser: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AdminLoginResponse {
  token: string;
  user: AdminUser;
}

export interface CheckUserResponse {
  exists: boolean;
  has_user?: boolean;
  email?: string | null;
  masked_email?: string | null;
}

// Dashboard types
export interface DashboardData {
  nombres: string;
  apellidos: string;
  referral_code: string;
  referrals_count: number;
  referrals: Referral[];
}

// Network visualization types
export interface NetworkNode {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  email: string | null;
  referrals_count: number;
  type: 'me' | 'sponsor' | 'referral';
  level: number;
  x: number;
  y: number;
}

export interface NetworkLink {
  source: number;
  target: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

// Admin types
export interface NetworkRoot {
  id: number;
  name: string;
  cedula: string;
  referral_code: string;
  created_at: string;
  link_enabled: boolean;
  is_suspended: boolean;
  direct_referrals: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// Health check
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    database: 'ok' | 'error';
    sympathizers_count: number | 'error';
  };
}

// API Error
export interface ApiError {
  error: string;
  detail?: string;
}

// Form types
export interface RegistrationFormData {
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  phone: string;
  sexo: 'M' | 'F' | 'O';
  department_id: number | null;
  municipio_id: number | null;
  referrer_code?: string;
}

export interface CreateNetworkFormData {
  nombres: string;
  apellidos: string;
  cedula: string;
  phone: string;
  email?: string;
  sexo: 'M' | 'F' | 'O';
  department_id?: number;
  municipio_id?: number;
}
