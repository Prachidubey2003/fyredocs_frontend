import { DocsLayout } from '@/components/layout/DocsLayout';
import { DevDocsSidebar } from '@/components/docs/DevDocsSidebar';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Server, Code, Layers, Database, ShieldCheck, GitBranch } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const categories = [
  {
    title: 'Architecture Overview',
    description: 'System architecture, microservice boundaries, tech stack, and communication patterns.',
    icon: Layers,
    href: '/dev-docs/architecture',
    color: 'text-primary',
  },
  {
    title: 'Service Flows',
    description: 'Visual architecture and sequence diagrams for every service — see how data flows through the system.',
    icon: GitBranch,
    href: '/dev-docs/flow-overview',
    color: 'text-rose-500',
  },
  {
    title: 'API Reference',
    description: 'Endpoint specifications for Auth, Upload, Jobs, and all conversion/manipulation APIs.',
    icon: Code,
    href: '/dev-docs/api-auth',
    color: 'text-blue-500',
  },
  {
    title: 'Services',
    description: 'Internal architecture, responsibilities, and database schemas for each microservice.',
    icon: Server,
    href: '/dev-docs/svc-api-gateway',
    color: 'text-orange-500',
  },
  {
    title: 'Architecture Deep-dives',
    description: 'Redis architecture, Docker base image setup, and database best practices.',
    icon: Database,
    href: '/dev-docs/arch-redis',
    color: 'text-purple-500',
  },
  {
    title: 'Guides',
    description: 'Backend hardening, deployment review checklists, and operational guides.',
    icon: ShieldCheck,
    href: '/dev-docs/guide-hardening',
    color: 'text-green-500',
  },
];

const DevDocsIndexPage = () => {
  return (
    <DocsLayout sidebar={<DevDocsSidebar />} activeTab="architecture">
      <Helmet>
        <title>Developer Documentation - Fyredocs</title>
        <meta name="description" content="Internal developer documentation for the Fyredocs platform." />
      </Helmet>
      <div className="px-8 py-16">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gradient-primary">Developer Docs</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Internal documentation for the Fyredocs platform architecture, APIs, and services
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
    </DocsLayout>
  );
};

export default DevDocsIndexPage;
