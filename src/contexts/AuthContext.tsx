import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { User } from '@/types';
import { login as loginApi, signup as signupApi, logout as logoutApi, me as meApi, LoginPayload, SignupPayload } from '@/lib/auth-api';
import { clearTokens, getAccessToken, getRefreshToken, getStoredUser, setStoredUser, setTokens } from '@/lib/auth-storage';

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      setUser(null);
      setStoredUser(null);
    }
  }, []);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }

    if (!user) {
      setIsLoading(true);
      meApi()
        .then((profile) => {
          setUser(profile);
          setStoredUser(profile);
        })
        .catch(() => {
          clearTokens();
          setStoredUser(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  const handleAuthSuccess = (response: { accessToken: string; refreshToken: string; user: User }) => {
    setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
    setStoredUser(response.user);
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
      setUser(profile);
      setStoredUser(profile);
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
