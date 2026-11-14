import { useInfiniteQuery } from '@tanstack/react-query';

import { getBalanceHistory } from '@/api/balance';
import { queryKeys } from '@/api/queryKeys';

export function useBalanceHistory(type: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.balanceHistory(type),
    queryFn: ({ pageParam }) =>
      getBalanceHistory({
        page: pageParam,
        limit: 20,
        type: type === 'ALL' ? undefined : type,
      }),
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
        meta?.totalPages ??
        meta?.total_pages ??
        meta?.last_page ??
        pageData.totalPages ??
        pageData.total_pages ??
        pageData.last_page;

      if (typeof currentPage === 'number' && typeof totalPages === 'number') {
        return currentPage < totalPages ? currentPage + 1 : undefined;
      }
      return undefined;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
