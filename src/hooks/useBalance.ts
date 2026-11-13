import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { getBalance } from '@/api/balance';
import { queryKeys } from '@/api/queryKeys';
import { notifyTopupSuccess } from '@/lib/notifications';

export function useBalance() {
  const query = useQuery({
    queryKey: queryKeys.balance,
    queryFn: getBalance,
    select: (response) => response.data,
    staleTime: 30 * 1000,
  });

  const previousBalanceRef = useRef<number | null>(null);

  useEffect(() => {
    const currentBalance = query.data?.balance;
    if (typeof currentBalance === 'number') {
      if (
        previousBalanceRef.current !== null &&
        currentBalance > previousBalanceRef.current
      ) {
        const added = currentBalance - previousBalanceRef.current;
        notifyTopupSuccess(added);
      }
      previousBalanceRef.current = currentBalance;
    }
  }, [query.data?.balance]);

  return query;
}
