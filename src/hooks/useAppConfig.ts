import { useQuery } from '@tanstack/react-query';

import { getConfig } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';

export function useAppConfig() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: getConfig,
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
