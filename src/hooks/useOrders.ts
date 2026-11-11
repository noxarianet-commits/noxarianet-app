import { useInfiniteQuery } from '@tanstack/react-query';

import { getOrders } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';

export function useOrders(status: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.orders(status),
    queryFn: ({ pageParam }) =>
      getOrders({ page: pageParam, limit: 20, status }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.total_pages
        ? lastPage.meta.page + 1
        : undefined,
    staleTime: 20 * 1000,
  });
}
