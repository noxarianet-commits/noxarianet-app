import { useQuery } from '@tanstack/react-query';

import { getHome } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';

export function useHome() {
  return useQuery({
    queryKey: queryKeys.home,
    queryFn: getHome,
    select: (response) => response.data,
    staleTime: 60 * 1000,
  });
}
