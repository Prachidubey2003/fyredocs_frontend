import { useTheme } from 'next-themes';
import { ExternalLink } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/typography';
import { buttonVariants } from '@/components/ui/button';

/**
 * Base path Grafana is served from. Same-origin `/grafana` by default (proxied
 * by the Caddy edge and gated with forward_auth); overridable for cross-origin
 * setups, mirroring VITE_API_BASE_URL.
 */
const GRAFANA_BASE = (import.meta.env.VITE_GRAFANA_BASE_URL as string | undefined)?.trim() || '/grafana';

/** Provisioned overview dashboard (deployment/grafana/dashboards/fyredocs-overview.json). */
const DASHBOARD_UID = 'fyredocs-overview';

/**
 * Shared service → colour key. The by-service charts hide their own legends
 * (they'd repeat this 11-row list on every panel); this single key documents
 * the mapping instead. Colours MUST match the fixed per-series `color`
 * overrides in fyredocs-overview.json.
 */
const SERVICE_COLORS: readonly { label: string; color: string }[] = [
  { label: 'analytics-service', color: '#73BF69' },
  { label: 'api-gateway', color: '#3B82F6' },
  { label: 'auth-service', color: '#FF9830' },
  { label: 'convert-from-pdf', color: '#FACC15' },
  { label: 'convert-to-pdf', color: '#EF4444' },
  { label: 'document-service', color: '#A855F7' },
  { label: 'job-service', color: '#EC4899' },
  { label: 'notification-service', color: '#06B6D4' },
  { label: 'optimize-pdf', color: '#84CC16' },
  { label: 'organize-pdf', color: '#F97316' },
  { label: 'user-service', color: '#6366F1' },
];

const ObservabilityPage = () => {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'light' ? 'light' : 'dark';

  // kiosk hides Grafana's own chrome for a clean embed; theme matches the app.
  const dashboardPath = `${GRAFANA_BASE}/d/${DASHBOARD_UID}/${DASHBOARD_UID}?kiosk&theme=${theme}`;
  const grafanaHome = `${GRAFANA_BASE}/`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Observability"
        description="Metrics and traces from the Grafana / Prometheus / Tempo stack"
        actions={
          <a
            href={grafanaHome}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Open in Grafana
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </a>
        }
      />

      <Text variant="body-sm" tone="muted">
        Requires the observability stack:{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
          docker compose --profile observability up -d
        </code>
        . If the panel is blank, the stack is not running.
      </Text>

      {/* Shared service colour key — the by-service charts hide their legends
          to stay readable, so the mapping lives here once. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
        <span className="text-caption font-medium text-muted-foreground">Services</span>
        {SERVICE_COLORS.map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            {label}
          </span>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <iframe
            key={theme}
            title="Grafana — fyredocs overview"
            src={dashboardPath}
            className="h-[calc(100vh-16rem)] min-h-[600px] w-full border-0"
            loading="lazy"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ObservabilityPage;
