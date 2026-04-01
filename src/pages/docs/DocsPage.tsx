import { useParams, Navigate, Link } from 'react-router-dom';
import { DocsLayout } from '@/components/layout/DocsLayout';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { DocsContent } from '@/components/docs/DocsContent';
import { getDocBySlug } from '@/config/docs';
import { TOOLS } from '@/config/tools';
import { ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const DocsPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const doc = slug ? getDocBySlug(slug) : undefined;

  if (!doc) {
    return <Navigate to="/docs" replace />;
  }

  const linkedTool = doc.toolId ? TOOLS[doc.toolId] : undefined;

  return (
    <DocsLayout sidebar={<DocsSidebar />} activeTab="features">
      <Helmet>
        <title>{doc.title} - EsyDocs Docs</title>
        <meta name="description" content={doc.description} />
      </Helmet>

      <div className="px-8 py-8 max-w-4xl">
        {/* Doc header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{doc.title}</h1>
          <p className="text-lg text-muted-foreground">{doc.description}</p>
          {linkedTool && (
            <Link
              to={linkedTool.route}
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-primary hover:underline"
            >
              Try {linkedTool.name}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Doc body */}
        <DocsContent sections={doc.sections} />
      </div>
    </DocsLayout>
  );
};

export default DocsPage;
