import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiJson } from '@/lib/apiClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters'),
    confirm: z.string(),
  })
  .refine((data) => data.newPassword === data.confirm, {
    path: ['confirm'],
    message: 'Passwords must match',
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirm: '' },
  });

  const handleSubmit = async (values: ResetPasswordValues) => {
    setFormError(null);
    try {
      await apiJson('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          newPassword: values.newPassword,
        }),
        skipRefresh: true,
      });
      setSuccess(true);
      setTimeout(() => navigate('/signin', { replace: true }), 1500);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not reset your password. Please try again.';
      setFormError(message);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid reset link</CardTitle>
            <CardDescription>
              This page needs a reset token. Please request a new link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/forgot-password">Request a new link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            Choose a password you haven&apos;t used before.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert className="mb-4">
              <AlertDescription>
                Password updated. Redirecting to sign in...
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {formError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? 'Updating...'
                      : 'Update password'}
                  </Button>
                </form>
              </Form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link to="/signin" className="text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
