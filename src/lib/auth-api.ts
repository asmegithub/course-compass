import { apiFetch } from '@/lib/api';
import { User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  language?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const signup = async (payload: SignupPayload): Promise<AuthResponse> => {
  return apiFetch<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const refresh = async (refreshToken: string): Promise<AuthResponse> => {
  return apiFetch<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
};

export const logout = async (refreshToken: string): Promise<void> => {
  await apiFetch<void>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
};

export const me = async (): Promise<User> => {
  return apiFetch<User>('/api/auth/me');
};
