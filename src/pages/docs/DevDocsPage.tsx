import { useParams, Navigate } from 'react-router-dom';
import { DocArticle } from '@/components/docs/DocArticle';
import { devDocNavGroups, getDevDocBySlug } from '@/config/developerDocs';
import { Helmet } from 'react-helmet-async';

const DevDocsPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const doc = slug ? getDevDocBySlug(slug) : undefined;

  if (!doc) {
    return <Navigate to="/dev-docs" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{doc.title} - Developer Docs - Fyredocs</title>
        <meta name="description" content={doc.description} />
      </Helmet>

      <DocArticle
        slug={doc.slug}
        title={doc.title}
        description={doc.description}
        sections={doc.sections}
        groups={devDocNavGroups}
        basePath="/dev-docs"
      />
    </>
  );
};

export default DevDocsPage;
