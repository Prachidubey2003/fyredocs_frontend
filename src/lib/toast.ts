import { toast as sonnerToast } from 'sonner';

/**
 * Toast conventions:
 * - Toasts are for async outcomes only (job finished, copy succeeded, request failed).
 * - Inline form validation never toasts — use field-level errors.
 * - Success disappears quickly; errors linger long enough to read.
 */

const DURATION = {
  success: 3500,
  error: 6000,
  info: 4000,
  warning: 5000,
} as const;

export const toast = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, { description, duration: DURATION.success }),
  error: (message: string, description?: string) =>
    sonnerToast.error(message, { description, duration: DURATION.error }),
  info: (message: string, description?: string) =>
    sonnerToast.info(message, { description, duration: DURATION.info }),
  warning: (message: string, description?: string) =>
    sonnerToast.warning(message, { description, duration: DURATION.warning }),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
};
