import { useQuery } from '@tanstack/react-query';

import { getMe } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';
import { useAuth } from '@/auth/AuthProvider';

export function useMe() {
  const { session } = useAuth();

  return useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    select: (response) => response.user,
    enabled: !!session?.token,
    staleTime: 30 * 1000,
  });
}
