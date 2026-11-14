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

      // Jika data berupa array dan terisi penuh (50 item), coba ambil halaman berikutnya
      const items = pageData.data;
      if (Array.isArray(items) && items.length >= 50 && typeof currentPage === 'number') {
        return currentPage + 1;
      }

      return undefined;
    },
    staleTime: 20 * 60 * 1000, // 20 menit katalog produk disimpan di memori
    gcTime: 24 * 60 * 60 * 1000,
  });
}
