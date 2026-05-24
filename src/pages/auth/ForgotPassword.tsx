import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const handleSubmit = async (values: ForgotPasswordValues) => {
    setFormError(null);
    try {
      await apiJson('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: values.email }),
        skipRefresh: true,
      });
      setSubmitted(true);
    } catch (error) {
      // Network or 5xx — surface so the user can retry. 4xx with an account
      // existence signal would defeat no-enumeration UX, but the backend
      // always returns 200 for this endpoint so any error here is a real
      // problem.
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to send the reset link. Please try again.';
      setFormError(message);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>
            Enter the email for your fyredocs account and we&apos;ll send a
            reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <>
              <Alert className="mb-4">
                <AlertDescription>
                  If an account exists for that email, we&apos;ve sent a reset
                  link. Check your inbox (and spam folder).
                </AlertDescription>
              </Alert>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/signin" className="text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
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
                      ? 'Sending link...'
                      : 'Send reset link'}
                  </Button>
                </form>
              </Form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Remembered your password?{' '}
                <Link to="/signin" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
