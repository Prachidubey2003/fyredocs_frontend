import { Link, Navigate } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSkeleton } from '@/components/common/PageSkeleton';

/**
 * Landing page Stripe redirects to when the user abandons the
 * Checkout flow (clicks "back" / closes the tab and returns).
 * No state mutation needed — Stripe didn't create the
 * subscription, our backend has nothing to roll back. We just
 * reassure the user and link them back to the plan picker.
 */
export default function BillingCancelPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageSkeleton />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/account/billing/cancel' }} />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Checkout cancelled</CardTitle>
          <CardDescription>
            No worries — your subscription wasn't changed. You can pick a plan again anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button asChild variant="default">
              <Link to="/account/billing">Back to billing</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Go to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
