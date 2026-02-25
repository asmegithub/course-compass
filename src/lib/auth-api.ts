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

const normalizeRole = (role: string | undefined): User['role'] => {
  if (!role) return 'STUDENT';
  const normalized = role.startsWith('ROLE_') ? role.slice(5) : role;
  if (normalized === 'ADMIN' || normalized === 'INSTRUCTOR' || normalized === 'STUDENT' || normalized === 'GUEST') {
    return normalized;
  }
  return 'STUDENT';
};

const normalizeUser = (user: User): User => ({
  ...user,
  role: normalizeRole(user.role),
});

const normalizeAuthResponse = (response: AuthResponse): AuthResponse => ({
  ...response,
  user: normalizeUser(response.user),
});

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeAuthResponse(response);
};

export const signup = async (payload: SignupPayload): Promise<AuthResponse> => {
  const response = await apiFetch<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeAuthResponse(response);
};

export const refresh = async (refreshToken: string): Promise<AuthResponse> => {
  const response = await apiFetch<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  return normalizeAuthResponse(response);
};

export const logout = async (refreshToken: string): Promise<void> => {
  await apiFetch<void>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
};

export const me = async (): Promise<User> => {
  const response = await apiFetch<User>('/api/auth/me');
  return normalizeUser(response);
};
