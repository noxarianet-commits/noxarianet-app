import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { ApiError } from '@/api/client';
import { setAuthToken, setUnauthorizedHandler } from '@/api/authToken';
import { getMe, login as loginRequest } from '@/api/mobile';
import type { UserProfile } from '@/api/types';
import {
  clearPendingRegistration,
  clearSession,
  loadSession,
  saveSession,
  saveUserCache,
} from '@/lib/storage';

export type AuthSession = {
  token: string;
  user: UserProfile | null;
};

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  session: AuthSession | null;
  user: UserProfile | null;
  status: AuthStatus;
  notice: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithToken: (token: string, user: UserProfile) => Promise<void>;
  signOut: (notice?: string) => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
  setUser: (user: UserProfile) => void;
  clearNotice: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [notice, setNotice] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const resetUserQueries = useCallback(() => {
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== 'config',
    });
  }, [queryClient]);

  const clearAll = useCallback(
    async (message?: string) => {
      await clearSession();
      setAuthToken(null);
      if (mounted.current) {
        setSession(null);
        setStatus('signedOut');
        setNotice(message || null);
      }
      resetUserQueries();
    },
    [resetUserQueries],
  );

  const handleUnauthorized = useCallback(() => {
    void clearAll('Sesi telah berakhir. Silakan masuk kembali.');
  }, [clearAll]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  // Restore the saved session, then refresh the profile in the background.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await loadSession();
      if (cancelled) return;

      if (!stored) {
        setStatus('signedOut');
        return;
      }

      setAuthToken(stored.token);
      setSession({ token: stored.token, user: stored.user });
      setStatus('signedIn');

      try {
        const response = await getMe();
        if (cancelled) return;
        setSession({ token: stored.token, user: response.user });
        await saveUserCache(response.user);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.isAuthError) {
          await clearAll('Sesi telah berakhir. Silakan masuk kembali.');
        }
        // A network failure keeps the cached session; the user can retry later.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearAll]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await loginRequest(email, password);
      setAuthToken(response.token);
      await saveSession(response.token, response.user);
      await clearPendingRegistration();
      resetUserQueries();
      setNotice(null);
      setSession({ token: response.token, user: response.user });
      setStatus('signedIn');
    },
    [resetUserQueries],
  );

  const signInWithToken = useCallback(
    async (token: string, user: UserProfile) => {
      setAuthToken(token);
      await saveSession(token, user);
      await clearPendingRegistration();
      resetUserQueries();
      setNotice(null);
      setSession({ token, user });
      setStatus('signedIn');
    },
    [resetUserQueries],
  );

  const signOut = useCallback(
    async (message?: string) => {
      await clearAll(message);
    },
    [clearAll],
  );

  const refreshUser = useCallback(async () => {
    const response = await getMe();
    await saveUserCache(response.user);
    setSession((current) =>
      current ? { ...current, user: response.user } : current,
    );
    return response.user;
  }, []);

  const setUser = useCallback((user: UserProfile) => {
    void saveUserCache(user);
    setSession((current) => (current ? { ...current, user } : current));
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      status,
      notice,
      signIn,
      signInWithToken,
      signOut,
      refreshUser,
      setUser,
      clearNotice,
    }),
    [
      session,
      status,
      notice,
      signIn,
      signInWithToken,
      signOut,
      refreshUser,
      setUser,
      clearNotice,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
