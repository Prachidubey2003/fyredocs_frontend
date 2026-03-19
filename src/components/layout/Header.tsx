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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ToolItem {
  name: string;
  href: string;
  icon: string;
  comingSoon?: boolean;
}

// Tool menu categories matching iLovePDF structure
const toolCategories: { title: string; color: string; tools: ToolItem[] }[] = [
  {
    title: 'ORGANIZE PDF',
    color: 'text-orange-500',
    tools: [
      { name: 'Merge PDF', href: '/merge', icon: 'layers' },
      { name: 'Split PDF', href: '/split', icon: 'scissors' },
      { name: 'Remove pages', href: '/remove-pages', icon: 'file-minus', comingSoon: true },
      { name: 'Extract pages', href: '/extract-pages', icon: 'file-output', comingSoon: true },
      { name: 'Organize PDF', href: '/reorder', icon: 'arrow-up-down' },
      { name: 'Scan to PDF', href: '/scan-to-pdf', icon: 'scan', comingSoon: true },
    ],
  },
  {
    title: 'OPTIMIZE PDF',
    color: 'text-red-500',
    tools: [
      { name: 'Compress PDF', href: '/compress', icon: 'minimize-2' },
      { name: 'Repair PDF', href: '/repair-pdf', icon: 'wrench', comingSoon: true },
      { name: 'OCR PDF', href: '/ocr', icon: 'scan-text' },
    ],
  },
  {
    title: 'CONVERT TO PDF',
    color: 'text-yellow-600',
    tools: [
      { name: 'JPG to PDF', href: '/image-to-pdf', icon: 'file-image' },
      { name: 'WORD to PDF', href: '/word-to-pdf', icon: 'file' },
      { name: 'POWERPOINT to PDF', href: '/powerpoint-to-pdf', icon: 'presentation', comingSoon: true },
      { name: 'EXCEL to PDF', href: '/excel-to-pdf', icon: 'file-spreadsheet' },
      { name: 'HTML to PDF', href: '/html-to-pdf', icon: 'code', comingSoon: true },
    ],
  },
  {
    title: 'CONVERT FROM PDF',
    color: 'text-purple-500',
    tools: [
      { name: 'PDF to JPG', href: '/pdf-to-image', icon: 'image' },
      { name: 'PDF to WORD', href: '/pdf-to-word', icon: 'file-text' },
      { name: 'PDF to POWERPOINT', href: '/pdf-to-ppt', icon: 'presentation', comingSoon: true },
      { name: 'PDF to EXCEL', href: '/pdf-to-excel', icon: 'table' },
      { name: 'PDF to PDF/A', href: '/pdf-to-pdfa', icon: 'archive', comingSoon: true },
    ],
  },
  {
    title: 'EDIT PDF',
    color: 'text-blue-500',
    tools: [
      { name: 'Rotate PDF', href: '/rotate', icon: 'rotate-cw' },
      { name: 'Add page numbers', href: '/reorder', icon: 'hash', comingSoon: true },
      { name: 'Add watermark', href: '/watermark', icon: 'stamp' },
      { name: 'Edit PDF', href: '/reorder', icon: 'edit', comingSoon: true },
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

const convertToPdf: ToolItem[] = [
  { name: 'JPG to PDF', href: '/image-to-pdf', icon: 'file-image' },
  { name: 'WORD to PDF', href: '/word-to-pdf', icon: 'file' },
  { name: 'POWERPOINT to PDF', href: '/powerpoint-to-pdf', icon: 'presentation', comingSoon: true },
  { name: 'EXCEL to PDF', href: '/excel-to-pdf', icon: 'file-spreadsheet' },
  { name: 'HTML to PDF', href: '/html-to-pdf', icon: 'code', comingSoon: true },
];

const convertFromPdf: ToolItem[] = [
  { name: 'PDF to JPG', href: '/pdf-to-image', icon: 'image' },
  { name: 'PDF to WORD', href: '/pdf-to-word', icon: 'file-text' },
  { name: 'PDF to POWERPOINT', href: '/pdf-to-ppt', icon: 'presentation', comingSoon: true },
  { name: 'PDF to EXCEL', href: '/pdf-to-excel', icon: 'table' },
  { name: 'PDF to PDF/A', href: '/pdf-to-pdfa', icon: 'archive', comingSoon: true },
];

const ComingSoonBadge = () => (
  <span className="text-[9px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none">
    Soon
  </span>
);

const ToolLink = ({
  item,
  onClick,
  className,
}: {
  item: ToolItem;
  onClick?: () => void;
  className?: string;
}) => {
  const baseClass = cn(
    'flex items-center gap-2 px-1.5 py-1.5 text-xs rounded-md transition-all duration-150 group whitespace-nowrap',
    item.comingSoon
      ? 'pointer-events-none opacity-50 text-muted-foreground'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted/80',
    className
  );

  return (
    <Link
      to={item.comingSoon ? '#' : item.href}
      className={baseClass}
      onClick={(e) => {
        if (item.comingSoon) {
          e.preventDefault();
          return;
        }
        onClick?.();
      }}
      aria-disabled={item.comingSoon}
      tabIndex={item.comingSoon ? -1 : undefined}
    >
      <div className={cn(
        'w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150',
        'bg-muted/50',
        !item.comingSoon && 'group-hover:bg-primary/10 group-hover:scale-105'
      )}>
        <ToolIcon
          icon={item.icon}
          size="sm"
          className={cn(
            'w-3.5 h-3.5 text-muted-foreground transition-colors',
            !item.comingSoon && 'group-hover:text-primary'
          )}
        />
      </div>
      <span className="font-medium">{item.name}</span>
      {item.comingSoon && <ComingSoonBadge />}
    </Link>
  );
};

const MobileToolLink = ({
  item,
  onClick,
}: {
  item: ToolItem;
  onClick?: () => void;
}) => {
  return (
    <Link
      to={item.comingSoon ? '#' : item.href}
      className={cn(
        'flex items-center gap-2 px-4 py-2 text-sm transition-colors rounded-lg ml-2',
        item.comingSoon
          ? 'pointer-events-none opacity-50 text-muted-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
      onClick={(e) => {
        if (item.comingSoon) {
          e.preventDefault();
          return;
        }
        onClick?.();
      }}
      aria-disabled={item.comingSoon}
      tabIndex={item.comingSoon ? -1 : undefined}
    >
      <ToolIcon icon={item.icon} className="w-4 h-4" />
      {item.name}
      {item.comingSoon && <ComingSoonBadge />}
    </Link>
  );
};

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

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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

  // Close mega menus on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMegaMenuOpen(false);
        setIsConvertOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
          <div
            className="relative"
            ref={convertMenuRef}
            onMouseEnter={() => {
              setIsConvertOpen(true);
              setIsMegaMenuOpen(false);
            }}
            onMouseLeave={() => setIsConvertOpen(false)}
          >
            <button
              className={cn(
                'px-4 py-4 text-sm font-semibold transition-colors flex items-center gap-1',
                isConvertOpen ? 'text-primary' : 'text-foreground hover:text-primary'
              )}
            >
              CONVERT PDF
              <ChevronDown className={cn('w-4 h-4 transition-transform', isConvertOpen && 'rotate-180')} />
            </button>

            {isConvertOpen && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-0 pt-2 z-50"
                onMouseEnter={() => setIsConvertOpen(true)}
                onMouseLeave={() => setIsConvertOpen(false)}
              >
                <div className="rounded-xl border bg-background shadow-2xl p-5 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <div className="flex gap-8">
                    <div>
                      <h4 className="text-[10px] font-bold tracking-wider text-yellow-600 mb-2 pb-1.5 border-b border-border/50">CONVERT TO PDF</h4>
                      <ul className="space-y-0.5">
                        {convertToPdf.map((item) => (
                          <li key={item.href + item.name}>
                            <ToolLink item={item} onClick={() => setIsConvertOpen(false)} />
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold tracking-wider text-purple-500 mb-2 pb-1.5 border-b border-border/50">CONVERT FROM PDF</h4>
                      <ul className="space-y-0.5">
                        {convertFromPdf.map((item) => (
                          <li key={item.href + item.name}>
                            <ToolLink item={item} onClick={() => setIsConvertOpen(false)} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* All PDF Tools Mega Menu - Hover */}
          <div
            className="relative"
            ref={megaMenuRef}
            onMouseEnter={() => {
              setIsMegaMenuOpen(true);
              setIsConvertOpen(false);
            }}
            onMouseLeave={() => setIsMegaMenuOpen(false)}
          >
            <button
              className={cn(
                'px-4 py-4 text-sm font-semibold transition-colors flex items-center gap-1',
                isMegaMenuOpen ? 'text-primary' : 'text-primary hover:text-primary/80'
              )}
            >
              ALL PDF TOOLS
              <ChevronDown className={cn('w-4 h-4 transition-transform', isMegaMenuOpen && 'rotate-180')} />
            </button>

            {isMegaMenuOpen && (
              <div className="fixed inset-x-0 top-full flex justify-center pt-2 z-50">
                <div
                  className="w-[960px] max-w-[calc(100vw-2rem)] rounded-2xl border bg-background shadow-2xl p-8 animate-in fade-in-0 slide-in-from-top-2 duration-200"
                  onMouseEnter={() => setIsMegaMenuOpen(true)}
                  onMouseLeave={() => setIsMegaMenuOpen(false)}
                >
                  <div className="grid grid-cols-6 gap-6">
                    {toolCategories.map((category) => (
                      <div key={category.title} className="space-y-3">
                        <h3 className={cn(
                          'text-[10px] font-bold tracking-wider pb-1.5 border-b border-border/50',
                          category.color
                        )}>
                          {category.title}
                        </h3>
                        <ul className="space-y-0.5">
                          {category.tools.map((tool) => (
                            <li key={tool.href + tool.name}>
                              <ToolLink item={tool} onClick={() => setIsMegaMenuOpen(false)} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
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
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
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
              onClick={closeMobileMenu}
            >
              {item.label}
            </Link>
          ))}

          {/* Mobile Accordion Sections */}
          <Accordion type="multiple" className="mt-2">
            <AccordionItem value="convert-to" className="border-none">
              <AccordionTrigger className="px-4 py-2 text-xs font-bold text-yellow-600 hover:no-underline">
                CONVERT TO PDF
              </AccordionTrigger>
              <AccordionContent>
                {convertToPdf.map((item) => (
                  <MobileToolLink key={item.href + item.name} item={item} onClick={closeMobileMenu} />
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="convert-from" className="border-none">
              <AccordionTrigger className="px-4 py-2 text-xs font-bold text-purple-500 hover:no-underline">
                CONVERT FROM PDF
              </AccordionTrigger>
              <AccordionContent>
                {convertFromPdf.map((item) => (
                  <MobileToolLink key={item.href + item.name} item={item} onClick={closeMobileMenu} />
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="all-tools" className="border-none">
              <AccordionTrigger className="px-4 py-2 text-xs font-bold text-primary hover:no-underline">
                ALL PDF TOOLS
              </AccordionTrigger>
              <AccordionContent>
                {toolCategories.map((category) => (
                  <div key={category.title} className="mb-2">
                    <div className={cn('px-4 py-1 text-xs font-semibold', category.color)}>
                      {category.title}
                    </div>
                    {category.tools.map((tool) => (
                      <MobileToolLink key={tool.href + tool.name} item={tool} onClick={closeMobileMenu} />
                    ))}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {!isLoading && !isAuthenticated && (
            <div className="mt-3 grid gap-2">
              <Button variant="outline" asChild>
                <Link to="/signin" onClick={closeMobileMenu}>
                  Login
                </Link>
              </Button>
              <Button className="bg-gradient-primary" asChild>
                <Link to="/signup" onClick={closeMobileMenu}>
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
