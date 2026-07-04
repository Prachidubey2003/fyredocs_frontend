/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AuthCredentials,
  AuthSignupCredentials,
  AuthUser,
  getMe,
  login,
  logout,
  refreshSession,
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
  const [plan, setPlan] = useState<string>('guest');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accessExpiresAtRef = useRef<number | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Schedule a refresh 2 minutes before the access token expires.
  // Uses the server-provided expiry timestamp (accessExpiresAt) since the
  // access_token cookie is HttpOnly and cannot be read by JavaScript.
  const scheduleTokenRefresh = useCallback(
    (expiresAtMs?: number | null) => {
      clearRefreshTimer();

      const expiryMs = expiresAtMs ?? accessExpiresAtRef.current;
      if (!expiryMs) return;

      accessExpiresAtRef.current = expiryMs;

      const refreshAt = expiryMs - 2 * 60 * 1000; // 2 minutes before expiry
      const delay = refreshAt - Date.now();

      if (delay <= 0) return; // already past refresh window

      refreshTimerRef.current = setTimeout(async () => {
        try {
          const result = await refreshSession();
          if (result) {
            setUser(result.user);
            setRole(result.user.role ?? null);
            setPlan((result.user.planName as string | undefined) ?? 'free');
            setIsAuthenticated(true);
            scheduleTokenRefresh(result.accessExpiresAt);
          }
        } catch {
          // refresh failed — user will get 401 on next API call
        }
      }, delay);
    },
    [clearRefreshTimer]
  );

  const hydrateAuth = useCallback(
    (me: AuthUser, accessExpiresAt?: number | null) => {
      setUser(me);
      setRole(me.role ?? null);
      setPlan((me.planName as string | undefined) ?? 'free');
      setIsAuthenticated(true);
      scheduleTokenRefresh(accessExpiresAt);
    },
    [scheduleTokenRefresh]
  );

  const clearAuth = useCallback(() => {
    setUser(null);
    setRole(null);
    setPlan('guest');
    setIsAuthenticated(false);
    clearRefreshTimer();
  }, [clearRefreshTimer]);

  // Navigate to sign-in and clear auth state when a 401/403 occurs anywhere in the app
  useEffect(() => {
    const handler = () => {
      clearAuth();
      navigate('/signin', { replace: true });
    };
    window.addEventListener('fyredocs:unauthorized', handler);
    return () => window.removeEventListener('fyredocs:unauthorized', handler);
  }, [navigate, clearAuth]);

  // Bootstrap session state from server cookie
  const syncUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const me = await getMe();
      hydrateAuth(me);
    } catch {
      // Access token may be expired — try refreshing before giving up
      try {
        const result = await refreshSession();
        if (result) {
          hydrateAuth(result.user, result.accessExpiresAt);
          return;
        }
      } catch {
        // refresh also failed — session is truly gone
      }
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [hydrateAuth, clearAuth]);

  useEffect(() => {
    void syncUser();
  }, [syncUser]);

  // Re-check auth when the tab becomes visible again (e.g., after sleeping)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        const expiryMs = accessExpiresAtRef.current;
        if (!expiryMs) {
          // No known expiry — try to refresh
          void syncUser();
          return;
        }
        if (Date.now() >= expiryMs - 60 * 1000) {
          // Token expired or expiring within 1 minute — refresh now
          refreshSession()
            .then((result) => {
              if (result) {
                hydrateAuth(result.user, result.accessExpiresAt);
              }
            })
            .catch(() => {
              // Will be handled by next API call's 401 flow
            });
        } else {
          // Token still valid — reschedule refresh timer (may have drifted while backgrounded)
          scheduleTokenRefresh();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, syncUser, hydrateAuth, scheduleTokenRefresh]);

  const handleLogin = useCallback(
    async (credentials: AuthCredentials) => {
      const response = await login(credentials);
      if (response.user) {
        hydrateAuth(response.user, response.accessExpiresAt);
        return response.user;
      }
      await syncUser();
      return null;
    },
    [syncUser, hydrateAuth]
  );

  const handleSignup = useCallback(
    async (credentials: AuthSignupCredentials) => {
      const response = await signup(credentials);
      if (response.user) {
        hydrateAuth(response.user, response.accessExpiresAt);
        return response.user;
      }
      await syncUser();
      return null;
    },
    [syncUser, hydrateAuth]
  );

  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logout();
    } finally {
      clearAuth();
      setIsLoading(false);
    }
  }, [clearAuth]);

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
