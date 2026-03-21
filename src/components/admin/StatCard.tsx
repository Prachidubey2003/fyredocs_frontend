import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  label: string;
  value: string | number | null | undefined;
  subtitle?: string;
  color?: string;
  isLoading?: boolean;
}

export function StatCard({ label, value, subtitle, color = 'text-foreground', isLoading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <p className={`text-3xl font-bold ${color}`}>{value ?? 0}</p>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
