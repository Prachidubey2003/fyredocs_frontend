import { Users, Target, Zap, Shield } from 'lucide-react';

const AboutPage = () => {
  return (
    <>
      <div className="container py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About <span className="text-gradient-primary">Fyredocs</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            We're on a mission to make PDF tools accessible, fast, and secure
            for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto mb-16">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Our Story</h2>
            <p className="text-muted-foreground">
              Fyredocs was born from a simple frustration: working with PDFs
              shouldn't be complicated or expensive. We set out to build a
              platform that makes professional PDF tools available to everyone.
            </p>
            <p className="text-muted-foreground">
              Today, we serve thousands of users worldwide, helping them merge,
              split, compress, and convert PDFs with ease. Our commitment to
              privacy means your files are processed securely and never stored
              longer than necessary.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Our Values</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Privacy First</h3>
                  <p className="text-sm text-muted-foreground">
                    Your files are yours. We process securely and delete
                    promptly.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Speed Matters</h3>
                  <p className="text-sm text-muted-foreground">
                    Optimized processing to get you results in seconds.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Simplicity</h3>
                  <p className="text-sm text-muted-foreground">
                    Powerful tools that anyone can use, no learning curve.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border p-8 md:p-12 max-w-5xl mx-auto text-center">
          <Users className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-4">
            Join Thousands of Happy Users
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From freelancers to Fortune 500 companies, Fyredocs is trusted by
            professionals worldwide to handle their PDF needs efficiently and
            securely.
          </p>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
