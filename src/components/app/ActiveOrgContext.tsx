/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useOrgs } from '@/hooks/useOrgs';
import type { ApiOrg } from '@/lib/orgsApi';

const STORAGE_KEY = 'fyredocs:activeOrgId';

/**
 * Reads the persisted active org id without React context — for use outside the
 * /app shell (e.g. the tool workbench), which still needs to know which
 * workspace a new job should finalize into.
 */
export function getActiveOrgId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

interface ActiveOrgValue {
  /** null = Personal scope. */
  activeOrgId: string | null;
  activeOrg: ApiOrg | null;
  orgs: ApiOrg[];
  isLoading: boolean;
  setActiveOrg: (orgId: string | null) => void;
}

const ActiveOrgContext = createContext<ActiveOrgValue | undefined>(undefined);

export function useActiveOrg(): ActiveOrgValue {
  const ctx = useContext(ActiveOrgContext);
  if (!ctx) throw new Error('useActiveOrg must be used within ActiveOrgProvider');
  return ctx;
}

export function ActiveOrgProvider({ children }: { children: React.ReactNode }) {
  const { data: orgs = [], isLoading } = useOrgs();
  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  // Drop a stale selection if the user is no longer a member of that org.
  useEffect(() => {
    if (activeOrgId && !isLoading && !orgs.some((o) => o.id === activeOrgId)) {
      setActiveOrgId(null);
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [activeOrgId, orgs, isLoading]);

  const setActiveOrg = useCallback((orgId: string | null) => {
    setActiveOrgId(orgId);
    try {
      if (orgId) window.localStorage.setItem(STORAGE_KEY, orgId);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<ActiveOrgValue>(
    () => ({
      activeOrgId,
      activeOrg: orgs.find((o) => o.id === activeOrgId) ?? null,
      orgs,
      isLoading,
      setActiveOrg,
    }),
    [activeOrgId, orgs, isLoading, setActiveOrg],
  );

  return <ActiveOrgContext.Provider value={value}>{children}</ActiveOrgContext.Provider>;
}
