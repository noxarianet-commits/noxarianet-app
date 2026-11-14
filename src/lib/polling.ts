import { useEffect, useState } from 'react';

/**
 * Polling backoff used by payment and order screens: 10s → 20s → 30s.
 *
 * Backend hanya mengecek status ke payment gateway setiap 60 detik (15 detik
 * untuk refresh manual), jadi interval 5 detik hanya menambah request tanpa
 * informasi baru.
 */
export function pollDelay(updateCount: number) {
  const delays = [10000, 20000, 30000];
  return delays[Math.min(Math.max(updateCount, 0), delays.length - 1)];
}

/** Jeda saat server membalas 429; lebih panjang dari backoff normal. */
export const RATE_LIMIT_POLL_DELAY = 60000;

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
