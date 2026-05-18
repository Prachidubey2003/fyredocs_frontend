import { Link } from 'react-router-dom';
import { FileText, Github, Twitter, Mail, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navCategories, type NavSection } from '@/config/toolCategories';

const findCategory = (title: string) =>
  navCategories.find((c) => c.title === title)!;

const footerCategories: {
  title: string;
  color: string;
  tools: NavSection['tools'];
}[] = [
  {
    title: 'ORGANIZE',
    color: 'text-orange-500',
    tools: findCategory('ORGANIZE').sections.flatMap((s) => s.tools),
  },
  ...findCategory('CONVERT').sections.map((s) => ({
    title: s.label!.toUpperCase(),
    color: s.color,
    tools: s.tools,
  })),
  {
    title: 'LIBRE OFFICE',
    color: 'text-teal-500',
    tools: findCategory('LIBRE OFFICE').sections.flatMap((s) => s.tools),
  },
  {
    title: 'EDIT & PROTECT',
    color: 'text-blue-500',
    tools: findCategory('EDIT & PROTECT').sections.flatMap((s) => s.tools),
  },
];

const companyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Documentation', href: '/docs' },
  { label: 'Blog', href: '/blog' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookies' },
];

const socialLinks = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
  { icon: Mail, label: 'Email', href: '#' },
];

export const Footer = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        {/* Tier 1: Tool Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {footerCategories.map((category) => (
            <div key={category.title}>
              <h3
                className={cn(
                  'text-[11px] font-bold tracking-wider uppercase mb-3 pb-2 border-b border-border/50',
                  category.color
                )}
              >
                {category.title}
              </h3>
              <ul className="space-y-2">
                {category.tools.map((tool) => (
                  <li key={tool.href}>
                    <Link
                      to={tool.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tier 2: Brand + Company + Legal */}
        <div className="mt-12 pt-8 border-t grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2">
            <Link
              to="/"
              className="flex items-center gap-2.5 font-bold text-xl mb-4"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <span>Fyredocs</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm">
              Free online PDF tools to merge, split, compress, and convert your
              documents. Fast, secure, and easy to use.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tier 3: Bottom Bar */}
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Fyredocs. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Your files are processed securely and deleted after 1 hour.
          </p>
        </div>
      </div>
    </footer>
  );
};
