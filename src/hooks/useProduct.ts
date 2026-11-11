import { useQuery } from '@tanstack/react-query';

import { getProduct } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';

export function useProduct(id?: string | null) {
  return useQuery({
    queryKey: queryKeys.product(String(id || '')),
    queryFn: () => getProduct(String(id)),
    select: (response) => response.data,
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}
