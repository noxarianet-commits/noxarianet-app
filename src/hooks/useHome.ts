import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getHome } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';
import { loadHomeCache, saveHomeCache } from '@/lib/storage';

export function useHome() {
  // Cache disk dipakai sebagai fallback saat jaringan/429 gagal.
  const cached = useQuery({
    queryKey: ['home-cache'],
    queryFn: loadHomeCache,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const query = useQuery({
    queryKey: queryKeys.home,
    queryFn: getHome,
    select: (response) => response.data,
    placeholderData: cached.data
      ? { success: true as const, data: cached.data }
      : undefined,
    staleTime: 15 * 60 * 1000, // 15 menit data beranda dianggap fresh
    gcTime: 24 * 60 * 60 * 1000, // Simpan di memori sampai 24 jam
  });

  useEffect(() => {
    // Jangan tulis ulang data placeholder (berasal dari cache disk).
    if (query.data && !query.isPlaceholderData) {
      void saveHomeCache(query.data);
    }
  }, [query.data, query.isPlaceholderData]);

  return query;
}
