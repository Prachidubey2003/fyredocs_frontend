/**
 * Shared Recharts theming for the admin dashboard.
 *
 * All colors resolve through the design-system chart tokens
 * (`--chart-1…6`, `--chart-success/warning/danger`) so charts stay in sync
 * with light/dark themes. Never use literal hsl/hex values in chart props.
 */

export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
] as const;

export const SEMANTIC = {
  success: 'hsl(var(--chart-success))',
  warning: 'hsl(var(--chart-warning))',
  danger: 'hsl(var(--chart-danger))',
  primary: 'hsl(var(--chart-1))',
} as const;

/** Shared axis defaults — spread into <XAxis>/<YAxis>. */
export const AXIS_PROPS = {
  tickLine: false,
  axisLine: false,
  fontSize: 12,
  stroke: 'hsl(var(--muted-foreground))',
} as const;

/** Shared grid defaults — spread into <CartesianGrid>. */
export const GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: 'hsl(var(--border))',
} as const;

/** Hover cursor fill for bar/area tooltips. */
export const TOOLTIP_CURSOR = {
  fill: 'hsl(var(--muted) / 0.4)',
} as const;

/** Tone class for a success-rate style percentage (higher is better). */
export function rateToneClass(pct: number, good = 95, warn = 80): string {
  if (pct >= good) return 'text-success';
  if (pct >= warn) return 'text-warning';
  return 'text-destructive';
}

/** Tone class for a utilization percentage (lower is better). */
export function usageToneClass(pct: number, warn = 60, bad = 80): string {
  if (pct > bad) return 'text-destructive';
  if (pct > warn) return 'text-warning';
  return 'text-success';
}

/** Chart color (for rings/fills) for a utilization percentage (lower is better). */
export function usageToneColor(pct: number, warn = 50, bad = 80): string {
  if (pct > bad) return SEMANTIC.danger;
  if (pct > warn) return SEMANTIC.warning;
  return SEMANTIC.success;
}

/** Chart color for a success-rate style percentage (higher is better). */
export function rateToneColor(pct: number, good = 95, warn = 80): string {
  if (pct >= good) return SEMANTIC.success;
  if (pct >= warn) return SEMANTIC.warning;
  return SEMANTIC.danger;
}

/**
 * Shortens an endpoint path for vertical-bar YAxis ticks: keeps the last two
 * segments and prefixes an ellipsis (e.g. `/api/v1/files/upload` → `…/files/upload`).
 */
export function shortenPath(path: string, maxLength = 24): string {
  const segments = path.split('/').filter(Boolean);
  const short = segments.length > 2 ? `…/${segments.slice(-2).join('/')}` : path;
  return short.length > maxLength ? `${short.slice(0, maxLength - 1)}…` : short;
}

/** Truncates a label for axis ticks. */
export function truncateLabel(label: string, max = 14): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}
