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
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    staleTime: 30 * 1000,
  });
}
