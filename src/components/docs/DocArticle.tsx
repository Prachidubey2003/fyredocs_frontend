import type { ReactNode } from 'react';
import type { DocSection } from '@/config/docs';
import { Heading, Text } from '@/components/ui/typography';
import type { NavGroupLike } from '@/lib/docsNavigation';
import { DocsContent } from './DocsContent';
import { DocsToc } from './DocsToc';
import { DocsPagination } from './DocsPagination';

interface DocArticleProps {
  slug: string;
  title: string;
  description: string;
  sections: DocSection[];
  groups: NavGroupLike[];
  basePath: '/docs' | '/dev-docs';
  /** Extra header content (e.g. "Try this tool" link). */
  headerExtra?: ReactNode;
}

/**
 * Shared doc-page scaffold: header, sections, prev/next pagination, and the
 * "On this page" rail. The page itself owns the right-rail grid (DocsLayout
 * stays two-column) — on xl: the article splits into content + 220px ToC.
 */
export const DocArticle = ({
  slug,
  title,
  description,
  sections,
  groups,
  basePath,
  headerExtra,
}: DocArticleProps) => (
  <div className="px-6 py-8 lg:px-8 max-w-6xl xl:grid xl:grid-cols-[minmax(0,1fr)_220px] xl:gap-12">
    <article className="min-w-0 max-w-3xl">
      <header className="mb-8">
        <Heading level="h1" responsive as="h1" className="mb-2">
          {title}
        </Heading>
        <Text variant="body-lg" tone="muted">
          {description}
        </Text>
        {headerExtra}
      </header>

      <DocsContent sections={sections} />

      <DocsPagination slug={slug} groups={groups} basePath={basePath} />
    </article>

    <DocsToc sections={sections} />
  </div>
);
