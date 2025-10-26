// Authentication API endpoints

import { api } from './client';
import type { User, LoginCredentials, RegisterData } from '../../types';

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface MeResponse {
  data: User;
}

/**
 * Register new user
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  return api.post<AuthResponse>('/api/auth/register', {
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
  });
};

/**
 * Login user
 */
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  return api.post<AuthResponse>('/api/auth/login', credentials);
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (token: string): Promise<User> => {
  const response = await api.get<MeResponse>('/api/users/me', token);
  return response.data;
};

/**
 * Logout (client-side only, no backend endpoint needed)
 */
export const logout = async (): Promise<void> => {
  // Clear token from localStorage
  localStorage.removeItem('auth_token');
};
