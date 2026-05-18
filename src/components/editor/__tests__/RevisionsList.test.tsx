import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';

vi.mock('@/lib/editorApi', () => ({
  listRevisions: vi.fn(),
  restoreRevision: vi.fn(),
  downloadRevisionUrl: (docId: string, revId: string) =>
    `/api/editor/v1/documents/${docId}/revisions/${revId}/download`,
}));

import { fireEvent } from '@testing-library/react';
import { listRevisions, restoreRevision } from '@/lib/editorApi';
import { RevisionsList } from '../RevisionsList';

const mockList = listRevisions as unknown as ReturnType<typeof vi.fn>;
const mockRestore = restoreRevision as unknown as ReturnType<typeof vi.fn>;

function rev(overrides: Partial<{
  id: string;
  documentId: string;
  message: string;
  createdAt: string;
}>) {
  return {
    id: overrides.id ?? 'rev-1',
    documentId: overrides.documentId ?? 'doc-1',
    authorUserId: 'u',
    message: overrides.message,
    createdAt: overrides.createdAt ?? '2026-05-13T15:30:00Z',
  };
}

describe('RevisionsList', () => {
  it('renders nothing when documentId is null', () => {
    mockList.mockReset();
    render(<RevisionsList documentId={null} refreshKey={0} />);
    expect(screen.queryByTestId('revisions-list')).toBeNull();
    expect(mockList).not.toHaveBeenCalled();
  });

  it('shows an empty-state message when the document has no revisions', async () => {
    mockList.mockReset();
    mockList.mockResolvedValueOnce([]);
    render(<RevisionsList documentId="doc-1" refreshKey={0} />);
    await waitFor(() =>
      expect(screen.getByText(/No edits yet/i)).toBeInTheDocument()
    );
    // Count is shown in the summary.
    expect(screen.getByText(/Revision history \(0\)/)).toBeInTheDocument();
  });

  it('lists revisions with a download link for each', async () => {
    mockList.mockReset();
    mockList.mockResolvedValueOnce([
      rev({ id: 'rev-a', message: 'rotate cover', createdAt: '2026-05-13T15:30:00Z' }),
      rev({ id: 'rev-b', message: '', createdAt: '2026-05-13T15:45:00Z' }),
    ]);
    render(<RevisionsList documentId="doc-1" refreshKey={0} />);
    await waitFor(() =>
      expect(screen.getByTestId('revisions-list-items')).toBeInTheDocument()
    );
    expect(screen.getByTestId('revision-rev-a')).toBeInTheDocument();
    expect(screen.getByTestId('revision-rev-b')).toBeInTheDocument();
    expect(screen.getByText(/rotate cover/)).toBeInTheDocument();
    // Empty message → "no message" placeholder.
    expect(screen.getByText(/no message/i)).toBeInTheDocument();

    // Each row has a Download anchor pointing at the per-revision URL.
    const revA = screen.getByTestId('revision-rev-a');
    const anchor = revA.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toBe(
      '/api/editor/v1/documents/doc-1/revisions/rev-a/download'
    );
    expect(anchor!.hasAttribute('download')).toBe(true);
  });

  it('surfaces fetch errors via an alert', async () => {
    mockList.mockReset();
    mockList.mockRejectedValueOnce(new Error('boom'));
    render(<RevisionsList documentId="doc-1" refreshKey={0} />);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/boom/)
    );
  });

  it('refetches when refreshKey changes', async () => {
    mockList.mockReset();
    mockList.mockResolvedValue([]);
    const { rerender } = render(
      <RevisionsList documentId="doc-1" refreshKey={0} />
    );
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));
    rerender(<RevisionsList documentId="doc-1" refreshKey={1} />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
    // documentId stays the same; refreshKey changed → second fetch.
    expect(mockList).toHaveBeenLastCalledWith('doc-1');
  });

  it('refetches when documentId changes', async () => {
    mockList.mockReset();
    mockList.mockResolvedValue([]);
    const { rerender } = render(
      <RevisionsList documentId="doc-1" refreshKey={0} />
    );
    await waitFor(() => expect(mockList).toHaveBeenCalledWith('doc-1'));
    rerender(<RevisionsList documentId="doc-2" refreshKey={0} />);
    await waitFor(() => expect(mockList).toHaveBeenCalledWith('doc-2'));
  });

  it('calls restoreRevision and onAfterRestore on confirm', async () => {
    mockList.mockReset();
    mockRestore.mockReset();
    mockList.mockResolvedValueOnce([
      rev({ id: 'rev-a', message: 'rotate cover' }),
    ]);
    mockRestore.mockResolvedValueOnce({
      id: 'rev-new',
      documentId: 'doc-1',
      authorUserId: 'u',
      createdAt: '2026-05-13T16:00:00Z',
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onAfterRestore = vi.fn();
    render(
      <RevisionsList
        documentId="doc-1"
        refreshKey={0}
        onAfterRestore={onAfterRestore}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('revision-rev-a')).toBeInTheDocument()
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: /Restore document to revision/i,
      })
    );
    await waitFor(() => expect(mockRestore).toHaveBeenCalledTimes(1));
    expect(mockRestore).toHaveBeenCalledWith('doc-1', 'rev-a');
    await waitFor(() =>
      expect(onAfterRestore).toHaveBeenCalledWith('rev-new')
    );
    confirmSpy.mockRestore();
  });

  it('does not call restoreRevision if user cancels confirm', async () => {
    mockList.mockReset();
    mockRestore.mockReset();
    mockList.mockResolvedValueOnce([rev({ id: 'rev-a' })]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onAfterRestore = vi.fn();
    render(
      <RevisionsList
        documentId="doc-1"
        refreshKey={0}
        onAfterRestore={onAfterRestore}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('revision-rev-a')).toBeInTheDocument()
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Restore document to revision/i })
    );
    expect(mockRestore).not.toHaveBeenCalled();
    expect(onAfterRestore).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('surfaces restore errors via the alert region', async () => {
    mockList.mockReset();
    mockRestore.mockReset();
    mockList.mockResolvedValueOnce([rev({ id: 'rev-a' })]);
    mockRestore.mockRejectedValueOnce(new Error('storage offline'));
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<RevisionsList documentId="doc-1" refreshKey={0} />);
    await waitFor(() =>
      expect(screen.getByTestId('revision-rev-a')).toBeInTheDocument()
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Restore document to revision/i })
    );
    await waitFor(() =>
      expect(screen.getByTestId('restore-error')).toHaveTextContent(
        /storage offline/
      )
    );
    confirmSpy.mockRestore();
  });

  it('formats malformed timestamps without throwing', async () => {
    mockList.mockReset();
    mockList.mockResolvedValueOnce([
      rev({ id: 'rev-x', message: 'weird', createdAt: 'not-a-date' }),
    ]);
    render(<RevisionsList documentId="doc-1" refreshKey={0} />);
    await waitFor(() =>
      expect(screen.getByTestId('revision-rev-x')).toBeInTheDocument()
    );
    // The component surfaces the raw string instead of throwing.
    expect(screen.getByText('not-a-date')).toBeInTheDocument();
  });
});
