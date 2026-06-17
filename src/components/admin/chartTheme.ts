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

/** Operational status → chart color, for health strips and status dots. */
export type HealthStatus = 'healthy' | 'warning' | 'critical';

export const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: SEMANTIC.success,
  warning: SEMANTIC.warning,
  critical: SEMANTIC.danger,
};

/** Token class for a status indicator background. */
export const STATUS_BG: Record<HealthStatus, string> = {
  healthy: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-destructive',
};

/** Default chart inner margins — tight, Datadog-style. */
export const CHART_MARGINS = { top: 8, right: 12, bottom: 0, left: 0 } as const;

/** Sparkline line/area defaults — no dots, thin stroke. */
export const SPARKLINE_PROPS = {
  strokeWidth: 1.75,
  dot: false,
  activeDot: false,
  isAnimationActive: false,
} as const;

/** Standard Recharts animation timing used across the dashboard. */
export const ANIM = { animationDuration: 700, animationEasing: 'ease-out' } as const;

const compactFmt = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/** 12_400 → "12.4K"; small numbers pass through. */
export function formatCompact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return Math.abs(value) >= 1000 ? compactFmt.format(value) : String(Math.round(value));
}

/** Full thousands-separated integer, e.g. 12,400. */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US');
}

/** Ratio (0–1) → "94.2%". Pass `alreadyPct` when the value is already 0–100. */
export function formatPercent(value: number | null | undefined, decimals = 1, alreadyPct = false): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const pct = alreadyPct ? value : value * 100;
  return `${pct.toFixed(decimals)}%`;
}

/** Milliseconds → "842ms" / "1.2s". */
export function formatMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

/** Seconds → "0.84s" / "1.2s". */
export function formatSeconds(s: number | null | undefined, decimals = 1): string {
  if (s == null || !Number.isFinite(s)) return '—';
  return `${s.toFixed(decimals)}s`;
}

/** Estimated currency, compact for large values: 12.4K → "$12.4K". */
export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const symbol = currency === 'USD' ? '$' : `${currency} `;
  return Math.abs(value) >= 1000 ? `${symbol}${compactFmt.format(value)}` : `${symbol}${value.toFixed(0)}`;
}

/** Short month/day for time-axis ticks: "2026-06-17" → "Jun 17". */
export function formatDateTick(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Hour tick for intraday series: ISO → "14:00". */
export function formatHourTick(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}
