import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { devDocNavGroups } from '@/config/developerDocs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface DevDocsSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export const DevDocsSidebar = ({ className, onNavigate }: DevDocsSidebarProps) => {
  const { slug } = useParams<{ slug: string }>();

  const defaultOpen = devDocNavGroups
    .filter((group) => group.items.some((item) => item.slug === slug))
    .map((group) => group.title);

  return (
    <ScrollArea className={cn('h-full', className)}>
      <nav className="py-4 pr-4">
        <Accordion
          type="multiple"
          defaultValue={defaultOpen.length > 0 ? defaultOpen : ['Overview']}
          className="space-y-1"
        >
          {devDocNavGroups.map((group) => (
            <AccordionItem key={group.title} value={group.title} className="border-none">
              <AccordionTrigger
                className={cn(
                  'py-2 px-3 text-xs font-bold tracking-wider hover:no-underline rounded-md hover:bg-muted/50',
                  group.color
                )}
              >
                {group.title.toUpperCase()}
              </AccordionTrigger>
              <AccordionContent className="pb-1">
                <ul className="space-y-0.5 pl-1">
                  {group.items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        to={`/dev-docs/${item.slug}`}
                        onClick={onNavigate}
                        className={cn(
                          'block px-3 py-1.5 text-sm rounded-md transition-colors',
                          slug === item.slug
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </nav>
    </ScrollArea>
  );
};
