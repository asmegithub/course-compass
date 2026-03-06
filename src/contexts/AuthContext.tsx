import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { User } from '@/types';
import { login as loginApi, signup as signupApi, logout as logoutApi, me as meApi, LoginPayload, SignupPayload } from '@/lib/auth-api';
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
