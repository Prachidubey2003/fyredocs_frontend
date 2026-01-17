import { Layout } from '@/components/layout/Layout';
import { Hero } from '@/components/home/Hero';
import { ToolGrid } from '@/components/home/ToolGrid';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <Hero />

      {/* All Tools Section */}
      <section id="tools" className="py-16 md:py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              All PDF Tools
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose from our comprehensive collection of PDF tools. 
              Sign in to access the full toolset.
            </p>
          </div>

          {isLoading && (
            <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
              Loading tools...
            </div>
          )}

          {!isLoading && isAuthenticated && <ToolGrid />}

          {!isLoading && !isAuthenticated && (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Sign in to access all PDF tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" asChild>
                  <Link to="/signin">Sign in</Link>
                </Button>
                <Button className="bg-gradient-primary" asChild>
                  <Link to="/signup">Sign up</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to work with your PDFs?
            </h2>
            <p className="text-muted-foreground mb-6">
              Sign in to unlock secure file conversions.
            </p>
            <Button className="bg-gradient-primary" asChild>
              <Link to="/signin">Get started</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
