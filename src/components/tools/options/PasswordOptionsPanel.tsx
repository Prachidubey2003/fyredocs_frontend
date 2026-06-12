import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OptionsPanelProps } from './types';

export const PasswordOptionsPanel = ({ form }: OptionsPanelProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const password = (form.watch('password') as string) ?? '';
  const confirmPassword = (form.watch('confirmPassword') as string) ?? '';
  const errors = form.formState.errors;

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <h3 className="flex items-center gap-2 text-h4 font-semibold">
        <Lock className="h-5 w-5" aria-hidden />
        Password Protection
      </h3>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="protect-password">Password</Label>
          <div className="relative">
            <Input
              id="protect-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => form.setValue('password', e.target.value, { shouldValidate: true })}
              placeholder="Enter password..."
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
          {errors.password && (
            <p className="text-caption text-destructive">{String(errors.password.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="protect-confirm-password">Confirm Password</Label>
          <Input
            id="protect-confirm-password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => form.setValue('confirmPassword', e.target.value, { shouldValidate: true })}
            placeholder="Confirm password..."
          />
          {errors.confirmPassword && (
            <p className="text-caption text-destructive">{String(errors.confirmPassword.message)}</p>
          )}
        </div>
      </div>
    </div>
  );
};
