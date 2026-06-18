import { apiJson, apiRequest } from '@/lib/apiClient';

export type OrgRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ApiOrg {
  id: string;
  name: string;
  slug: string;
  ownerUserId?: string;
  planName?: string;
  role: OrgRole;
  createdAt?: string;
}

type Envelope<T> = { success: boolean; message: string; data: T };

export const listOrgs = async (): Promise<ApiOrg[]> => {
  try {
    const res = await apiJson<Envelope<ApiOrg[]>>('/api/orgs');
    return res.data ?? [];
  } catch {
    return [];
  }
};

export const createOrg = (name: string): Promise<ApiOrg> =>
  apiJson<Envelope<ApiOrg>>('/api/orgs', { method: 'POST', body: JSON.stringify({ name }) }).then((r) => r.data);

export interface ApiMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  createdAt: string;
}

export const listMembers = async (orgId: string): Promise<ApiMember[]> => {
  try {
    const res = await apiJson<Envelope<ApiMember[]>>(`/api/orgs/${orgId}/members`);
    return res.data ?? [];
  } catch {
    return [];
  }
};

export const addMember = (orgId: string, userId: string, role: OrgRole): Promise<void> =>
  apiJson(`/api/orgs/${orgId}/members`, { method: 'POST', body: JSON.stringify({ userId, role }) }).then(() => undefined);

export const updateMemberRole = (orgId: string, userId: string, role: OrgRole): Promise<void> =>
  apiJson(`/api/orgs/${orgId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify({ role }) }).then(() => undefined);

export const removeMember = (orgId: string, userId: string): Promise<void> =>
  apiRequest(`/api/orgs/${orgId}/members/${userId}`, { method: 'DELETE' }).then(() => undefined);

/** Roles that can write (create/move/delete) in an org. */
export const canWrite = (role: OrgRole): boolean => role === 'owner' || role === 'admin' || role === 'editor';

/** Roles that can manage members. */
export const canManageMembers = (role: OrgRole): boolean => role === 'owner' || role === 'admin';
