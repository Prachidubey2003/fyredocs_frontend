export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USER_ALREADY_EXISTS'
  | 'TOKEN_EXPIRED'
  | 'UNAUTHORIZED'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_FORBIDDEN'
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'FILE_TOO_LARGE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVER_ERROR';

export class AuthError extends Error {
  code: AuthErrorCode;
  status?: number;
  details?: unknown;

  constructor(code: AuthErrorCode, message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const isAuthError = (error: unknown): error is AuthError =>
  error instanceof AuthError;

const resolveErrorCode = (status: number, message: string, rawCode?: string | number): AuthErrorCode => {
  const normalized = message.toLowerCase();
  const numericCode = typeof rawCode === 'string' ? Number(rawCode) : rawCode;

  if (numericCode === 4010 || normalized.includes('credentials') || normalized.includes('secret')) {
    return 'INVALID_CREDENTIALS';
  }

  if (status === 409 || normalized.includes('already exists')) {
    return 'USER_ALREADY_EXISTS';
  }

  if (status === 401 && normalized.includes('expired')) {
    return 'TOKEN_EXPIRED';
  }

  if (status === 401 || status === 403) {
    return 'UNAUTHORIZED';
  }

  return 'SERVER_ERROR';
};

const userSafeMessage = (code: AuthErrorCode, fallback: string) => {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return 'Invalid email or password.';
    case 'USER_ALREADY_EXISTS':
      return 'An account with this email already exists.';
    case 'TOKEN_EXPIRED':
      return 'Your session has expired. Please sign in again.';
    case 'UNAUTHORIZED':
    case 'AUTH_UNAUTHORIZED':
      return 'You are not authorized. Please sign in again.';
    case 'AUTH_FORBIDDEN':
      return 'Access denied. You do not have permission to perform this action.';
    case 'INVALID_INPUT':
      return 'Invalid input. Please check your data and try again.';
    case 'NOT_FOUND':
      return 'Resource not found.';
    case 'FILE_TOO_LARGE':
      return 'File size exceeds the maximum allowed limit.';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Too many requests. Please try again later.';
    case 'SERVER_ERROR':
    default:
      return fallback || 'Something went wrong. Please try again.';
  }
};

const parseResponseBody = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }
  const text = await response.text().catch(() => '');
  return text ? { message: text } : null;
};

export const parseAuthError = async (response: Response) => {
  const details = await parseResponseBody(response);

  // Handle new API error format: { error: { code, message | details } }
  const errorPayload = details?.error;
  if (errorPayload?.code && (errorPayload?.message || errorPayload?.details)) {
    const code = errorPayload.code as AuthErrorCode;
    const fallback = errorPayload.message ?? errorPayload.details;
    const message = userSafeMessage(code, fallback);
    return new AuthError(code, message, response.status, details);
  }

  // Fallback to old format
  const rawMessage =
    details?.message ??
    details?.error ??
    details?.Message ??
    response.statusText ??
    'Authentication failed.';
  const rawCode = details?.code ?? details?.Code ?? response.status;
  const code = resolveErrorCode(response.status, String(rawMessage), rawCode);
  const message = userSafeMessage(code, String(rawMessage));
  return new AuthError(code, message, response.status, details);
};
