import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { render } from '@/test/test-utils';
import { UsageTable } from '../UsageTable';

describe('UsageTable', () => {
  it('renders unavailable hint when usage is null', () => {
    render(<UsageTable usage={null} />);
    expect(screen.getByText(/usage data is temporarily unavailable/i)).toBeInTheDocument();
  });

  it('renders empty-state when items array is empty', () => {
    render(<UsageTable usage={{ userId: 'u1', period: '2026-05', items: [] }} />);
    expect(screen.getByText(/no metered usage for 2026-05 yet/i)).toBeInTheDocument();
  });

  it('renders a row per item with localised quantity formatting', () => {
    render(
      <UsageTable
        usage={{
          userId: 'u1',
          period: '2026-05',
          items: [
            // Distinct totalQuantity vs eventCount so each cell is
            // uniquely findable in the rendered DOM.
            { eventType: 'op.merge', unit: 'ops', totalQuantity: 12_500, eventCount: 7 },
            { eventType: 'op.ocr', unit: 'pages', totalQuantity: 50, eventCount: 1 },
          ],
        }}
      />,
    );
    expect(screen.getByText('op.merge')).toBeInTheDocument();
    expect(screen.getByText('op.ocr')).toBeInTheDocument();
    // 12500 formats with a thousands separator under the test
    // environment's locale (en-US by default in JSDOM).
    expect(screen.getByText('12,500')).toBeInTheDocument();
  });
});
