import { Link } from 'react-router-dom';
import { FileText, Menu, User, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ToolIcon } from '@/components/icons/ToolIcon';

// Tool menu categories matching iLovePDF structure
const toolCategories = [
  {
    title: 'ORGANIZE PDF',
    color: 'text-orange-500',
    tools: [
      { name: 'Merge PDF', href: '/merge', icon: 'layers' },
      { name: 'Split PDF', href: '/split', icon: 'scissors' },
      { name: 'Remove pages', href: '/remove-pages', icon: 'file-minus' },
      { name: 'Extract pages', href: '/extract-pages', icon: 'file-output' },
      { name: 'Organize PDF', href: '/reorder', icon: 'arrow-up-down' },
      { name: 'Scan to PDF', href: '/scan-to-pdf', icon: 'scan' },
    ],
  },
  {
    title: 'OPTIMIZE PDF',
    color: 'text-red-500',
    tools: [
      { name: 'Compress PDF', href: '/compress', icon: 'minimize-2' },
      { name: 'Repair PDF', href: '/repair-pdf', icon: 'wrench' },
      { name: 'OCR PDF', href: '/ocr', icon: 'scan-text' },
    ],
  },
  {
    title: 'CONVERT TO PDF',
    color: 'text-yellow-600',
    tools: [
      { name: 'JPG to PDF', href: '/image-to-pdf', icon: 'file-image' },
      { name: 'WORD to PDF', href: '/word-to-pdf', icon: 'file' },
      { name: 'POWERPOINT to PDF', href: '/powerpoint-to-pdf', icon: 'presentation' },
      { name: 'EXCEL to PDF', href: '/excel-to-pdf', icon: 'file-spreadsheet' },
      { name: 'HTML to PDF', href: '/html-to-pdf', icon: 'code' },
    ],
  },
  {
    title: 'CONVERT FROM PDF',
    color: 'text-purple-500',
    tools: [
      { name: 'PDF to JPG', href: '/pdf-to-image', icon: 'image' },
      { name: 'PDF to WORD', href: '/pdf-to-word', icon: 'file-text' },
      { name: 'PDF to POWERPOINT', href: '/pdf-to-ppt', icon: 'presentation' },
      { name: 'PDF to EXCEL', href: '/pdf-to-excel', icon: 'table' },
      { name: 'PDF to PDF/A', href: '/pdf-to-pdfa', icon: 'archive' },
    ],
  },
  {
    title: 'EDIT PDF',
    color: 'text-blue-500',
    tools: [
      { name: 'Rotate PDF', href: '/rotate', icon: 'rotate-cw' },
      { name: 'Add page numbers', href: '/reorder', icon: 'hash' },
      { name: 'Add watermark', href: '/watermark', icon: 'stamp' },
      { name: 'Edit PDF', href: '/reorder', icon: 'edit' },
    ],
  },
  {
    title: 'PDF SECURITY',
    color: 'text-green-500',
    tools: [
      { name: 'Unlock PDF', href: '/protect', icon: 'unlock' },
      { name: 'Protect PDF', href: '/protect', icon: 'lock' },
      { name: 'Sign PDF', href: '/protect', icon: 'pen-tool' },
    ],
  },
];

const mainNavItems = [
  { label: 'MERGE PDF', href: '/merge' },
  { label: 'SPLIT PDF', href: '/split' },
  { label: 'COMPRESS PDF', href: '/compress' },
];

