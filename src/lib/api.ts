const DEFAULT_API_BASE_URL = 'http://localhost:8080';

import { getAccessToken } from '@/lib/auth-storage';

export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, '');
  }
  return DEFAULT_API_BASE_URL;
};

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const accessToken = getAccessToken();
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = 'Request failed.';
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const data = await response.json();
        message = data?.message || JSON.stringify(data);
      } catch {
        message = 'Request failed.';
      }
    } else {
      const errorText = await response.text();
      message = errorText || 'Request failed.';
    }
    throw new Error(`API ${response.status} ${response.statusText}: ${message}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
};
