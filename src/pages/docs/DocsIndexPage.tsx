import { Layout } from '@/components/layout/Layout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { BookOpen, Wrench, FileText, Shield, HelpCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const categories = [
  {
    title: 'Getting Started',
    description: 'Learn how EsyDocs works and start using PDF tools in minutes.',
    icon: BookOpen,
    href: '/docs/getting-started',
    color: 'text-primary',
  },
  {
    title: 'Tool Guides',
    description: 'Detailed guides for every PDF tool — merge, split, compress, convert, and more.',
    icon: Wrench,
    href: '/docs/merge-pdf',
    color: 'text-orange-500',
  },
  {
    title: 'Supported Formats',
    description: 'See all file formats and size limits supported by each tool.',
    icon: FileText,
    href: '/docs/supported-formats',
    color: 'text-blue-500',
  },
  {
    title: 'Security & Privacy',
    description: 'How we keep your files safe, encrypted, and automatically deleted.',
    icon: Shield,
    href: '/docs/security-privacy',
    color: 'text-green-500',
  },
  {
    title: 'FAQ',
    description: 'Quick answers to common questions about using EsyDocs.',
    icon: HelpCircle,
    href: '/docs/faq',
    color: 'text-purple-500',
  },
];

const DocsIndexPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Documentation - EsyDocs</title>
        <meta name="description" content="Learn how to use EsyDocs PDF tools. Browse tool guides, supported formats, security info, and FAQ." />
      </Helmet>
      <div className="container py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gradient-primary">Documentation</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about using EsyDocs PDF tools
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link key={cat.title} to={cat.href}>
              <Card className="h-full hover:shadow-lg transition-shadow hover:border-primary/30">
                <CardHeader>
                  <cat.icon className={`w-8 h-8 mb-2 ${cat.color}`} />
                  <CardTitle className="text-lg">{cat.title}</CardTitle>
                  <CardDescription>{cat.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default DocsIndexPage;
