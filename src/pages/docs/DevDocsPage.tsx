import { useParams, Navigate } from 'react-router-dom';
import { DocsLayout } from '@/components/layout/DocsLayout';
import { DevDocsSidebar } from '@/components/docs/DevDocsSidebar';
import { DocsContent } from '@/components/docs/DocsContent';
import { getDevDocBySlug } from '@/config/developerDocs';
import { Helmet } from 'react-helmet-async';

const DevDocsPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const doc = slug ? getDevDocBySlug(slug) : undefined;

  if (!doc) {
    return <Navigate to="/dev-docs" replace />;
  }

  // Determine active tab based on slug prefix
  const activeTab = slug?.startsWith('api-') ? 'api' : 'architecture';

  return (
    <DocsLayout
      sidebar={<DevDocsSidebar filter={activeTab === 'api' ? 'api' : 'architecture'} />}
      activeTab={activeTab}
    >
      <Helmet>
        <title>{doc.title} - Developer Docs - Fyredocs</title>
        <meta name="description" content={doc.description} />
      </Helmet>

      <div className="px-8 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{doc.title}</h1>
          <p className="text-lg text-muted-foreground">{doc.description}</p>
        </div>

        <DocsContent sections={doc.sections} />
      </div>
    </DocsLayout>
  );
};

export default DevDocsPage;
