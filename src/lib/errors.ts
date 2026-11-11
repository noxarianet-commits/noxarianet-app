import { ApiError } from '@/api/client';

export function getErrorMessage(
  error: unknown,
  fallback = 'Terjadi kesalahan. Silakan coba lagi.',
) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function getErrorCode(error: unknown) {
  return error instanceof ApiError ? error.code : undefined;
}

export function hasErrorCode(error: unknown, ...codes: string[]) {
  const code = getErrorCode(error);
  return !!code && codes.includes(code);
}

export function isNetworkError(error: unknown) {
  return error instanceof ApiError && error.isNetworkError;
}

export function isAuthError(error: unknown) {
  return error instanceof ApiError && error.isAuthError;
}

export function isRateLimited(error: unknown) {
  return error instanceof ApiError && error.status === 429;
}
