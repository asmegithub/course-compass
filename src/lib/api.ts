const DEFAULT_API_BASE_URL = 'http://localhost:8080';

import { clearTokens, getAccessToken, getRefreshToken, setStoredUser, setTokens } from '@/lib/auth-storage';

const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired';

let refreshInFlight: Promise<string | null> | null = null;

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

const isAuthPath = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedPath.startsWith('/api/auth/');
};

const emitSessionExpired = () => {
  clearTokens();
  setStoredUser(null);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const response = await fetch(buildUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as {
      accessToken?: string;
      refreshToken?: string;
    };

    if (!data.accessToken) {
      return null;
    }

    setTokens(data.accessToken, data.refreshToken || refreshToken);
    return data.accessToken;
  })()
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
};

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const buildHeaders = (token: string | null) => {
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((init?.headers as Record<string, string> | undefined) || {}),
    };

    const isFormDataBody = typeof FormData !== 'undefined' && init?.body instanceof FormData;
    if (!isFormDataBody && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  };

  const makeRequest = (token: string | null) => fetch(buildUrl(path), {
    ...init,
    headers: buildHeaders(token),
  });

  let response = await makeRequest(getAccessToken());

  if (response.status === 401 && !isAuthPath(path)) {
    const refreshedAccessToken = await refreshAccessToken();
    if (!refreshedAccessToken) {
      emitSessionExpired();
      throw new Error('Session expired. Please sign in again.');
    }
    response = await makeRequest(refreshedAccessToken);
  }

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
