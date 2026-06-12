import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Live password checklist. Rules mirror the signup `passwordSchema`
 * (min length 8, lowercase, uppercase, number, special character).
 */
const RULES = [
  { id: 'length', label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { id: 'lower', label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
  { id: 'upper', label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { id: 'number', label: 'One number', test: (pw: string) => /\d/.test(pw) },
  { id: 'symbol', label: 'One special character', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
] as const;

interface PasswordStrengthHintsProps {
  password: string;
  className?: string;
}

export function PasswordStrengthHints({ password, className }: PasswordStrengthHintsProps) {
  return (
    <ul className={cn('grid grid-cols-1 gap-1.5 sm:grid-cols-2', className)} aria-live="polite">
      {RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <li
            key={rule.id}
            className={cn(
              'flex items-center gap-1.5 text-caption transition-colors duration-fast',
              passed ? 'text-success' : 'text-muted-foreground',
            )}
          >
            {passed ? (
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            <span>
              {rule.label}
              <span className="sr-only">{passed ? ' — met' : ' — not met'}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
