import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getConfig } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';
import { loadConfigCache, saveConfigCache } from '@/lib/storage';

export function useAppConfig() {
  // Cache disk dipakai sebagai fallback saat jaringan/429 gagal, supaya
  // aplikasi tetap bisa dibuka dengan konfigurasi terakhir.
  const cached = useQuery({
    queryKey: ['config-cache'],
    queryFn: loadConfigCache,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const query = useQuery({
    queryKey: queryKeys.config,
    queryFn: getConfig,
    select: (response) => response.data,
    placeholderData: cached.data
      ? { success: true as const, data: cached.data }
      : undefined,
    staleTime: 30 * 60 * 1000, // 30 menit
    gcTime: 24 * 60 * 60 * 1000,
    retry: (failureCount, error) => {
      // Jangan ulangi 4xx (termasuk 429); retry hanya untuk gangguan jaringan.
      const status = (error as { status?: number })?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 1;
    },
  });

  useEffect(() => {
    // Jangan tulis ulang data placeholder (berasal dari cache disk) sebagai
    // data baru; hanya simpan hasil fetch jaringan.
    if (query.data && !query.isPlaceholderData) {
      void saveConfigCache(query.data);
    }
  }, [query.data, query.isPlaceholderData]);

  return query;
}
