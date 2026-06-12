import { useState } from 'react';
import { Unlock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OptionsPanelProps } from './types';

export const UnlockOptionsPanel = ({ form }: OptionsPanelProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const password = (form.watch('password') as string) ?? '';
  const error = form.formState.errors.password;

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <h3 className="flex items-center gap-2 text-h4 font-semibold">
        <Unlock className="h-5 w-5" aria-hidden />
        PDF Password
      </h3>

      <div className="space-y-2">
        <Label htmlFor="unlock-password">Enter the PDF password</Label>
        <div className="relative">
          <Input
            id="unlock-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => form.setValue('password', e.target.value, { shouldValidate: true })}
            placeholder="Enter password to unlock..."
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
        {error && <p className="text-caption text-destructive">{String(error.message)}</p>}
      </div>
    </div>
  );
};
