import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getConfig } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';
import { saveConfigCache } from '@/lib/storage';

export function useAppConfig() {
  const query = useQuery({
    queryKey: queryKeys.config,
    queryFn: getConfig,
    select: (response) => response.data,
    staleTime: 30 * 60 * 1000, // 30 menit
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (query.data) {
      void saveConfigCache(query.data);
    }
  }, [query.data]);

  return query;
}
