import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AuthCredentials,
  AuthSignupCredentials,
  AuthUser,
  getMe,
  login,
  logout,
  signup,
} from '@/auth/authClient';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  role: string | null;
  login: (credentials: AuthCredentials) => Promise<AuthUser | null>;
  signup: (credentials: AuthSignupCredentials) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Bootstrap session state from server cookie
  const syncUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const me = await getMe();
      setUser(me);
      setRole(me.role ?? null);
      setIsAuthenticated(true);
    } catch {
      // Session cookie is invalid or expired
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void syncUser();
  }, [syncUser]);

  const handleLogin = useCallback(
    async (credentials: AuthCredentials) => {
      const response = await login(credentials);
      if (response.user) {
        setUser(response.user);
        setRole(response.user.role ?? null);
        setIsAuthenticated(true);
        return response.user;
      }
      await syncUser();
      return null;
    },
    [syncUser]
  );

  const handleSignup = useCallback(
    async (credentials: AuthSignupCredentials) => {
      const response = await signup(credentials);
      if (response.user) {
        setUser(response.user);
        setRole(response.user.role ?? null);
        setIsAuthenticated(true);
        return response.user;
      }
      await syncUser();
      return null;
    },
    [syncUser]
  );

  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logout();
    } finally {
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      role,
      login: handleLogin,
      signup: handleSignup,
      logout: handleLogout,
    }),
    [handleLogin, handleLogout, handleSignup, isAuthenticated, isLoading, role, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
