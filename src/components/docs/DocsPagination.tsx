import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/typography';
import { getAdjacentDocs, type FlatNavItem, type NavGroupLike } from '@/lib/docsNavigation';

interface DocsPaginationProps {
  slug: string;
  groups: NavGroupLike[];
  basePath: '/docs' | '/dev-docs';
  className?: string;
}

const PaginationCard = ({
  doc,
  basePath,
  direction,
}: {
  doc: FlatNavItem;
  basePath: string;
  direction: 'prev' | 'next';
}) => (
  <Link
    to={`${basePath}/${doc.slug}`}
    className={cn(
      'group flex flex-col gap-1 rounded-xl border bg-card p-4 transition-colors duration-base hover:border-primary/40 hover:bg-muted/50',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      direction === 'next' && 'items-end text-right sm:col-start-2',
    )}
  >
    <Text variant="overline" tone="muted" as="span" className="flex items-center gap-1">
      {direction === 'prev' && <ArrowLeft className="w-3.5 h-3.5" aria-hidden />}
      {direction === 'prev' ? 'Previous' : 'Next'}
      {direction === 'next' && <ArrowRight className="w-3.5 h-3.5" aria-hidden />}
    </Text>
    <span className="text-sm font-medium text-foreground transition-colors duration-fast group-hover:text-primary">
      {doc.title}
    </span>
  </Link>
);

/** Prev/next cards at the bottom of a doc, honoring sidebar group order. */
export const DocsPagination = ({ slug, groups, basePath, className }: DocsPaginationProps) => {
  const { prev, next } = getAdjacentDocs(slug, groups);
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Docs pagination"
      className={cn('mt-12 grid gap-4 sm:grid-cols-2 border-t pt-8', className)}
    >
      {prev && <PaginationCard doc={prev} basePath={basePath} direction="prev" />}
      {next && <PaginationCard doc={next} basePath={basePath} direction="next" />}
    </nav>
  );
};
