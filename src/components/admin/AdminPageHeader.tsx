import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminPageHeaderProps {
  title: string;
  description: string;
  onRefresh?: () => void;
}

export function AdminPageHeader({ title, description, onRefresh }: AdminPageHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [onRefresh]);

  return (
    <div className="flex items-start gap-4">
      <Button variant="ghost" size="icon" asChild className="mt-1 shrink-0">
        <Link to="/admin/dashboard">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <div className="flex-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {onRefresh && (
        <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh data" className="mt-1 shrink-0">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}
