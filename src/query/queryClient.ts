import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Simpan data fresh selama 10 menit (tidak request berulang-ulang ke server)
      staleTime: 10 * 60 * 1000,
      // Pertahankan cache di memori selama 24 jam
      gcTime: 24 * 60 * 60 * 1000,
      // MATIKAN refetch otomatis saat buka/tutup aplikasi atau ganti tab/layar
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
