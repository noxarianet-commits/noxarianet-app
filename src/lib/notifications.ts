import {
  AndroidImportance,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  requestPermissionsAsync,
} from 'expo-notifications';
import { Platform } from 'react-native';

import { formatRupiah } from '@/lib/format';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
  icon?: string;
  timestamp: number;
};

type Listener = (notification: AppNotification) => void;
const listeners = new Set<Listener>();

export function addNotificationListener(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * ID channel notifikasi Android. WAJIB sama dengan nilai `defaultChannel` di
 * app.json dan `PUSH_CHANNEL_ID` di backend — kalau channelId menunjuk channel
 * yang belum ada di perangkat, notifikasi tidak tampil sama sekali.
 */
export const NOTIFICATION_CHANNEL_ID = 'noxarianet_transaksi';

let isInitialized = false;

export async function initNotifications() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === 'android') {
      // Channel harus ada SEBELUM push token diminta (syarat Android 13+).
      await setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'Status Transaksi & Saldo',
        importance: AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E86B4F',
        sound: 'default',
      });
    }

    await requestPermissionsAsync();
  } catch {
    // Graceful fallback if permission request fails or unsupported
    isInitialized = false;
  }
}

async function triggerSystemNotification(title: string, body: string) {
  try {
    await initNotifications();
    await scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        ...(Platform.OS === 'android'
          ? { channelId: NOTIFICATION_CHANNEL_ID }
          : null),
      },
      trigger: null,
    });
  } catch {
    // Ignore fallback errors
  }
}

/**
 * Tampilkan notifikasi ke pengguna.
 *
 * @param options.system Saat `false`, hanya banner dalam aplikasi yang muncul —
 *   notifikasi sistem tidak dibuat. Dipakai saat menerima push notification di
 *   foreground: sistem sudah menampilkan bannernya sendiri, jadi tidak boleh
 *   ada notifikasi kedua.
 */
export function showNotification(options: {
  title: string;
  body: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
  icon?: string;
  system?: boolean;
}) {
  const notification: AppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: options.title,
    body: options.body,
    tone: options.tone,
    icon: options.icon,
    timestamp: Date.now(),
  };

  // 1. Dispatch to in-app announcement bar listeners
  for (const listener of listeners) {
    try {
      listener(notification);
    } catch {
      // Ignore listener error
    }
  }

  // 2. Dispatch to Android Status Bar / Notification Center
  if (options.system !== false) {
    void triggerSystemNotification(options.title, options.body);
  }
}

/**
 * Pengumuman saldo masuk hasil top up
 */
export function notifyTopupSuccess(amount: number) {
  showNotification({
    title: 'Saldo Berhasil Masuk! 💰',
    body: `Top up sebesar ${formatRupiah(amount)} berhasil ditambahkan ke saldo akunmu.`,
    tone: 'success',
    icon: 'cash-check',
  });
}

/**
 * Peringatan saldo bayar / pending top up
 */
export function notifyTopupPending(amount: number) {
  showNotification({
    title: 'Menunggu Pembayaran Top Up ⚠️',
    body: `Selesaikan pembayaran top up sebesar ${formatRupiah(amount)} sebelum batas waktu berakhir.`,
    tone: 'warning',
    icon: 'clock-alert-outline',
  });
}

/**
 * Notifikasi transaksi pesanan berhasil
 */
export function notifyOrderSuccess(productName: string, variantName?: string) {
  const item = variantName ? `${productName} (${variantName})` : productName;
  showNotification({
    title: 'Transaksi Berhasil! 🎉',
    body: `Pesanan ${item} telah selesai diproses.`,
    tone: 'success',
    icon: 'check-circle-outline',
  });
}

/**
 * Notifikasi transaksi pesanan gagal / dibatalkan
 */
export function notifyOrderFailed(productName: string, variantName?: string) {
  const item = variantName ? `${productName} (${variantName})` : productName;
  showNotification({
    title: 'Transaksi Gagal ❌',
    body: `Pesanan ${item} gagal diproses atau dibatalkan.`,
    tone: 'danger',
    icon: 'alert-circle-outline',
  });
}
