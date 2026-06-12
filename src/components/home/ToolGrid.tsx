import { getAllTools } from '@/config/tools';
import { ToolCard } from './ToolCard';
import { ToolCategory, ToolDefinition } from '@/types';

interface ToolGridProps {
  /** Explicit tool list — takes precedence over category filtering. */
  tools?: ToolDefinition[];
  category?: ToolCategory;
  limit?: number;
  columns?: 2 | 3 | 4;
}

const gridColsClass: Record<number, string> = {
  2: 'grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6',
  3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
  4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6',
};

export const ToolGrid = ({ tools: providedTools, category, limit, columns = 4 }: ToolGridProps) => {
  let tools = providedTools ?? getAllTools();

  if (!providedTools && category) {
    tools = tools.filter((tool) => tool.category === category);
  }

  if (limit) {
    tools = tools.slice(0, limit);
  }

  return (
    <div className={gridColsClass[columns]}>
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
};
