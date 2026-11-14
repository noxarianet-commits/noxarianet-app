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
 * ID channel notifikasi Android.
 */
export const NOTIFICATION_CHANNEL_ID = 'noxarianet_transaksi';
export const MESSAGE_CHANNEL_ID = 'noxarianet_pesan';

// Load expo-notifications secara aman agar tidak crash di Expo Go
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
} catch {
  // Module native tidak tersedia (misal di Expo Go biasa)
}

let isInitialized = false;

export async function initNotifications() {
  if (isInitialized || !Notifications || Platform.OS === 'web') return;
  isInitialized = true;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'Status Transaksi & Saldo',
        importance: Notifications.AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4D1B8C',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync(MESSAGE_CHANNEL_ID, {
        name: 'Pesan & Informasi',
        importance: Notifications.AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: '#4D1B8C',
        sound: 'default',
      });
    }

    await Notifications.requestPermissionsAsync();
  } catch {
    // Graceful fallback jika permission request gagal atau tidak didukung
    isInitialized = false;
  }
}

/**
 * Minta izin notifikasi secara eksplisit (dipanggil dari halaman Akun).
 * Return `true` kalau granted, `false` kalau ditolak atau belum tersedia.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications || Platform.OS === 'web') return false;
  try {
    await initNotifications();
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Cek apakah izin notifikasi sudah granted.
 */
export async function getNotificationPermissionStatus(): Promise<boolean> {
  if (!Notifications || Platform.OS === 'web') return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

async function triggerSystemNotification(
  title: string,
  body: string,
  channelId: string = NOTIFICATION_CHANNEL_ID,
) {
  if (!Notifications || Platform.OS === 'web') return;
  try {
    await initNotifications();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        ...(Platform.OS === 'android' ? { channelId } : null),
      },
      trigger: null,
    });
  } catch {
    // Ignore fallback errors
  }
}

/**
 * Tampilkan notifikasi ke pengguna.
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

  // 1. Dispatch ke in-app announcement bar listeners
  for (const listener of listeners) {
    try {
      listener(notification);
    } catch {
      // Ignore listener error
    }
  }

  // 2. Dispatch ke Android Status Bar / Notification Center jika module tersedia
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

/**
 * Kirim notifikasi pesan umum (channel: noxarianet_pesan).
 * Muncul di system bar + in-app banner.
 */
export function notifyCustomMessage(title: string, body: string) {
  const notification: AppNotification = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    body,
    tone: 'info',
    icon: 'message-text-outline',
    timestamp: Date.now(),
  };

  for (const listener of listeners) {
    try {
      listener(notification);
    } catch {
      // Ignore listener error
    }
  }

  // Dispatch ke system notification via "pesan" channel
  void triggerSystemNotification(title, body, MESSAGE_CHANNEL_ID);
}
