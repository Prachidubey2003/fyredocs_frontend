import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** One entry in the settings tab bar. Order is significant —
 *  rendered left-to-right in the listed order. */
const tabs: { label: string; href: string }[] = [
  { label: 'Billing & usage', href: '/account/billing' },
  { label: 'API keys', href: '/account/api-keys' },
  { label: 'Webhooks', href: '/account/webhooks' },
];

/**
 * Horizontal tab nav rendered at the top of every Account
 * settings page. Lets a user who landed on Billing discover
 * API keys and Webhooks without bouncing through the header
 * dropdown.
 *
 * Active-tab matching is prefix-based so future nested routes
 * (e.g., `/account/webhooks/deliveries/:id`) highlight the
 * right parent tab without an updated map.
 *
 * Same visual idiom as the docs tab bar (`DocsLayout.tsx`) —
 * keeps account-side navigation feeling consistent with docs
 * navigation.
 */
export function SettingsTabs() {
  const location = useLocation();
  const activeIndex = tabs.findIndex((t) => location.pathname.startsWith(t.href));

  return (
    <div className="-mx-4 mb-6 border-b">
      <nav className="flex items-center gap-0 overflow-x-auto px-4">
        {tabs.map((tab, i) => {
          const active = i === activeIndex;
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                'whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
              aria-current={active ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
