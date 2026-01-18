import { useEffect, useState } from 'react';
import {
  AuthState,
  getAuthState,
  subscribeAuth,
  setAuthToken,
  setUserId,
  setGuestToken,
  clearAuth,
} from '@/lib/auth';

export const useAuth = () => {
  const [auth, setAuth] = useState<AuthState>(() => getAuthState());

  useEffect(() => {
    const unsubscribe = subscribeAuth(setAuth);
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    auth,
    setAuthToken,
    setUserId,
    setGuestToken,
    clearAuth,
  };
};
