import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { User } from '@/types';
import { login as loginApi, signup as signupApi, logout as logoutApi, me as meApi, refresh as refreshSessionApi, LoginPayload, SignupPayload } from '@/lib/auth-api';
import { clearTokens, getAccessToken, getRefreshToken, getStoredUser, setStoredUser, setTokens } from '@/lib/auth-storage';
import { enableAdminPushNotifications } from '@/lib/push-api';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  applyOAuthTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  login: async () => {},
  signup: async () => {},
  applyOAuthTokens: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const isAdminRole = (role?: string | null) => role === 'ADMIN' || role === 'ROLE_ADMIN';
const normalizeRole = (role?: string | null): User['role'] => {
  if (!role) return 'STUDENT';
  const cleanRole = role.startsWith('ROLE_') ? role.slice(5) : role;
  if (cleanRole === 'ADMIN' || cleanRole === 'INSTRUCTOR' || cleanRole === 'STUDENT' || cleanRole === 'GUEST') {
    return cleanRole;
  }
  return 'STUDENT';
};
const normalizeUser = (user: User | null): User | null => {
  if (!user) return null;
  return {
    ...user,
    role: normalizeRole(user.role),
  };
};

const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => normalizeUser(getStoredUser()));
  const [isLoading, setIsLoading] = useState(false);
  const lastSessionExpiredToastAtRef = useRef(0);

  useEffect(() => {
    if (!getAccessToken()) {
      setUser(null);
      setStoredUser(null);
    }
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearTokens();
      setStoredUser(null);
      setUser(null);

      const now = Date.now();
      if (now - lastSessionExpiredToastAtRef.current > 2000) {
        lastSessionExpiredToastAtRef.current = now;
        toast({
          title: 'Session expired',
          description: 'Your session has expired. Please sign in again.',
          variant: 'destructive',
        });
      }

      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        const current = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/auth?redirect=${encodeURIComponent(current)}`);
      }
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    meApi()
      .then((profile) => {
        const normalizedProfile = normalizeUser(profile);
        setUser(normalizedProfile);
        setStoredUser(normalizedProfile);
      })
      .catch(() => {
        clearTokens();
        setStoredUser(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!isAdminRole(user?.role)) {
      return;
    }
    enableAdminPushNotifications().catch(() => {
      // intentionally silent when browser does not support push or permission is denied
    });
  }, [user?.id, user?.role]);

  /** Refresh tokens when the user is clearly active (typing, clicking, scrolling, moving the mouse).
   * Without this, long forms (e.g. course registration) can sit idle of API calls until the access
   * JWT expires and the next request fails with session expired. */
  useEffect(() => {
    if (!user) return undefined;

    const MIN_MS_BETWEEN_REFRESH = 5 * 60_000;
    const MOUSE_MOVE_THROTTLE_MS = 2 * 60_000;

    let lastRefreshAt = 0;
    let lastMouseTriggeredAt = 0;
    let inFlight = false;

    const runRefresh = async () => {
      const rt = getRefreshToken();
      if (!rt || inFlight) return;

      const now = Date.now();
      if (now - lastRefreshAt < MIN_MS_BETWEEN_REFRESH) return;

      inFlight = true;
      lastRefreshAt = now;
      try {
        const res = await refreshSessionApi(rt);
        setTokens(res.accessToken, res.refreshToken);
        const normalizedProfile = normalizeUser(res.user);
        setUser(normalizedProfile);
        setStoredUser(normalizedProfile);
      } catch (error) {
        const status = typeof error === 'object' && error !== null && 'status' in error
          ? (error as { status?: number }).status
          : undefined;
        if (status === 400 || status === 401) {
          window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
          return;
        }
        lastRefreshAt = Date.now() - MIN_MS_BETWEEN_REFRESH + 15_000;
      } finally {
        inFlight = false;
      }
    };

    const onStrongActivity = () => {
      void runRefresh();
    };

    const onMouseMove = () => {
      const now = Date.now();
      if (now - lastMouseTriggeredAt < MOUSE_MOVE_THROTTLE_MS) return;
      lastMouseTriggeredAt = now;
      void runRefresh();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void runRefresh();
      }
    };

    window.addEventListener('keydown', onStrongActivity);
    window.addEventListener('pointerdown', onStrongActivity);
    window.addEventListener('wheel', onStrongActivity, { passive: true });
    window.addEventListener('scroll', onStrongActivity, true);
    window.addEventListener('touchstart', onStrongActivity, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('keydown', onStrongActivity);
      window.removeEventListener('pointerdown', onStrongActivity);
      window.removeEventListener('wheel', onStrongActivity, true);
      window.removeEventListener('scroll', onStrongActivity, true);
      window.removeEventListener('touchstart', onStrongActivity);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user?.id]);

  const handleAuthSuccess = (response: { accessToken: string; refreshToken: string; user: User }) => {
    const normalizedUser = normalizeUser(response.user);
    setTokens(response.accessToken, response.refreshToken);
    setUser(normalizedUser);
    setStoredUser(normalizedUser);
  };

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await loginApi(payload);
      handleAuthSuccess(response);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: SignupPayload) => {
    setIsLoading(true);
    try {
      const response = await signupApi(payload);
      handleAuthSuccess(response);
    } finally {
      setIsLoading(false);
    }
  };

  const applyOAuthTokens = async (accessToken: string, refreshToken: string) => {
    setIsLoading(true);
    try {
      setTokens(accessToken, refreshToken);
      const profile = await meApi();
      const normalizedProfile = normalizeUser(profile);
      setUser(normalizedProfile);
      setStoredUser(normalizedProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();
    setIsLoading(true);
    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } finally {
      clearTokens();
      setStoredUser(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const value = useMemo(() => ({
    user,
    isLoggedIn: !!user,
    isLoading,
    login,
    signup,
    applyOAuthTokens,
    logout,
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
