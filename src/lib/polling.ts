import { useEffect, useState } from 'react';

/**
 * Polling backoff used by payment and order screens: 5s → 10s → 20s → 30s.
 * The counter comes from TanStack Query's dataUpdateCount.
 */
export function pollDelay(updateCount: number) {
  const delays = [5000, 10000, 20000, 30000];
  return delays[Math.min(Math.max(updateCount, 0), delays.length - 1)];
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
