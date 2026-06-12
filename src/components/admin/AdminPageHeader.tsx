import { Heading, Text } from '@/components/ui/typography';

interface AdminPageHeaderProps {
  title: string;
  description: string;
}

/**
 * Page title for admin pages. Navigation, refresh, and time range live in the
 * AdminLayout shell, so this is intentionally just title + description.
 */
export function AdminPageHeader({ title, description }: AdminPageHeaderProps) {
  return (
    <div>
      <Heading level="h2" as="h1">
        {title}
      </Heading>
      <Text variant="body-sm" tone="muted" className="mt-1">
        {description}
      </Text>
    </div>
  );
}
