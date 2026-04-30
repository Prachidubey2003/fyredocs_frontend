import { Link } from 'react-router-dom';
import { FileText, Menu, User, X, ChevronDown, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/useAuth';
import { AnimatedDropdown, AnimatePresence, motion } from '@/components/ui/animated';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { navCategories, type ToolItem } from '@/config/toolCategories';

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
    'flex flex-start items-center gap-2 py-1.5 text-xs rounded-md transition-all duration-150 group whitespace-nowrap',
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
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const navMenuRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const formatValue = (value?: string) => (value && value.trim().length > 0 ? value : '-');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navMenuRef.current && !navMenuRef.current.contains(event.target as Node)) {
        setOpenCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenCategory(null);
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
          <span className="hidden sm:inline">Fyredocs</span>
        </Link>

        {/* Desktop Navigation */}
        <nav ref={navMenuRef} className="hidden lg:flex items-center gap-1">
          {navCategories.map((category) => {
            const isOpen = openCategory === category.title;
            const headingColor = category.sections[0].color;
            const panelWidthClass =
              category.sections.length === 1
                ? 'min-w-[220px]'
                : category.sections.length === 2
                  ? 'w-[440px]'
                  : 'w-[640px]';

            return (
              <div
                key={category.title}
                className="relative"
                onMouseEnter={() => setOpenCategory(category.title)}
                onMouseLeave={() => setOpenCategory(null)}
              >
                <button
                  className={cn(
                    'px-4 py-4 text-sm font-semibold transition-colors flex items-center gap-1',
                    isOpen ? 'text-primary' : 'text-foreground hover:text-primary'
                  )}
                >
                  {category.title}
                  <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
                </button>

                <AnimatedDropdown show={isOpen}>
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-0 pt-2 z-50"
                    onMouseEnter={() => setOpenCategory(category.title)}
                    onMouseLeave={() => setOpenCategory(null)}
                  >
                    <div className={cn('rounded-xl border bg-background shadow-2xl p-5', panelWidthClass)}>
                      {category.sections.length === 1 ? (
                        <div>
                          <h4 className={cn('text-xs font-bold tracking-wider mb-2 pb-1.5 border-b border-border/50', headingColor)}>
                            {category.title}
                          </h4>
                          <ul className="space-y-0.5">
                            {category.sections[0].tools.map((tool) => (
                              <li key={tool.href + tool.name}>
                                <ToolLink item={tool} onClick={() => setOpenCategory(null)} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="flex gap-6">
                          {category.sections.map((section, i) => (
                            <div key={section.label ?? i} className="min-w-0 flex-1">
                              <h4 className={cn('text-xs font-bold tracking-wider mb-2 pb-1.5 border-b border-border/50', section.color)}>
                                {section.label}
                              </h4>
                              <ul className="space-y-0.5">
                                {section.tools.map((tool) => (
                                  <li key={tool.href + tool.name}>
                                    <ToolLink item={tool} onClick={() => setOpenCategory(null)} />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </AnimatedDropdown>
              </div>
            );
          })}

          <Link
            to="/docs"
            className="px-4 py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            DOCS
          </Link>

          {user?.role === 'super-admin' && (
            <Link
              to="/admin/dashboard"
              className="px-4 py-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4" />
              ADMIN
            </Link>
          )}
        </nav>

        {/* Theme Toggle & Auth & Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <AnimatePresence>
            {!isLoading && !isAuthenticated && (
              <motion.div
                key="auth-buttons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <Button variant="ghost" className="hidden sm:flex" asChild>
                  <Link to="/signin">Login</Link>
                </Button>
                <Button className="hidden sm:flex bg-gradient-primary hover:opacity-90 transition-opacity" asChild>
                  <Link to="/signup">Sign up</Link>
                </Button>
              </motion.div>
            )}

            {!isLoading && isAuthenticated && (
              <motion.div
                key="user-menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
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
                  className="w-72 max-w-[calc(100vw-2rem)] p-1.5"
                >
                  <div className="flex items-center gap-3 px-2 py-2.5">
                    <Avatar className="h-9 w-9">
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
                  {user?.role === 'super-admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => void handleLogout()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMobileMenuOpen ? (
                <motion.span
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="h-5 w-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
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
          <Accordion type="multiple" className="mt-1">
            {navCategories.map((category) => (
              <AccordionItem key={category.title} value={category.title} className="border-none">
                <AccordionTrigger className={cn('px-4 py-2 text-xs font-bold hover:no-underline', category.sections[0].color)}>
                  {category.title}
                </AccordionTrigger>
                <AccordionContent>
                  {category.sections.length === 1
                    ? category.sections[0].tools.map((tool) => (
                        <MobileToolLink key={tool.href + tool.name} item={tool} onClick={closeMobileMenu} />
                      ))
                    : category.sections.map((section, i) => (
                        <div key={section.label ?? i} className="mb-2">
                          <div className={cn('px-4 py-1 text-[11px] font-semibold uppercase tracking-wider', section.color)}>
                            {section.label}
                          </div>
                          {section.tools.map((tool) => (
                            <MobileToolLink key={tool.href + tool.name} item={tool} onClick={closeMobileMenu} />
                          ))}
                        </div>
                      ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <Link
            to="/docs"
            className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
            onClick={closeMobileMenu}
          >
            DOCS
          </Link>

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
            <div className="mt-3 grid gap-2">
              {user?.role === 'super-admin' && (
                <Button variant="outline" asChild>
                  <Link to="/admin/dashboard" onClick={closeMobileMenu}>
                    Admin Dashboard
                  </Link>
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
