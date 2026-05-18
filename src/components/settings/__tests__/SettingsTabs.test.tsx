import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { SettingsTabs } from '../SettingsTabs';

// Helper: render at a specific initial path so we can check
// the active-tab logic without simulating navigation.
function renderAt(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <SettingsTabs />
    </MemoryRouter>,
  );
}

describe('SettingsTabs', () => {
  it('renders all three tabs as links to /account/*', () => {
    renderAt('/account/billing');
    expect(screen.getByRole('link', { name: /billing/i })).toHaveAttribute(
      'href',
      '/account/billing',
    );
    expect(screen.getByRole('link', { name: /api keys/i })).toHaveAttribute(
      'href',
      '/account/api-keys',
    );
    expect(screen.getByRole('link', { name: /webhooks/i })).toHaveAttribute(
      'href',
      '/account/webhooks',
    );
  });

  it('marks the matching tab as the current page', () => {
    renderAt('/account/webhooks');
    const webhooks = screen.getByRole('link', { name: /webhooks/i });
    expect(webhooks).toHaveAttribute('aria-current', 'page');
    // Other tabs are NOT current.
    expect(screen.getByRole('link', { name: /billing/i })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: /api keys/i })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('matches the parent tab on nested paths', () => {
    // Prefix-match is by design: future nested routes like
    // /account/webhooks/deliveries/:id should highlight the
    // Webhooks tab without an updated map.
    renderAt('/account/webhooks/deliveries/abc-123');
    const webhooks = screen.getByRole('link', { name: /webhooks/i });
    expect(webhooks).toHaveAttribute('aria-current', 'page');
  });

  it('renders no current-page marker when the path is not a settings page', () => {
    // Defence: a future bug that mounts the tabs outside the
    // /account/* tree shouldn't false-mark Billing as current.
    renderAt('/some/other/page');
    for (const name of [/billing/i, /api keys/i, /webhooks/i]) {
      expect(screen.getByRole('link', { name })).not.toHaveAttribute('aria-current');
    }
  });
});
