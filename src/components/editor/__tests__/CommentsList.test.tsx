import { describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@/test/test-utils';

vi.mock('@/lib/editorApi', () => ({
  listComments: vi.fn(),
  addComment: vi.fn(),
  resolveComment: vi.fn(),
}));

// Stub useCollab so tests can drive the live-update handler
// directly. The hook's own tests cover the WS plumbing; this
// component test just verifies the integration: the JSON event
// handler folds correctly into local state.
let latestOnMessage: ((payload: Uint8Array) => void) | undefined;
vi.mock('@/hooks/useCollab', () => ({
  useCollab: (_docId: string | null | undefined, opts?: { onMessage?: (p: Uint8Array) => void }) => {
    latestOnMessage = opts?.onMessage;
    return {
      state: 'idle' as const,
      send: () => false,
      reconnect: () => {},
    };
  },
}));

import { addComment, listComments, resolveComment } from '@/lib/editorApi';
import { CommentsList } from '../CommentsList';

const mockList = listComments as unknown as ReturnType<typeof vi.fn>;
const mockAdd = addComment as unknown as ReturnType<typeof vi.fn>;
const mockResolve = resolveComment as unknown as ReturnType<typeof vi.fn>;

const deliver = (ev: unknown) => {
  if (!latestOnMessage) throw new Error('useCollab not yet wired');
  act(() => {
    latestOnMessage!(new TextEncoder().encode(JSON.stringify(ev)));
  });
};

function comment(overrides: Partial<{
  id: string;
  body: string;
  resolved: boolean;
  page: number;
  createdAt: string;
  parentCommentId: string;
}>) {
  return {
    id: overrides.id ?? 'c-1',
    documentId: 'doc-1',
    revId: 'rev-1',
    anchor: { type: 'page' as const, page: overrides.page ?? 1 },
    body: overrides.body ?? 'looks great',
    authorUserId: 'u',
    resolved: overrides.resolved ?? false,
    createdAt: overrides.createdAt ?? '2026-05-14T10:00:00Z',
    ...(overrides.parentCommentId
      ? { parentCommentId: overrides.parentCommentId }
      : {}),
  };
}

describe('CommentsList', () => {
  it('renders nothing when documentId is null', () => {
    mockList.mockReset();
    render(
      <CommentsList
        documentId={null}
        currentRevId={null}
        currentPage={1}
        refreshKey={0}
      />
    );
    expect(screen.queryByTestId('comments-list')).toBeNull();
    expect(mockList).not.toHaveBeenCalled();
  });

  it('disables the add-form when currentRevId is null', async () => {
    mockList.mockReset();
    mockList.mockResolvedValueOnce([]);
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId={null}
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('new-comment-body')).toBeInTheDocument()
    );
    expect(screen.getByTestId('new-comment-body')).toBeDisabled();
    expect(screen.getByRole('button', { name: /Post comment/i })).toBeDisabled();
    // The "make an edit first" hint should appear.
    expect(
      screen.getByText(/No revision yet — make any edit to enable comments/i)
    ).toBeInTheDocument();
  });

  it('lists existing comments and shows the empty-state otherwise', async () => {
    mockList.mockReset();
    mockList.mockResolvedValueOnce([]);
    const { rerender } = render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={2}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByText(/No comments yet/i)).toBeInTheDocument()
    );

    mockList.mockResolvedValueOnce([
      comment({ id: 'c-a', body: 'review this' }),
    ]);
    rerender(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={2}
        refreshKey={1}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('comment-c-a')).toBeInTheDocument()
    );
    expect(screen.getByText(/review this/)).toBeInTheDocument();
  });

  it('submits a new comment with the page anchor + revId', async () => {
    mockList.mockReset();
    mockAdd.mockReset();
    mockList.mockResolvedValueOnce([]);
    mockAdd.mockResolvedValueOnce(
      comment({ id: 'c-new', body: 'first thoughts', page: 3 })
    );
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={3}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('new-comment-body')).not.toBeDisabled()
    );
    fireEvent.change(screen.getByTestId('new-comment-body'), {
      target: { value: 'first thoughts' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Post comment/i }));

    await waitFor(() => expect(mockAdd).toHaveBeenCalledTimes(1));
    expect(mockAdd).toHaveBeenCalledWith(
      'doc-1',
      'rev-1',
      { type: 'page', page: 3 },
      'first thoughts'
    );
    // After success the new comment should appear at the top of the list.
    await waitFor(() =>
      expect(screen.getByTestId('comment-c-new')).toBeInTheDocument()
    );
  });

  it('does not submit empty/whitespace bodies', async () => {
    mockList.mockReset();
    mockAdd.mockReset();
    mockList.mockResolvedValueOnce([]);
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('new-comment-body')).not.toBeDisabled()
    );
    fireEvent.change(screen.getByTestId('new-comment-body'), {
      target: { value: '   ' },
    });
    const btn = screen.getByRole('button', { name: /Post comment/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('resolves a comment and reflects the new state locally', async () => {
    mockList.mockReset();
    mockResolve.mockReset();
    mockList.mockResolvedValueOnce([comment({ id: 'c-a' })]);
    mockResolve.mockResolvedValueOnce(undefined);
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('comment-c-a')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /^Resolve comment$/ }));
    await waitFor(() => expect(mockResolve).toHaveBeenCalledTimes(1));
    expect(mockResolve).toHaveBeenCalledWith('doc-1', 'c-a');
    // After success the row should show "resolved" instead of the button.
    await waitFor(() =>
      expect(screen.getByText(/^resolved$/i)).toBeInTheDocument()
    );
  });

  it('surfaces submit errors via alert region', async () => {
    mockList.mockReset();
    mockAdd.mockReset();
    mockList.mockResolvedValueOnce([]);
    mockAdd.mockRejectedValueOnce(new Error('server angry'));
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('new-comment-body')).not.toBeDisabled()
    );
    fireEvent.change(screen.getByTestId('new-comment-body'), {
      target: { value: 'hi' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Post comment/i }));
    await waitFor(() =>
      expect(screen.getByTestId('comment-submit-error')).toHaveTextContent(
        /server angry/
      )
    );
  });

  it('nests replies under their parent', async () => {
    mockList.mockReset();
    mockList.mockResolvedValueOnce([
      comment({ id: 'p-1', body: 'thread starter' }),
      comment({
        id: 'r-1',
        body: 'first reply',
        parentCommentId: 'p-1',
        createdAt: '2026-05-14T11:00:00Z',
      }),
      comment({
        id: 'r-2',
        body: 'second reply',
        parentCommentId: 'p-1',
        createdAt: '2026-05-14T12:00:00Z',
      }),
    ]);
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('comment-p-1')).toBeInTheDocument()
    );
    // Both replies should render INSIDE the parent's nested list,
    // not as siblings of the parent comment.
    const repliesContainer = screen.getByTestId('replies-p-1');
    expect(repliesContainer).toContainElement(screen.getByTestId('reply-r-1'));
    expect(repliesContainer).toContainElement(screen.getByTestId('reply-r-2'));
    // The replies themselves must NOT show their own "Reply" button —
    // v0 enforces single-depth threading and the UI should match.
    expect(screen.queryByTestId('open-reply-r-1')).toBeNull();
  });

  it('posts a reply with parentCommentId and shows it in the thread', async () => {
    mockList.mockReset();
    mockAdd.mockReset();
    mockList.mockResolvedValueOnce([
      comment({ id: 'p-1', body: 'thread starter' }),
    ]);
    mockAdd.mockResolvedValueOnce(
      comment({
        id: 'r-new',
        body: 'a thoughtful reply',
        parentCommentId: 'p-1',
        createdAt: '2026-05-14T11:00:00Z',
      })
    );
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('open-reply-p-1')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByTestId('open-reply-p-1'));
    await waitFor(() =>
      expect(screen.getByTestId('reply-form-p-1')).toBeInTheDocument()
    );

    fireEvent.change(screen.getByTestId('reply-body-p-1'), {
      target: { value: 'a thoughtful reply' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Post reply/i }));

    await waitFor(() => expect(mockAdd).toHaveBeenCalledTimes(1));
    expect(mockAdd).toHaveBeenCalledWith(
      'doc-1',
      'rev-1',
      { type: 'page', page: 1 },
      'a thoughtful reply',
      'p-1'
    );
    // The new reply should appear in the thread without a refetch.
    await waitFor(() =>
      expect(screen.getByTestId('reply-r-new')).toBeInTheDocument()
    );
    // The reply form should have closed on success.
    expect(screen.queryByTestId('reply-form-p-1')).toBeNull();
  });

  it('Cancel closes the reply form without posting', async () => {
    mockList.mockReset();
    mockAdd.mockReset();
    mockList.mockResolvedValueOnce([
      comment({ id: 'p-1', body: 'thread starter' }),
    ]);
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('open-reply-p-1')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByTestId('open-reply-p-1'));
    fireEvent.change(screen.getByTestId('reply-body-p-1'), {
      target: { value: 'never mind' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.queryByTestId('reply-form-p-1')).toBeNull();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('renders authorDisplayName when present', async () => {
    mockList.mockReset();
    mockList.mockResolvedValueOnce([
      {
        ...comment({ id: 'c-named', body: 'with a name' }),
        authorDisplayName: 'Alice Wonder',
      },
    ]);
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('comment-c-named')).toBeInTheDocument()
    );
    expect(screen.getByText(/Alice Wonder/)).toBeInTheDocument();
  });

  it('inserts a comment from a live comment.added event', async () => {
    mockList.mockReset();
    mockList.mockResolvedValueOnce([]);
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByText(/No comments yet/i)).toBeInTheDocument()
    );
    deliver({
      kind: 'comment.added',
      docId: 'doc-1',
      comment: comment({ id: 'c-live', body: 'from elsewhere' }),
    });
    await waitFor(() =>
      expect(screen.getByTestId('comment-c-live')).toBeInTheDocument()
    );
    expect(screen.getByText(/from elsewhere/)).toBeInTheDocument();
  });

  it('dedupes a live comment.added that matches a local row', async () => {
    // The user's own write was already optimistically inserted
    // by handleSubmit; receiving the same event over the wire
    // must not duplicate the row.
    mockList.mockReset();
    mockList.mockResolvedValueOnce([
      comment({ id: 'c-mine', body: 'I wrote this' }),
    ]);
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('comment-c-mine')).toBeInTheDocument()
    );
    deliver({
      kind: 'comment.added',
      docId: 'doc-1',
      comment: comment({ id: 'c-mine', body: 'I wrote this' }),
    });
    // Still exactly one row — no duplicate.
    expect(screen.getAllByTestId('comment-c-mine')).toHaveLength(1);
  });

  it('appends a reply from comment.added when parentCommentId is set', async () => {
    mockList.mockReset();
    mockList.mockResolvedValueOnce([
      comment({ id: 'p-1', body: 'parent thread' }),
    ]);
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('comment-p-1')).toBeInTheDocument()
    );
    deliver({
      kind: 'comment.added',
      docId: 'doc-1',
      comment: {
        ...comment({
          id: 'r-live',
          body: 'live reply',
          createdAt: '2026-05-14T12:00:00Z',
        }),
        parentCommentId: 'p-1',
      },
    });
    await waitFor(() =>
      expect(screen.getByTestId('reply-r-live')).toBeInTheDocument()
    );
    // The reply renders inside the parent's nested list, not as
    // a sibling top-level comment.
    expect(screen.getByTestId('replies-p-1')).toContainElement(
      screen.getByTestId('reply-r-live')
    );
  });

  it('marks a comment resolved from a live comment.resolved event', async () => {
    mockList.mockReset();
    mockList.mockResolvedValueOnce([comment({ id: 'c-r' })]);
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('comment-c-r')).toBeInTheDocument()
    );
    // Before the event the "Resolve" button is visible.
    expect(screen.getByTestId('resolve-c-r')).toBeInTheDocument();

    deliver({ kind: 'comment.resolved', docId: 'doc-1', id: 'c-r' });

    await waitFor(() =>
      expect(screen.getByText(/^resolved$/i)).toBeInTheDocument()
    );
    expect(screen.queryByTestId('resolve-c-r')).toBeNull();
  });

  it('ignores live frames that are not JSON comment events', async () => {
    mockList.mockReset();
    mockList.mockResolvedValueOnce([comment({ id: 'c-keep' })]);
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('comment-c-keep')).toBeInTheDocument()
    );
    // Non-JSON binary payload — forward-compat with future Yjs frames.
    act(() => {
      latestOnMessage!(new Uint8Array([1, 2, 3, 4]));
    });
    // Unknown JSON kind — also ignored.
    deliver({ kind: 'something.else', docId: 'doc-1' });
    // Original comment still there, no exceptions thrown.
    expect(screen.getByTestId('comment-c-keep')).toBeInTheDocument();
  });

  it('falls back to a truncated UUID when display name is absent', async () => {
    mockList.mockReset();
    mockList.mockResolvedValueOnce([
      {
        ...comment({ id: 'c-id' }),
        authorUserId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        // no authorDisplayName
      },
    ]);
    render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId('comment-c-id')).toBeInTheDocument()
    );
    // Truncated to 8 chars + ellipsis.
    expect(screen.getByText(/aaaaaaaa…/)).toBeInTheDocument();
  });

  it('refetches when refreshKey changes', async () => {
    mockList.mockReset();
    mockList.mockResolvedValue([]);
    const { rerender } = render(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={0}
      />
    );
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));
    rerender(
      <CommentsList
        documentId="doc-1"
        currentRevId="rev-1"
        currentPage={1}
        refreshKey={1}
      />
    );
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
  });
});
