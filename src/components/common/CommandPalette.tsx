/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { FolderClock, Grid3x3, LogIn, Moon, Sun, Tag, BookOpen, LayoutDashboard, Files } from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { ToolIcon } from '@/components/icons/ToolIcon';
import { NAV_GROUPS, getToolsByNavGroup, toolNavName } from '@/config/navigation';
import { useAuth } from '@/auth/useAuth';

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | undefined>(undefined);

export const useCommandPalette = () => {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  return ctx;
};

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !isEditableTarget(e.target))) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
}

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
};

function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const navigate = useNavigate();
  const { setTheme, resolvedTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    [setOpen],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search tools and pages…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => runCommand(() => navigate('/tools'))}>
            <Grid3x3 className="mr-2 h-4 w-4" aria-hidden />
            All tools
          </CommandItem>
          {isAuthenticated && (
            <>
              <CommandItem onSelect={() => runCommand(() => navigate('/dashboard'))}>
                <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden />
                Dashboard
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/app/documents'))}>
                <Files className="mr-2 h-4 w-4" aria-hidden />
                Documents
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/my-files'))}>
                <FolderClock className="mr-2 h-4 w-4" aria-hidden />
                My Files
              </CommandItem>
            </>
          )}
          <CommandItem onSelect={() => runCommand(() => navigate('/pricing'))}>
            <Tag className="mr-2 h-4 w-4" aria-hidden />
            Pricing
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/docs'))}>
            <BookOpen className="mr-2 h-4 w-4" aria-hidden />
            Documentation
          </CommandItem>
          {!isAuthenticated && (
            <CommandItem onSelect={() => runCommand(() => navigate('/signin'))}>
              <LogIn className="mr-2 h-4 w-4" aria-hidden />
              Sign in
            </CommandItem>
          )}
        </CommandGroup>

        {NAV_GROUPS.map((group) => {
          const tools = getToolsByNavGroup(group.id);
          if (tools.length === 0) return null;
          return (
            <CommandGroup key={group.id} heading={group.title}>
              {tools.map((tool) => (
                <CommandItem
                  key={tool.id}
                  value={`${toolNavName(tool)} ${tool.name} ${(tool.keywords ?? []).join(' ')}`}
                  onSelect={() => runCommand(() => navigate(tool.route))}
                >
                  <ToolIcon icon={tool.icon} category={tool.category} size="sm" className="mr-2" />
                  {toolNavName(tool)}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}

        <CommandSeparator />
        <CommandGroup heading="Appearance">
          <CommandItem onSelect={() => runCommand(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))}>
            {resolvedTheme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" aria-hidden />
            ) : (
              <Moon className="mr-2 h-4 w-4" aria-hidden />
            )}
            Toggle theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
