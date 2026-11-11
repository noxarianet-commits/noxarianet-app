import { useInfiniteQuery } from '@tanstack/react-query';

import { getProducts } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';

export type CatalogType = 'prepaid' | 'postpaid';

export function useProducts(filters: {
  search: string;
  category: string;
  type: CatalogType;
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.products(filters),
    queryFn: ({ pageParam }) =>
      getProducts({
        type: filters.type,
        category: filters.category === 'ALL' ? undefined : filters.category,
        search: filters.search.trim() || undefined,
        page: pageParam,
        per_page: 50,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.total_pages
        ? lastPage.meta.page + 1
        : undefined,
    staleTime: 60 * 1000,
  });
}
