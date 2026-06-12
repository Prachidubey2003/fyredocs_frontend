import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { ToolIcon } from '@/components/icons/ToolIcon';
import { useCommandPalette } from '@/components/common/CommandPalette';
import { NAV_GROUPS, getToolsByNavGroup, toolNavName } from '@/config/navigation';
import { getAllTools } from '@/config/tools';
import { cn } from '@/lib/utils';

const TOOLS_PER_GROUP = 5;

/**
 * Single "Tools" trigger opening a mega-menu panel with all 7 nav groups.
 * Built on the shadcn NavigationMenu; the viewport opens left-aligned under
 * the trigger, which sits right after the logo in the sticky header.
 */
export function ToolsMegaMenu() {
  const { setOpen: openPalette } = useCommandPalette();
  const toolCount = getAllTools().length;

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[760px] p-6 xl:w-[880px]">
              <div className="grid grid-cols-4 gap-x-5 gap-y-6">
                {NAV_GROUPS.map((group) => (
                  <div key={group.id} className="min-w-0">
                    <Text as="div" variant="overline" className={cn('mb-2', group.styles.text)}>
                      {group.title}
                    </Text>
                    <ul className="space-y-0.5">
                      {getToolsByNavGroup(group.id)
                        .slice(0, TOOLS_PER_GROUP)
                        .map((tool) => (
                          <li key={tool.id}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={tool.route}
                                className="flex items-center gap-2 rounded-md px-1.5 py-1 text-body-sm text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground"
                              >
                                <ToolIcon icon={tool.icon} category={tool.category} size="sm" className="shrink-0" />
                                <span className="truncate">{toolNavName(tool)}</span>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                    </ul>
                    <NavigationMenuLink asChild>
                      <Link
                        to={`/all-tools?category=${group.id}`}
                        className="mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-caption font-medium text-muted-foreground transition-colors duration-fast hover:text-foreground"
                      >
                        All {group.shortTitle}
                        <ArrowRight className="h-3 w-3" aria-hidden />
                      </Link>
                    </NavigationMenuLink>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 border-t pt-4">
                <NavigationMenuLink asChild>
                  <Link
                    to="/all-tools"
                    className="inline-flex items-center gap-1.5 text-body-sm font-medium text-primary transition-colors duration-fast hover:text-primary-hover"
                  >
                    Browse all {toolCount} tools
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </NavigationMenuLink>
                <Button variant="outline" size="sm" onClick={() => openPalette(true)}>
                  <Search aria-hidden />
                  Search tools
                  <kbd className="pointer-events-none rounded border bg-muted px-1.5 text-caption font-medium text-muted-foreground">
                    ⌘K
                  </kbd>
                </Button>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
