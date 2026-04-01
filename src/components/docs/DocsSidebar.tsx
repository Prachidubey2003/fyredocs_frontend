import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { docNavGroups } from '@/config/docs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface DocsSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export const DocsSidebar = ({ className, onNavigate }: DocsSidebarProps) => {
  const { slug } = useParams<{ slug: string }>();

  const defaultOpen = docNavGroups
    .filter((group) => group.items.some((item) => item.slug === slug))
    .map((group) => group.title);

  return (
    <ScrollArea className={cn('h-full', className)}>
      <nav className="py-4 px-2">
        <Accordion
          type="multiple"
          defaultValue={defaultOpen.length > 0 ? defaultOpen : ['Getting Started']}
          className="space-y-1"
        >
          {docNavGroups.map((group) => (
            <AccordionItem key={group.title} value={group.title} className="border-none">
              <AccordionTrigger
                className={cn(
                  'py-2 px-3 text-xs font-bold tracking-wider hover:no-underline rounded-md hover:bg-muted',
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
                        to={`/docs/${item.slug}`}
                        onClick={onNavigate}
                        className={cn(
                          'block px-3 py-1.5 text-sm rounded-md transition-colors',
                          slug === item.slug
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
