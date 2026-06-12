import { Link } from 'react-router-dom';
import { ToolDefinition } from '@/types';
import { ToolIcon } from '@/components/icons/ToolIcon';
import { Badge } from '@/components/ui/badge';
import { getNavGroupMeta } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface ToolCardProps {
  tool: ToolDefinition;
  className?: string;
}

export const ToolCard = ({ tool, className }: ToolCardProps) => {
  const group = getNavGroupMeta(tool.navGroup);

  return (
    <Link
      to={tool.route}
      className={cn(
        'tool-card group block rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        {/* Category-colored icon tile */}
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-base',
            group.styles.bg,
          )}
        >
          <ToolIcon icon={tool.icon} size="lg" className={group.styles.text} />
        </div>
        {tool.popular && <Badge variant="info">Popular</Badge>}
      </div>

      {/* Content */}
      <h3 className="mb-1.5 text-h4 transition-colors group-hover:text-primary">{tool.name}</h3>
      <p className="mb-4 line-clamp-2 text-body-sm text-muted-foreground">{tool.description}</p>

      {/* Action hint */}
      <div className="flex items-center gap-2 text-body-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        <span>Use tool</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
      </div>
    </Link>
  );
};
