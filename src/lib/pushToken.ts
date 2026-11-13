import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { initNotifications } from '@/lib/notifications';
import { loadPushToken, savePushToken } from '@/lib/storage';

export type PushTokenFailure =
  | 'unsupported'
  | 'permission_denied'
  | 'no_project_id'
  | 'error';

export type PushTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: PushTokenFailure; message?: string };

/**
 * projectId milik proyek EAS — dipakai Expo untuk mengaitkan push token
 * dengan aplikasi ini. Sudah ada di app.json (extra.eas.projectId).
 */
function resolveProjectId(): string | null {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

/**
 * Ambil Expo Push Token untuk perangkat ini.
 *
 * Urutannya penting: channel notifikasi harus dibuat DULU sebelum token diminta
 * (syarat Android 13+), dan permission harus sudah granted. Keduanya ditangani
 * oleh initNotifications().
 */
export async function getExpoPushToken(): Promise<PushTokenResult> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return { ok: false, reason: 'unsupported' };
  }

  try {
    // Membuat channel Android + meminta izin notifikasi.
    await initNotifications();

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      return { ok: false, reason: 'permission_denied' };
    }

    const projectId = resolveProjectId();
    if (!projectId) {
      return { ok: false, reason: 'no_project_id' };
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;

    await savePushToken(token);
    return { ok: true, token };
  } catch (error) {
    return {
      ok: false,
      reason: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Ambil token tersimpan, atau peroleh yang baru bila belum ada.
 */
export async function resolvePushToken(): Promise<string | null> {
  const cached = await loadPushToken();
  if (cached) return cached;

  const result = await getExpoPushToken();
  return result.ok ? result.token : null;
}
