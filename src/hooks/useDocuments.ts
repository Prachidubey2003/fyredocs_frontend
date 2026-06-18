import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listDocuments,
  listFolders,
  listTags,
  deleteDocument,
  restoreDocument,
  purgeDocument,
  updateDocument,
  attachTag,
  detachTag,
  createFolder,
  deleteFolder,
  createTag,
  deleteTag,
  type DocumentListParams,
} from '@/lib/documentsApi';

const DOCS_KEY = ['documents'] as const;

export const useDocuments = (params: DocumentListParams = {}) =>
  useQuery({
    queryKey: [...DOCS_KEY, params],
    queryFn: () => listDocuments(params),
    staleTime: 30 * 1000,
  });

export const useFolders = (orgId?: string) =>
  useQuery({
    queryKey: ['folders', orgId ?? null],
    queryFn: () => listFolders(orgId),
    staleTime: 5 * 60 * 1000,
  });

export const useTags = (orgId?: string) =>
  useQuery({
    queryKey: ['tags', orgId ?? null],
    queryFn: () => listTags(orgId),
    staleTime: 5 * 60 * 1000,
  });

export const useDeleteDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, orgId }: { id: string; orgId?: string }) => deleteDocument(id, orgId),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: DOCS_KEY });
    },
  });
};

/** Move a document between workspaces: an org id, or null for personal. */
export const useMoveToOrg = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetOrgId, currentOrgId }: { id: string; targetOrgId: string | null; currentOrgId?: string }) =>
      updateDocument(id, { organizationId: targetOrgId ?? '' }, currentOrgId),
    onSettled: () => void qc.invalidateQueries({ queryKey: DOCS_KEY }),
  });
};

export const useRestoreDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreDocument(id),
    onSettled: () => void qc.invalidateQueries({ queryKey: DOCS_KEY }),
  });
};

export const usePurgeDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purgeDocument(id),
    onSettled: () => void qc.invalidateQueries({ queryKey: DOCS_KEY }),
  });
};

/** Move a document to a folder (folderId) or to root (null). */
export const useMoveDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, folderId, orgId }: { id: string; folderId: string | null; orgId?: string }) =>
      updateDocument(id, { folderId: folderId ?? '' }, orgId),
    onSettled: () => void qc.invalidateQueries({ queryKey: DOCS_KEY }),
  });
};

/** Attach or detach a tag on a document. */
export const useToggleTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, tagId, attached, orgId }: { documentId: string; tagId: string; attached: boolean; orgId?: string }) =>
      attached ? detachTag(documentId, tagId, orgId) : attachTag(documentId, tagId, orgId),
    onSettled: () => void qc.invalidateQueries({ queryKey: DOCS_KEY }),
  });
};

export const useCreateFolder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, parentId, orgId }: { name: string; parentId?: string; orgId?: string }) =>
      createFolder(name, parentId, orgId),
    onSettled: () => void qc.invalidateQueries({ queryKey: ['folders'] }),
  });
};

export const useDeleteFolder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, orgId }: { id: string; orgId?: string }) => deleteFolder(id, orgId),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['folders'] });
      void qc.invalidateQueries({ queryKey: DOCS_KEY });
    },
  });
};

export const useCreateTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color, orgId }: { name: string; color?: string; orgId?: string }) =>
      createTag(name, color, orgId),
    onSettled: () => void qc.invalidateQueries({ queryKey: ['tags'] }),
  });
};

export const useDeleteTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, orgId }: { id: string; orgId?: string }) => deleteTag(id, orgId),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['tags'] });
      void qc.invalidateQueries({ queryKey: DOCS_KEY });
    },
  });
};
