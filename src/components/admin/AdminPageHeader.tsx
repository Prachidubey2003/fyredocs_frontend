import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminPageHeaderProps {
  title: string;
  description: string;
}

export function AdminPageHeader({ title, description }: AdminPageHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      <Button variant="ghost" size="icon" asChild className="mt-1 shrink-0">
        <Link to="/admin/dashboard">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
