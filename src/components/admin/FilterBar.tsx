import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { TimeRangeSelect } from '@/components/admin/TimeRangeSelect';
import { findAdminSection } from '@/components/admin/adminNav';
import { cn } from '@/lib/utils';
import { CalendarRange, ChevronDown, Globe, Layers, MapPin } from 'lucide-react';

/**
 * Filters not yet supported by the backend. Rendered disabled with a "Soon"
 * badge so the IA is visible while the data dimensions are built out. The
 * future query-param names are noted for when they go live: `env`, `region`,
 * `segment`.
 */
const PLANNED_FILTERS = [
  { label: 'Environment', icon: Globe },
  { label: 'Region', icon: MapPin },
  { label: 'Segment', icon: Layers },
] as const;

function DisabledFilter({ label, icon: Icon }: { label: string; icon: typeof Globe }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled
          aria-disabled
          className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-md border border-input bg-muted/40 px-2.5 text-sm text-muted-foreground opacity-70"
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">{label}</span>
          <Badge variant="outline" className="ml-0.5 h-4 px-1 text-[10px] font-medium">
            Soon
          </Badge>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <span className="text-xs">{label} filtering is coming soon.</span>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Global filter bar: working date range plus planned (disabled) environment,
 * region, and segment filters. The date range is disabled on realtime pages
 * whose hooks ignore `?days=`.
 */
export function FilterBar({ pathname, className }: { pathname: string; className?: string }) {
  const section = findAdminSection(pathname);

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2 overflow-x-auto', className)}>
        <span className="hidden items-center gap-1.5 text-caption font-medium text-muted-foreground md:flex">
          <CalendarRange className="h-3.5 w-3.5" aria-hidden />
          Filters
        </span>

        {section.supportsTimeRange ? (
          <TimeRangeSelect />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex h-9 cursor-default items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                Realtime
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <span className="text-xs">This view refreshes live every few seconds and ignores the date range.</span>
            </TooltipContent>
          </Tooltip>
        )}

        {PLANNED_FILTERS.map((f) => (
          <DisabledFilter key={f.label} label={f.label} icon={f.icon} />
        ))}
      </div>
    </TooltipProvider>
  );
}
