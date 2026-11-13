import { useQuery } from '@tanstack/react-query';

import { getConfig } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';

export function useAppConfig() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: getConfig,
    select: (response) => response.data,
    // Samakan dengan cache server (max-age=60) supaya perubahan saklar admin
    // cepat terlihat di app.
    staleTime: 60 * 1000,
    retry: 2,
  });
}
