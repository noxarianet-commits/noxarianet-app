import { useEffect, useState } from 'react';

export function useCountdown(expiresAt?: string | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const target = expiresAt ? new Date(expiresAt).getTime() : 0;
  const remainingMs = target ? Math.max(0, target - now) : 0;

  return {
    remainingMs,
    expired: target > 0 && remainingMs <= 0,
    active: target > 0,
  };
}
