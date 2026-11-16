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

/**
 * Membersihkan seluruh embel-embel vendor pihak ketiga (OkeConnect, Sekalipay, Digiflazz, Apigames, VIP, dll.)
 * dari teks notifikasi, baik dari title maupun body pesan.
 */
export function cleanNotificationVendorText(raw?: string | null): string {
  if (!raw) return '';
  return raw
    // 1. Bersihkan bentuk dalam kurung: (OkeConnect), (Sekalipay), (Digiflazz), (Apigames), [Sekalipay], {OkeConnect}, dll.
    .replace(/\s*[\(\[\{]\s*(oke\s*connect|sekali\s*pay|digi\s*flazz|api\s*games|vip)\s*[\)\]\}]/gi, '')
    // 2. Bersihkan bentuk pemisah: " - OkeConnect", " : Sekalipay", " | Digiflazz", dll.
    .replace(/\s*[-:|/]\s*(oke\s*connect|sekali\s*pay|digi\s*flazz|api\s*games|vip)\b/gi, '')
    // 3. Bersihkan bentuk awalan: "Sekalipay - ", "(Sekalipay) ", "OkeConnect: "
    .replace(/^[\(\[\{]?\s*(oke\s*connect|sekali\s*pay|digi\s*flazz|api\s*games|vip)\s*[\)\]\}]?\s*[-:|/]?\s*/gi, '')
    // 4. Bersihkan kata mandiri: "OkeConnect", "Sekalipay", "Digiflazz"
    .replace(/\b(oke\s*connect|sekali\s*pay|digi\s*flazz|api\s*games)\b/gi, '')
    // 5. Bersihkan sisa kurung kosong: "()", "[]"
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    // 6. Bersihkan pemisah gantung di akhir atau awal teks
    .replace(/\s*[-:|/]\s*$/, '')
    .replace(/^\s*[-:|/]\s*/, '')
    // 7. Rapikan spasi ganda
    .replace(/\s{2,}/g, ' ')
    .trim();
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

const recentNotificationHistory = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 6000; // 6 detik jendela anti-duplikasi

function isDuplicateNotification(title: string, body: string): boolean {
  const now = Date.now();
  // Bersihkan riwayat lama (> 20 detik)
  for (const [key, timestamp] of recentNotificationHistory.entries()) {
    if (now - timestamp > 20000) {
      recentNotificationHistory.delete(key);
    }
  }

  const key = `${title.toLowerCase().trim()}|${body.toLowerCase().trim()}`;
  const prevTime = recentNotificationHistory.get(key);
  if (prevTime && now - prevTime < DEDUPLICATION_WINDOW_MS) {
    return true; // Notifikasi kembar / duplikat, abaikan agar tidak double!
  }

  recentNotificationHistory.set(key, now);
  return false;
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
  let cleanTitle = cleanNotificationVendorText(options.title);
  let cleanBody = cleanNotificationVendorText(options.body);

  // Normalisasi judul "Transaksi Berhasil" & format sesuai permintaan user:
  // "TRANSAKSI BERHASIL DANA (OkeConnect)" -> Title: "Transaksi Berhasil", Body: "DANA"
  const successMatch = cleanTitle.match(/^transaksi\s+berhasil(?:\s*[:\-–|/]\s*|\s+)(.+)$/i);
  if (successMatch) {
    const extra = cleanNotificationVendorText(successMatch[1]);
    cleanTitle = 'Transaksi Berhasil';
    if (extra && (!cleanBody || cleanBody.toLowerCase().includes('berhasil'))) {
      cleanBody = extra;
    }
  } else if (/^transaksi\s+berhasil$/i.test(cleanTitle.trim())) {
    cleanTitle = 'Transaksi Berhasil';
  }

  // Normalisasi judul "Transaksi Gagal":
  const failMatch = cleanTitle.match(/^transaksi\s+gagal(?:\s*[:\-–|/]\s*|\s+)(.+)$/i);
  if (failMatch) {
    const extra = cleanNotificationVendorText(failMatch[1]);
    cleanTitle = 'Transaksi Gagal';
    if (extra && (!cleanBody || cleanBody.toLowerCase().includes('gagal'))) {
      cleanBody = `${extra} gagal diproses`;
    }
  } else if (/^transaksi\s+gagal$/i.test(cleanTitle.trim())) {
    cleanTitle = 'Transaksi Gagal';
  }

  // Jaminan anti-duplikasi: Jika pesan yang sama dipicu berulang (misal dari polling & push notif sekaligus),
  // cukup munculkan SATU kali saja agar tidak double.
  if (isDuplicateNotification(cleanTitle, cleanBody)) {
    return;
  }

  const notification: AppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: cleanTitle,
    body: cleanBody,
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
    void triggerSystemNotification(cleanTitle, cleanBody);
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
  const cleanProd = cleanNotificationVendorText(productName);
  const cleanVar = variantName ? cleanNotificationVendorText(variantName) : '';
  const item =
    cleanVar && cleanVar.toLowerCase() !== cleanProd.toLowerCase()
      ? cleanVar.toLowerCase().includes(cleanProd.toLowerCase())
        ? cleanVar
        : `${cleanProd} · ${cleanVar}`
      : cleanProd || 'Produk';

  showNotification({
    title: 'Transaksi Berhasil',
    body: `${item}`,
    tone: 'success',
    icon: 'check-circle-outline',
  });
}

/**
 * Notifikasi transaksi pesanan gagal / dibatalkan
 */
export function notifyOrderFailed(productName: string, variantName?: string) {
  const cleanProd = cleanNotificationVendorText(productName);
  const cleanVar = variantName ? cleanNotificationVendorText(variantName) : '';
  const item =
    cleanVar && cleanVar.toLowerCase() !== cleanProd.toLowerCase()
      ? cleanVar.toLowerCase().includes(cleanProd.toLowerCase())
        ? cleanVar
        : `${cleanProd} · ${cleanVar}`
      : cleanProd || 'Produk';

  showNotification({
    title: 'Transaksi Gagal',
    body: `${item} gagal diproses`,
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
