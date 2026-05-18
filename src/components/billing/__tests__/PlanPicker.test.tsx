import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';

import { render } from '@/test/test-utils';
import { PlanPicker } from '../PlanPicker';
import type { Plan } from '@/lib/billingApi';

const plans: Plan[] = [
  {
    code: 'free',
    name: 'Free',
    description: 'Starter tier',
    monthlyPriceCents: 0,
    perSeat: false,
    selfServe: true,
    limits: {},
  },
  {
    code: 'pro',
    name: 'Pro',
    description: 'Individual paid tier',
    monthlyPriceCents: 1500,
    perSeat: false,
    selfServe: true,
    limits: {},
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    description: 'Sales-led',
    monthlyPriceCents: -1,
    perSeat: true,
    selfServe: false,
    limits: {},
  },
];

describe('PlanPicker', () => {
  it('marks the current plan with "Current plan" + disables its button', () => {
    render(<PlanPicker plans={plans} currentCode="pro" busy={false} onSwitch={vi.fn()} />);
    const currentButton = screen.getByRole('button', { name: /current plan/i });
    expect(currentButton).toBeDisabled();
  });

  it('renders a "Switch" button for non-current self-serve plans', () => {
    const onSwitch = vi.fn();
    render(<PlanPicker plans={plans} currentCode="pro" busy={false} onSwitch={onSwitch} />);
    // Free is not the current plan and is self-serve → has a Switch button.
    fireEvent.click(screen.getByRole('button', { name: /^switch$/i }));
    expect(onSwitch).toHaveBeenCalledWith('free');
  });

  it('renders "Contact sales" mailto link for non-self-serve plans', () => {
    render(<PlanPicker plans={plans} currentCode="pro" busy={false} onSwitch={vi.fn()} />);
    const cta = screen.getByRole('link', { name: /contact sales/i });
    expect(cta).toHaveAttribute('href');
    expect(cta.getAttribute('href') ?? '').toMatch(/^mailto:/);
  });

  it('disables every Switch button when `busy` is true', () => {
    render(<PlanPicker plans={plans} currentCode="pro" busy={true} onSwitch={vi.fn()} />);
    const switching = screen.getByRole('button', { name: /switching…/i });
    expect(switching).toBeDisabled();
  });
});
