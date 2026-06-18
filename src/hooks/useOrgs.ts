import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listOrgs,
  createOrg,
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
  type OrgRole,
} from '@/lib/orgsApi';

export const useOrgs = () =>
  useQuery({
    queryKey: ['orgs'],
    queryFn: listOrgs,
    staleTime: 5 * 60 * 1000,
  });

export const useCreateOrg = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createOrg(name),
    onSettled: () => void qc.invalidateQueries({ queryKey: ['orgs'] }),
  });
};

export const useMembers = (orgId?: string) =>
  useQuery({
    queryKey: ['members', orgId],
    queryFn: () => listMembers(orgId as string),
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });

export const useAddMember = (orgId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: OrgRole }) => addMember(orgId, userId, role),
    onSettled: () => void qc.invalidateQueries({ queryKey: ['members', orgId] }),
  });
};

export const useUpdateMemberRole = (orgId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: OrgRole }) => updateMemberRole(orgId, userId, role),
    onSettled: () => void qc.invalidateQueries({ queryKey: ['members', orgId] }),
  });
};

export const useRemoveMember = (orgId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeMember(orgId, userId),
    onSettled: () => void qc.invalidateQueries({ queryKey: ['members', orgId] }),
  });
};
