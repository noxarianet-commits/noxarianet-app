import { useQuery } from '@tanstack/react-query';

import { getBalance } from '@/api/balance';
import { queryKeys } from '@/api/queryKeys';

export function useBalance() {
  return useQuery({
    queryKey: queryKeys.balance,
    queryFn: getBalance,
    select: (response) => response.data,
    staleTime: 30 * 1000,
  });
}
