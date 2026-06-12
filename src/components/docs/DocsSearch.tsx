import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useAuth } from '@/auth/useAuth';
import { buildSearchIndex, type DocSearchEntry } from '@/lib/docsNavigation';

interface DocsSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_RESULTS = 30;
const SNIPPET_RADIUS = 60;

interface SearchResult {
  entry: DocSearchEntry;
  snippet: string;
}

/** Build a "…context around the first match…" snippet, or fall back to the description. */
const matchSnippet = (entry: DocSearchEntry, query: string): string => {
  if (!query) return entry.description;
  const haystack = entry.content;
  const index = haystack.toLowerCase().indexOf(query);
  if (index === -1) return entry.description;
  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(haystack.length, index + query.length + SNIPPET_RADIUS);
  return `${start > 0 ? '…' : ''}${haystack.slice(start, end).trim()}${end < haystack.length ? '…' : ''}`;
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
};

/**
 * Docs-scoped search dialog over the full docs + dev-docs content index.
 *
 * Keyboard shortcut tradeoff: the global command palette (CommandPaletteProvider
 * in Layout) already binds ⌘K/Ctrl-K, and docs routes render inside that Layout —
 * binding ⌘K here too would open both dialogs. So docs search deliberately binds
 * ONLY the "/" key (plus the visible top-bar trigger). The global palette also
 * listens for "/", so we intercept it in the capture phase and stop propagation
 * to keep the two from toggling simultaneously while a docs route is mounted.
 */
export const DocsSearch = ({ open, onOpenChange }: DocsSearchProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  // Same gate DocsLayout uses for the dev-docs tabs/sidebar.
  const isSuperAdmin = user?.role === 'super-admin';

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isEditableTarget(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        onOpenChange(true);
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [onOpenChange]);

  const index = useMemo(
    () => buildSearchIndex().filter((entry) => entry.area === 'docs' || isSuperAdmin),
    [isSuperAdmin],
  );

  const grouped = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matches = index
      .filter(
        (entry) =>
          !normalized ||
          entry.title.toLowerCase().includes(normalized) ||
          entry.headings.some((heading) => heading.toLowerCase().includes(normalized)) ||
          entry.content.toLowerCase().includes(normalized),
      )
      .slice(0, MAX_RESULTS);

    const groups = new Map<string, SearchResult[]>();
    for (const entry of matches) {
      const label = entry.area === 'dev-docs' ? `Developer · ${entry.group}` : entry.group;
      const bucket = groups.get(label) ?? [];
      bucket.push({ entry, snippet: matchSnippet(entry, normalized) });
      groups.set(label, bucket);
    }
    return groups;
  }, [index, query]);

  const handleSelect = (entry: DocSearchEntry) => {
    onOpenChange(false);
    setQuery('');
    navigate(`${entry.area === 'dev-docs' ? '/dev-docs' : '/docs'}/${entry.slug}`);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setQuery('');
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="lg" className="overflow-hidden p-0 shadow-lg">
        <DialogTitle className="sr-only">Search documentation</DialogTitle>
        {/* shouldFilter is off — substring matching over the content index happens above. */}
        <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12">
          <CommandInput
            placeholder="Search docs…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No docs match your search.</CommandEmpty>
            {[...grouped.entries()].map(([label, results]) => (
              <CommandGroup key={label} heading={label}>
                {results.map(({ entry, snippet }) => (
                  <CommandItem
                    key={`${entry.area}/${entry.slug}`}
                    value={`${entry.area}/${entry.slug}`}
                    onSelect={() => handleSelect(entry)}
                    className="flex items-start gap-2.5 py-2.5"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">{entry.title}</div>
                      <div className="line-clamp-2 text-xs text-muted-foreground">{snippet}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};
