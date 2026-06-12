import { ToolDefinition } from '@/types';
import { toolNavName } from '@/config/navigation';

/**
 * Shared tool search/ranking used by the command palette, mobile nav inline
 * search, and the /tools page so results stay consistent everywhere.
 * Simple substring ranking — 39 items don't need a fuzzy library.
 */
export const filterTools = (query: string, tools: ToolDefinition[]): ToolDefinition[] => {
  const q = query.trim().toLowerCase();
  if (!q) return tools;

  const scored = tools
    .map((tool) => {
      const name = tool.name.toLowerCase();
      const navLabel = toolNavName(tool).toLowerCase();
      const description = tool.description.toLowerCase();
      const keywords = (tool.keywords ?? []).join(' ').toLowerCase();

      let score = 0;
      if (name.startsWith(q) || navLabel.startsWith(q)) score = 4;
      else if (name.includes(q) || navLabel.includes(q)) score = 3;
      else if (keywords.includes(q)) score = 2;
      else if (description.includes(q)) score = 1;

      return { tool, score };
    })
    .filter((entry) => entry.score > 0);

  scored.sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name));
  return scored.map((entry) => entry.tool);
};
