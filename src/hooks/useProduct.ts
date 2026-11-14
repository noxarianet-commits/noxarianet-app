import { useQuery } from '@tanstack/react-query';

import { getProduct } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';

export function useProduct(id?: string | null) {
  return useQuery({
    queryKey: queryKeys.product(String(id || '')),
    queryFn: () => getProduct(String(id)),
    select: (response) => response.data,
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
