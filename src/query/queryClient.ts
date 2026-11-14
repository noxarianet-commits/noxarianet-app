import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

/**
 * TanStack Query tidak tahu kapan aplikasi React Native masuk background.
 * Tanpa ini, `refetchInterval` di layar pembayaran/top-up tetap berjalan saat
 * pengguna pindah ke aplikasi bank untuk membayar.
 */
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => {
    handleFocus(state === 'active');
  });

  return () => subscription.remove();
});

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
      // Interval polling hanya berjalan saat aplikasi aktif.
      refetchIntervalInBackground: false,
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
