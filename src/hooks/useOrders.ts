import { useInfiniteQuery } from '@tanstack/react-query';

import { getOrders } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';

export function useOrders(status: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.orders(status),
    queryFn: ({ pageParam }) =>
      getOrders({ page: pageParam, limit: 20, status }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageData = lastPage as any;
      const meta = pageData.meta ?? pageData.pagination;

      const currentPage =
        meta?.page ??
        meta?.current_page ??
        pageData.page ??
        pageData.current_page;

      const totalPages =
        meta?.total_pages ??
        meta?.last_page ??
        meta?.totalPages ??
        pageData.total_pages ??
        pageData.last_page;

      if (typeof currentPage === 'number' && typeof totalPages === 'number') {
        return currentPage < totalPages ? currentPage + 1 : undefined;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
