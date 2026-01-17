import { Link } from 'react-router-dom';
import { FileText, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/useAuth';

const navItems = [
  { label: 'Merge', href: '/merge', requiresAuth: true },
  { label: 'Split', href: '/split', requiresAuth: true },
  { label: 'Compress', href: '/compress', requiresAuth: true },
  { label: 'Convert', href: '/convert', requiresAuth: true },
  { label: 'All Tools', href: '/#tools', requiresAuth: true },
];

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  const visibleNavItems = navItems.filter(
    (item) => !item.requiresAuth || isAuthenticated
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline">PDF Tools</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          {!isLoading && !isAuthenticated && (
            <>
              <Button variant="ghost" className="hidden sm:flex" asChild>
                <Link to="/signin">Sign in</Link>
              </Button>
              <Button className="hidden sm:flex bg-gradient-primary hover:opacity-90 transition-opacity" asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}

          {!isLoading && isAuthenticated && (
            <>
              <span className="hidden lg:inline text-sm text-muted-foreground">
                {user?.email ?? 'Signed in'}
              </span>
              <Button variant="outline" className="hidden sm:flex" onClick={handleLogout}>
                Log out
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'md:hidden border-t overflow-hidden transition-all duration-200',
          isMobileMenuOpen ? 'max-h-96' : 'max-h-0'
        )}
      >
        <nav className="container py-4 flex flex-col gap-1">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {!isLoading && !isAuthenticated && (
            <div className="mt-3 grid gap-2">
              <Button variant="outline" asChild>
                <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                  Sign in
                </Link>
              </Button>
              <Button className="bg-gradient-primary" asChild>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  Sign up
                </Link>
              </Button>
            </div>
          )}

          {!isLoading && isAuthenticated && (
            <Button variant="outline" className="mt-3" onClick={handleLogout}>
              Log out
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};
