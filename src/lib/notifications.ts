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

// Safely attempt to require expo-notifications if installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
} catch {
  // expo-notifications not installed yet
}

let isInitialized = false;

export async function initNotifications() {
  if (isInitialized || !Notifications) return;
  isInitialized = true;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('noxarianet_transaksi', {
        name: 'Status Transaksi & Saldo',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E86B4F',
        sound: 'default',
      });
    }

    await Notifications.requestPermissionsAsync();
  } catch {
    // Graceful fallback if permission request fails or unsupported
  }
}

async function triggerSystemNotification(title: string, body: string) {
  if (!Notifications) return;
  try {
    await initNotifications();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'noxarianet_transaksi' } : null),
      },
      trigger: null,
    });
  } catch {
    // Ignore fallback errors
  }
}

export function showNotification(options: {
  title: string;
  body: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
  icon?: string;
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
  void triggerSystemNotification(options.title, options.body);
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

