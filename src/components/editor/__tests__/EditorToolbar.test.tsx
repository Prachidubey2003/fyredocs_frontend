import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@/test/test-utils';

import { EditorToolbar, nearestZoomLevel, ZOOM_LEVELS } from '../EditorToolbar';

// Stub the editor API so the toolbar tests don't hit the network.
vi.mock('@/lib/editorApi', () => ({
  applyOps: vi.fn(),
  downloadDocumentUrl: (id: string) =>
    `/api/editor/v1/documents/${id}/download`,
}));

import { applyOps } from '@/lib/editorApi';

const mockApplyOps = applyOps as unknown as ReturnType<typeof vi.fn>;

/**
 * Default props for the toolbar. Individual tests override `documentId`,
 * `currentPage`, or the callbacks; the rest stay constant so a render
 * always exercises a complete prop set.
 */
function defaultProps(overrides: Partial<React.ComponentProps<typeof EditorToolbar>> = {}) {
  return {
    documentId: 'doc-1',
    currentPage: 1,
    onAfterEdit: vi.fn(),
    selectionMode: null as 'highlight' | 'sticky' | null,
    onSelectionModeChange: vi.fn(),
    zoom: 1.0,
    onZoomChange: vi.fn(),
    ...overrides,
  };
}

describe('EditorToolbar', () => {
  it('renders all six controls', () => {
    render(<EditorToolbar {...defaultProps()} />);
    expect(screen.getByRole('button', { name: /Rotate page 1/ })).toBeInTheDocument();
    // Highlight is a toggle — aria-label depends on state.
    expect(
      screen.getByRole('button', { name: /highlight mode/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sticky-note mode/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Insert a blank page after/ })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete page 1/ })).toBeInTheDocument();
    // Download is an anchor (true browser download) rather than a button.
    expect(screen.getByText('Download').closest('a')).not.toBeNull();
  });

  it('disables edit buttons in local-file mode (no documentId)', () => {
    render(<EditorToolbar {...defaultProps({ documentId: null })} />);
    expect(screen.getByRole('button', { name: /Rotate page 1/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /highlight mode/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /sticky-note mode/i })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /Insert a blank page after/ })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /Delete page 1/ })).toBeDisabled();
    // Download becomes a disabled <button> rather than an anchor.
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
  });

  it('calls applyOps with page.rotate when Rotate is clicked', async () => {
    mockApplyOps.mockReset();
    mockApplyOps.mockResolvedValueOnce({
      id: 'rev-1',
      documentId: 'doc-1',
      authorUserId: 'u',
      createdAt: '',
    });
    const onAfterEdit = vi.fn();
    render(
      <EditorToolbar
        {...defaultProps({ currentPage: 3, onAfterEdit })}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Rotate page 3/ }));

    await waitFor(() => expect(mockApplyOps).toHaveBeenCalledTimes(1));
    expect(mockApplyOps).toHaveBeenCalledWith('doc-1', [
      { type: 'page.rotate', page: 3, rotation: 90 },
    ]);
    await waitFor(() => expect(onAfterEdit).toHaveBeenCalledWith('rev-1'));
  });

  it('wraps rotation 0 → 90 → 180 → 270 → 0 across successive clicks', async () => {
    mockApplyOps.mockReset();
    mockApplyOps.mockImplementation(async () => ({
      id: 'rev',
      documentId: 'doc-1',
      authorUserId: 'u',
      createdAt: '',
    }));
    render(<EditorToolbar {...defaultProps()} />);
    const btn = screen.getByRole('button', { name: /Rotate page 1/ });
    for (const want of [90, 180, 270, 0] as const) {
      fireEvent.click(btn);
      await waitFor(() => expect(mockApplyOps).toHaveBeenCalled());
      const lastCall = mockApplyOps.mock.calls[mockApplyOps.mock.calls.length - 1];
      const ops = lastCall[1] as Array<{ rotation: number }>;
      expect(ops[0].rotation).toBe(want);
    }
  });

  it('toggles highlight mode on/off via the Highlight button', () => {
    const onSelectionModeChange = vi.fn();
    const { rerender } = render(
      <EditorToolbar {...defaultProps({ onSelectionModeChange })} />
    );
    // Not in highlight mode → clicking enables it.
    fireEvent.click(screen.getByRole('button', { name: /highlight mode/i }));
    expect(onSelectionModeChange).toHaveBeenLastCalledWith('highlight');

    // Re-render with mode active → clicking disables it.
    rerender(
      <EditorToolbar
        {...defaultProps({
          selectionMode: 'highlight',
          onSelectionModeChange,
        })}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Exit highlight mode/i }));
    expect(onSelectionModeChange).toHaveBeenLastCalledWith(null);
  });

  it('toggles sticky mode on/off via the Sticky button', () => {
    const onSelectionModeChange = vi.fn();
    const { rerender } = render(
      <EditorToolbar {...defaultProps({ onSelectionModeChange })} />
    );
    fireEvent.click(screen.getByRole('button', { name: /sticky-note mode/i }));
    expect(onSelectionModeChange).toHaveBeenLastCalledWith('sticky');

    rerender(
      <EditorToolbar
        {...defaultProps({
          selectionMode: 'sticky',
          onSelectionModeChange,
        })}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Exit sticky-note mode/i }));
    expect(onSelectionModeChange).toHaveBeenLastCalledWith(null);
  });

  it('reflects sticky-on state in the button label and aria-pressed', () => {
    render(
      <EditorToolbar {...defaultProps({ selectionMode: 'sticky' })} />
    );
    const btn = screen.getByRole('button', { name: /Exit sticky-note mode/i });
    expect(btn).toHaveTextContent(/Sticky: on/i);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('reflects highlight-on state in the button label and aria-pressed', () => {
    render(
      <EditorToolbar
        {...defaultProps({ selectionMode: 'highlight' })}
      />
    );
    const btn = screen.getByRole('button', { name: /Exit highlight mode/i });
    expect(btn).toHaveTextContent(/Highlight: on/i);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('surfaces API errors via the alert region', async () => {
    mockApplyOps.mockReset();
    mockApplyOps.mockRejectedValueOnce(new Error('server says no'));
    render(<EditorToolbar {...defaultProps()} />);
    fireEvent.click(screen.getByRole('button', { name: /Rotate page 1/ }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/server says no/);
    });
  });

  it('calls applyOps with page.insert when "Insert blank" is clicked', async () => {
    mockApplyOps.mockReset();
    mockApplyOps.mockResolvedValueOnce({
      id: 'rev-i',
      documentId: 'doc-1',
      authorUserId: 'u',
      createdAt: '',
    });
    const onAfterEdit = vi.fn();
    render(
      <EditorToolbar {...defaultProps({ currentPage: 3, onAfterEdit })} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Insert a blank page after page 3/ }));

    await waitFor(() => expect(mockApplyOps).toHaveBeenCalledTimes(1));
    expect(mockApplyOps).toHaveBeenCalledWith('doc-1', [
      { type: 'page.insert', afterPage: 3 },
    ]);
    await waitFor(() => expect(onAfterEdit).toHaveBeenCalledWith('rev-i'));
  });

  it('calls applyOps with page.delete after confirm', async () => {
    mockApplyOps.mockReset();
    mockApplyOps.mockResolvedValueOnce({
      id: 'rev-d',
      documentId: 'doc-1',
      authorUserId: 'u',
      createdAt: '',
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onAfterEdit = vi.fn();
    render(
      <EditorToolbar
        {...defaultProps({ currentPage: 5, onAfterEdit })}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Delete page 5/ }));

    await waitFor(() => expect(mockApplyOps).toHaveBeenCalledTimes(1));
    expect(mockApplyOps).toHaveBeenCalledWith('doc-1', [
      { type: 'page.delete', page: 5 },
    ]);
    await waitFor(() => expect(onAfterEdit).toHaveBeenCalledWith('rev-d'));
    confirmSpy.mockRestore();
  });

  it('does not call applyOps if user cancels the delete confirm', () => {
    mockApplyOps.mockReset();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onAfterEdit = vi.fn();
    render(
      <EditorToolbar {...defaultProps({ onAfterEdit })} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Delete page 1/ }));
    expect(mockApplyOps).not.toHaveBeenCalled();
    expect(onAfterEdit).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('nearestZoomLevel snaps to the closest preset', () => {
    expect(nearestZoomLevel(1.0)).toBe(1.0);
    expect(nearestZoomLevel(1.4)).toBe(1.5);
    expect(nearestZoomLevel(0.6)).toBe(0.5);
    expect(nearestZoomLevel(10)).toBe(ZOOM_LEVELS[ZOOM_LEVELS.length - 1]);
    expect(nearestZoomLevel(0.01)).toBe(ZOOM_LEVELS[0]);
  });

  it('renders the zoom controls and current percent', () => {
    render(<EditorToolbar {...defaultProps({ zoom: 1.25 })} />);
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    // The percentage button is the "reset zoom" target; check the label too.
    const reset = screen.getByTestId('zoom-percent');
    expect(reset).toHaveTextContent('125%');
  });

  it('Zoom in steps up through ZOOM_LEVELS', () => {
    const onZoomChange = vi.fn();
    render(<EditorToolbar {...defaultProps({ zoom: 1.0, onZoomChange })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    // 1.0 → 1.25 (next entry in the preset table).
    expect(onZoomChange).toHaveBeenCalledWith(1.25);
  });

  it('Zoom out steps down through ZOOM_LEVELS', () => {
    const onZoomChange = vi.fn();
    render(<EditorToolbar {...defaultProps({ zoom: 1.0, onZoomChange })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    // 1.0 → 0.75.
    expect(onZoomChange).toHaveBeenCalledWith(0.75);
  });

  it('disables Zoom out at the minimum preset', () => {
    render(<EditorToolbar {...defaultProps({ zoom: 0.5 })} />);
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom in' })).not.toBeDisabled();
  });

  it('disables Zoom in at the maximum preset', () => {
    render(<EditorToolbar {...defaultProps({ zoom: 2.0 })} />);
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom out' })).not.toBeDisabled();
  });

  it('resets zoom to 100% when the percent button is clicked', () => {
    const onZoomChange = vi.fn();
    render(<EditorToolbar {...defaultProps({ zoom: 1.5, onZoomChange })} />);
    fireEvent.click(screen.getByTestId('zoom-percent'));
    expect(onZoomChange).toHaveBeenCalledWith(1.0);
  });

  it('points the download link at the right URL', () => {
    render(<EditorToolbar {...defaultProps({ documentId: 'doc-42' })} />);
    const anchor = screen.getByText('Download').closest('a');
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toBe(
      '/api/editor/v1/documents/doc-42/download'
    );
    expect(anchor!.hasAttribute('download')).toBe(true);
  });
});
