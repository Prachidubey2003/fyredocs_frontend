import { ToolDefinition, ToolNavGroup } from '@/types';
import { getAllTools } from '@/config/tools';

/**
 * Navigation structure derived from the tool registry.
 * Group metadata (title + category token styles) lives here; membership
 * comes from each tool's `navGroup` field in src/config/tools.ts.
 */

export interface NavGroupMeta {
  id: ToolNavGroup;
  title: string;
  /** Short label for compact contexts (mobile nav, command palette groups). */
  shortTitle: string;
  /** Static Tailwind classes bound to the category tokens (JIT-visible). */
  styles: {
    text: string;
    bg: string;
    border: string;
  };
}

export const NAV_GROUPS: NavGroupMeta[] = [
  {
    id: 'organize',
    title: 'Organize PDF',
    shortTitle: 'Organize',
    styles: { text: 'text-category-organize', bg: 'bg-category-organize-subtle', border: 'border-category-organize' },
  },
  {
    id: 'optimize',
    title: 'Optimize PDF',
    shortTitle: 'Optimize',
    styles: { text: 'text-category-optimize', bg: 'bg-category-optimize-subtle', border: 'border-category-optimize' },
  },
  {
    id: 'convert-to-pdf',
    title: 'Convert to PDF',
    shortTitle: 'To PDF',
    styles: { text: 'text-category-convert-to', bg: 'bg-category-convert-to-subtle', border: 'border-category-convert-to' },
  },
  {
    id: 'convert-from-pdf',
    title: 'Convert from PDF',
    shortTitle: 'From PDF',
    styles: { text: 'text-category-convert-from', bg: 'bg-category-convert-from-subtle', border: 'border-category-convert-from' },
  },
  {
    id: 'libreoffice',
    title: 'LibreOffice',
    shortTitle: 'LibreOffice',
    styles: { text: 'text-category-libreoffice', bg: 'bg-category-libreoffice-subtle', border: 'border-category-libreoffice' },
  },
  {
    id: 'edit',
    title: 'Edit PDF',
    shortTitle: 'Edit',
    styles: { text: 'text-category-edit', bg: 'bg-category-edit-subtle', border: 'border-category-edit' },
  },
  {
    id: 'security',
    title: 'PDF Security',
    shortTitle: 'Security',
    styles: { text: 'text-category-security', bg: 'bg-category-security-subtle', border: 'border-category-security' },
  },
];

export const getNavGroupMeta = (id: ToolNavGroup): NavGroupMeta =>
  NAV_GROUPS.find((g) => g.id === id) ?? NAV_GROUPS[0];

export const getToolsByNavGroup = (group: ToolNavGroup): ToolDefinition[] =>
  getAllTools().filter((tool) => tool.navGroup === group);

/** Tool display name in navigation contexts (navLabel wins over name). */
export const toolNavName = (tool: ToolDefinition): string => tool.navLabel ?? tool.name;