const convertDropdownItems = [
  { name: 'PDF to Word', href: '/pdf-to-word' },
  { name: 'PDF to Excel', href: '/pdf-to-excel' },
  { name: 'PDF to Image', href: '/pdf-to-image' },
  { name: 'Word to PDF', href: '/word-to-pdf' },
  { name: 'Excel to PDF', href: '/excel-to-pdf' },
  { name: 'Image to PDF', href: '/image-to-pdf' },
];

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const convertMenuRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  const formatValue = (value?: string) => (value && value.trim().length > 0 ? value : '-');

  // Close mega menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setIsMegaMenuOpen(false);
      }
      if (convertMenuRef.current && !convertMenuRef.current.contains(event.target as Node)) {
        setIsConvertOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline">Esydocs</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="px-4 py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {/* Convert PDF Dropdown */}
          <div className="relative" ref={convertMenuRef}>
            <button
              onClick={() => {
                setIsConvertOpen(!isConvertOpen);
                setIsMegaMenuOpen(false);
              }}
              className="px-4 py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              CONVERT PDF
              <ChevronDown className={cn('w-4 h-4 transition-transform', isConvertOpen && 'rotate-180')} />
            </button>

            {isConvertOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 rounded-lg border bg-background shadow-lg py-2 z-50">
                {convertDropdownItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    onClick={() => setIsConvertOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* All PDF Tools Mega Menu */}
          <div className="relative" ref={megaMenuRef}>
            <button
              onClick={() => {
                setIsMegaMenuOpen(!isMegaMenuOpen);
                setIsConvertOpen(false);
              }}
              className={cn(
                'px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1',
                isMegaMenuOpen ? 'text-primary' : 'text-primary hover:text-primary/80'
              )}
            >
              ALL PDF TOOLS
              <ChevronDown className={cn('w-4 h-4 transition-transform', isMegaMenuOpen && 'rotate-180')} />
            </button>

            {isMegaMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-[900px] max-w-[calc(100vw-2rem)] rounded-xl border bg-background shadow-xl p-6 z-50">
                <div className="grid grid-cols-6 gap-6">
                  {toolCategories.map((category) => (
                    <div key={category.title}>
                      <h3 className={cn('text-xs font-bold mb-3', category.color)}>
                        {category.title}
                      </h3>
                      <ul className="space-y-2">
                        {category.tools.map((tool) => (
                          <li key={tool.href + tool.name}>
                            <Link
                              to={tool.href}
                              className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors group"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              <ToolIcon 
                                icon={tool.icon} 
                                className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" 
                              />
                              <span>{tool.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Theme Toggle & Auth & Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {!isLoading && !isAuthenticated && (
            <>
              <Button variant="ghost" className="hidden sm:flex" asChild>
                <Link to="/signin">Login</Link>
              </Button>
              <Button className="hidden sm:flex bg-gradient-primary hover:opacity-90 transition-opacity" asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}

          {!isLoading && isAuthenticated && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user?.image ? user.image : undefined}
                        alt={user?.fullName ?? user?.email ?? 'Profile'}
                      />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={10}
                  className="w-64 max-w-[calc(100vw-2rem)] p-2"
                >
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage
                        src={user?.image ? user.image : undefined}
                        alt={user?.fullName ?? user?.email ?? 'Profile'}
                      />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">
                        {user?.fullName ?? 'Signed in'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {formatValue(user?.email)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 rounded-lg border px-3 py-2">
                    <DropdownMenuLabel className="px-0 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Profile details
                    </DropdownMenuLabel>
                    <div className="grid gap-1 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Country</span>
                        <span className="font-medium text-foreground truncate">
                          {formatValue(user?.country)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium text-foreground truncate">
                          {formatValue(user?.phone)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Role</span>
                        <span className="font-medium text-foreground truncate">
                          {formatValue(user?.role)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuItem
                    className="mt-2 justify-center rounded-md text-destructive focus:text-destructive"
                    onSelect={() => void handleLogout()}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
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
          'lg:hidden border-t overflow-hidden transition-all duration-200',
          isMobileMenuOpen ? 'max-h-[80vh] overflow-y-auto' : 'max-h-0'
        )}
      >
        <nav className="container py-4 flex flex-col gap-1">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          
          {/* Mobile Convert Section */}
          <div className="px-4 py-2 text-xs font-bold text-primary mt-2">CONVERT PDF</div>
          {convertDropdownItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted ml-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}

          {/* Mobile All Tools Section */}
          <div className="px-4 py-2 text-xs font-bold text-primary mt-2">ALL PDF TOOLS</div>
          {toolCategories.map((category) => (
            <div key={category.title} className="mb-2">
              <div className={cn('px-4 py-1 text-xs font-semibold', category.color)}>
                {category.title}
              </div>
              {category.tools.map((tool) => (
                <Link
                  key={tool.href + tool.name}
                  to={tool.href}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted ml-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ToolIcon icon={tool.icon} className="w-4 h-4" />
                  {tool.name}
                </Link>
              ))}
            </div>
          ))}

          {!isLoading && !isAuthenticated && (
            <div className="mt-3 grid gap-2">
              <Button variant="outline" asChild>
                <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                  Login
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
