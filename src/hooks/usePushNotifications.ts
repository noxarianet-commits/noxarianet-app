import { useQueryClient } from '@tanstack/react-query';
import * as Application from 'expo-application';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Safe dynamic require to avoid crashing in Expo Go
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
} catch {}

import { registerDevice, unregisterDevice } from '@/api/mobile';
import { useAuth } from '@/auth/AuthProvider';
import { initNotifications, showNotification } from '@/lib/notifications';
import { getExpoPushToken } from '@/lib/pushToken';
import { clearPushToken, loadPushToken } from '@/lib/storage';

type PushData = Record<string, unknown>;

/** Petakan Platform.OS ke nilai `platform` yang diterima backend. */
function currentPlatform(): 'android' | 'ios' | 'web' {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'ios') return 'ios';
  return 'web';
}

/**
 * Arahkan pengguna ke layar yang relevan saat notifikasi disadap.
 *
 * Deep link dari backend berupa path aplikasi (mis. /pesanan/ORD-1), tapi
 * Expo Router memakai nama route berparameter (mis. '/pesanan/[id]'). Mapping
 * dilakukan di sini supaya tetap type-safe dengan typed routes.
 */
function navigateFromNotification(data: PushData | undefined) {
  if (!data) return;

  const type = typeof data.type === 'string' ? data.type : '';
  const orderId = typeof data.order_id === 'string' ? data.order_id : null;
  const url = typeof data.url === 'string' ? data.url : null;

  if (type === 'order_status' && orderId) {
    router.push({ pathname: '/pesanan/[id]', params: { id: orderId } });
    return;
  }

  if (type === 'topup') {
    router.push('/saldo/riwayat');
    return;
  }

  if (!url) return;

  // Broadcast admin mengirim path sederhana — petakan ke route yang dikenal.
  switch (url) {
    case '/':
    case '/(tabs)':
      router.push('/(tabs)');
      return;
    case '/katalog':
    case '/(tabs)/katalog':
      router.push('/(tabs)/katalog');
      return;
    case '/pesanan':
    case '/(tabs)/pesanan':
      router.push('/(tabs)/pesanan');
      return;
    case '/topup':
      router.push('/topup');
      return;
    case '/saldo/riwayat':
      router.push('/saldo/riwayat');
      return;
    case '/bantuan':
      router.push('/bantuan');
      return;
    default:
      // Path tidak dikenal — jangan navigasi buta ke string mentah.
      return;
  }
}

/**
 * Seluruh plumbung push notification aplikasi:
 *
 * 1. Mendaftarkan (dan memperbarui) Expo Push Token ke backend saat user login,
 *    dan melepaskannya saat logout.
 * 2. Menyegarkan data saat notifikasi diterima di foreground.
 * 3. Membuka layar terkait saat notifikasi disadap (termasuk cold start).
 */
export function usePushNotifications() {
  const { session, status } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id ?? null;

  const isWeb = Platform.OS === 'web';
  // Remote push notifications dinonaktifkan di Web dan Expo Go (karena hanya didukung di Android/iOS native).
  // Fitur ini otomatis aktif penuh di Development Build & Release APK Android/iOS.
  const isAvailable = !isWeb && !isExpoGo && Boolean(Notifications?.addPushTokenListener);

  // ── Registrasi token ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAvailable || status === 'loading') return;

    let cancelled = false;

    (async () => {
      if (status === 'signedIn' && userId) {
        const result = await getExpoPushToken();
        if (cancelled || !result.ok) return;

        await registerDevice({
          push_token: result.token,
          platform: currentPlatform(),
          app_version: Application.nativeApplicationVersion ?? undefined,
        }).catch(() => {
          // Gagal mendaftar push token tidak boleh mengganggu sesi login.
        });
        return;
      }

      // Logout — lepaskan token supaya perangkat ini berhenti menerima push.
      const previousToken = await loadPushToken();
      if (!previousToken) return;
      await unregisterDevice(previousToken).catch(() => undefined);
      await clearPushToken();
    })();

    return () => {
      cancelled = true;
    };
  }, [isAvailable, status, userId]);

  // Token bisa di-rotasi oleh FCM saat aplikasi berjalan. Yang didaftarkan ke
  // backend adalah Expo Push Token (bukan token mentah FCM), jadi saat listener
  // ini berbunyi kita ambil ulang token Expo-nya dan daftarkan kembali.
  useEffect(() => {
    if (!isAvailable) return;
    try {
      const subscription = Notifications.addPushTokenListener(() => {
        if (!userId) return;
        void (async () => {
          const result = await getExpoPushToken();
          if (!result.ok) return;
          await registerDevice({
            push_token: result.token,
            platform: currentPlatform(),
            app_version: Application.nativeApplicationVersion ?? undefined,
          }).catch(() => undefined);
        })();
      });
      return () => subscription?.remove?.();
    } catch {
      return () => {};
    }
  }, [isAvailable, userId]);

  // ── Penerimaan & interaksi ──────────────────────────────────────────────
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    if (!isAvailable) return;
    try {
      // Notifikasi masuk saat aplikasi di foreground: sistem sudah menampilkan
      // bannernya sendiri, jadi di sini cukup segarkan data dan tampilkan banner
      // dalam aplikasi (tanpa notifikasi sistem kedua).
      const received = Notifications.addNotificationReceivedListener(
        (notification: any) => {
          void queryClient.invalidateQueries({ queryKey: ['orders'] });
          void queryClient.invalidateQueries({ queryKey: ['order'] });
          void queryClient.invalidateQueries({ queryKey: ['payment-status'] });
          void queryClient.invalidateQueries({ queryKey: ['balance'] });
          void queryClient.invalidateQueries({ queryKey: ['balance-history'] });

          const { title, body } = notification.request?.content || {};
          if (title) {
            showNotification({
              title,
              body: body ?? '',
              tone: 'info',
              system: false,
            });
          }
        },
      );

      // Notifikasi disadap — buka layar terkait. Dipakai untuk tap saat app
      // berjalan maupun saat app dibuka dari notifikasi (cold start).
      const handleResponse = (response: any) => {
        const id = response?.notification?.request?.identifier;
        if (!id || handledResponseId.current === id) return;
        handledResponseId.current = id;

        const data = response?.notification?.request?.content?.data as
          | PushData
          | undefined;
        navigateFromNotification(data);
      };

      const response = Notifications.addNotificationResponseReceivedListener(
        handleResponse,
      );

      void Notifications.getLastNotificationResponseAsync?.()?.then?.((last: any) => {
        if (last) handleResponse(last);
      });

      return () => {
        received?.remove?.();
        response?.remove?.();
      };
    } catch {
      return () => {};
    }
  }, [isAvailable, queryClient]);

  // Inisialisasi channel + izin, sekali saja (hanya di native).
  useEffect(() => {
    if (!isExpoGo && !isWeb) {
      void initNotifications();
    }
  }, [isWeb]);
}
