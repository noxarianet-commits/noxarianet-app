/**
 * Module-level auth token holder. Keeping the token here (instead of threading
 * it through every API call) lets the fetch wrapper stay small and lets the
 * AuthProvider react globally to a 401.
 */
let token: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(next: string | null) {
  token = next;
}

export function getAuthToken(): string | null {
  return token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  unauthorizedHandler?.();
}
