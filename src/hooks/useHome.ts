import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getHome } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';
import { saveHomeCache } from '@/lib/storage';

export function useHome() {
  const query = useQuery({
    queryKey: queryKeys.home,
    queryFn: getHome,
    select: (response) => response.data,
    staleTime: 15 * 60 * 1000, // 15 menit data beranda dianggap fresh
    gcTime: 24 * 60 * 60 * 1000, // Simpan di memori sampai 24 jam
  });

  useEffect(() => {
    if (query.data) {
      void saveHomeCache(query.data);
    }
  }, [query.data]);

  return query;
}
