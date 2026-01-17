import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const blogPosts = [
  {
    id: 1,
    title: 'How to Reduce PDF File Size Without Losing Quality',
    description: 'Learn the best techniques for compressing PDFs while maintaining document clarity and readability.',
    category: 'Tips & Tricks',
    date: '2025-01-15',
    readTime: '5 min read',
  },
  {
    id: 2,
    title: 'The Complete Guide to PDF Accessibility',
    description: 'Making your PDFs accessible to everyone, including users with disabilities.',
    category: 'Guides',
    date: '2025-01-10',
    readTime: '8 min read',
  },
  {
    id: 3,
    title: 'OCR Technology: How It Works and When to Use It',
    description: 'Understanding optical character recognition and its applications for scanned documents.',
    category: 'Technology',
    date: '2025-01-05',
    readTime: '6 min read',
  },
  {
    id: 4,
    title: 'Best Practices for Merging Multiple PDFs',
    description: 'Tips for organizing and combining PDF documents efficiently for professional results.',
    category: 'Tips & Tricks',
    date: '2024-12-28',
    readTime: '4 min read',
  },
  {
    id: 5,
    title: 'PDF Security: Protecting Your Sensitive Documents',
    description: 'Learn how to password protect and encrypt your PDF files for maximum security.',
    category: 'Security',
    date: '2024-12-20',
    readTime: '7 min read',
  },
];

const BlogPage = () => {
  return (
    <Layout>
      <div className="container py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Esydocs <span className="text-gradient-primary">Blog</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Tips, tutorials, and insights about working with PDFs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {blogPosts.map((post) => (
            <Card key={post.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Badge variant="secondary" className="w-fit mb-2">
                  {post.category}
                </Badge>
                <CardTitle className="group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
                <CardDescription>{post.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default BlogPage;
