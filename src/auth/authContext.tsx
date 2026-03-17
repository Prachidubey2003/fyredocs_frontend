import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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
  plan: string;
  login: (credentials: AuthCredentials) => Promise<AuthUser | null>;
  signup: (credentials: AuthSignupCredentials) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>('anonymous');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Navigate to sign-in and clear auth state when a 401/403 occurs anywhere in the app
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setRole(null);
      setPlan('anonymous');
      setIsAuthenticated(false);
      navigate('/signin', { replace: true });
    };
    window.addEventListener('esydocs:unauthorized', handler);
    return () => window.removeEventListener('esydocs:unauthorized', handler);
  }, [navigate]);

  // Bootstrap session state from server cookie
  const syncUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const me = await getMe();
      setUser(me);
      setRole(me.role ?? null);
      setPlan((me.planName as string | undefined) ?? 'free');
      setIsAuthenticated(true);
    } catch {
      // Session cookie is invalid or expired
      setUser(null);
      setRole(null);
      setPlan('anonymous');
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
        setPlan((response.user.planName as string | undefined) ?? 'free');
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
        setPlan((response.user.planName as string | undefined) ?? 'free');
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
      setPlan('anonymous');
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
      plan,
      login: handleLogin,
      signup: handleSignup,
      logout: handleLogout,
    }),
    [handleLogin, handleLogout, handleSignup, isAuthenticated, isLoading, role, user, plan]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
