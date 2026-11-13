import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type {
  CachedPaymentInfo,
  CachedTopupInfo,
  UserProfile,
} from '@/api/types';

const TOKEN_KEY = 'noxarianet.session.token';
const USER_KEY = 'noxarianet.session.user';
const PENDING_REGISTER_KEY = 'noxarianet.pendingRegistration';
const INFO_MODAL_KEY = 'noxarianet.infoModal.dismissedAt';
const PAYMENT_PREFIX = 'noxarianet.payment.';
const TOPUP_PREFIX = 'noxarianet.topup.';
const PAYMENT_INDEX_KEY = 'noxarianet.payment.keys';
const TOPUP_INDEX_KEY = 'noxarianet.topup.keys';

async function secureGet(key: string) {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function secureSet(key: string, value: string) {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // ignore
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // A failed secure write must not crash the screen; the API remains usable
    // and the user can retry.
  }
}

async function secureDelete(key: string) {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// ── Session ───────────────────────────────────────────────────────────────

export async function saveSession(token: string, user: UserProfile) {
  await secureSet(TOKEN_KEY, token);
  await writeJson(USER_KEY, user);
}

export async function saveUserCache(user: UserProfile) {
  await writeJson(USER_KEY, user);
}

export async function loadSession(): Promise<{
  token: string;
  user: UserProfile | null;
} | null> {
  const token = await secureGet(TOKEN_KEY);
  if (!token) return null;
  const user = await readJson<UserProfile>(USER_KEY);
  return { token, user };
}

export async function clearSession() {
  await secureDelete(TOKEN_KEY);
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
  await clearSensitiveCaches();
}

// ── Pending registration ──────────────────────────────────────────────────

export type PendingRegistration = {
  email: string;
  maskedEmail: string;
  expiresAt: number;
  resendAt: number;
};

export async function savePendingRegistration(value: PendingRegistration) {
  await writeJson(PENDING_REGISTER_KEY, value);
}

export async function loadPendingRegistration() {
  return readJson<PendingRegistration>(PENDING_REGISTER_KEY);
}

export async function clearPendingRegistration() {
  try {
    await AsyncStorage.removeItem(PENDING_REGISTER_KEY);
  } catch {
    // ignore
  }
}

// ── Payment info (QR survives app restarts) ──────────────────────────────

async function readIndex(key: string) {
  return (await readJson<string[]>(key)) ?? [];
}

async function addToIndex(key: string, id: string) {
  const list = await readIndex(key);
  if (!list.includes(id)) await writeJson(key, [...list, id]);
}

async function removeFromIndex(key: string, id: string) {
  const list = await readIndex(key);
  if (list.includes(id)) {
    await writeJson(
      key,
      list.filter((item) => item !== id),
    );
  }
}

async function clearIndexed(key: string, prefix: string) {
  const list = await readIndex(key);
  await Promise.all(list.map((id) => secureDelete(prefix + id)));
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export async function clearSensitiveCaches() {
  await clearIndexed(PAYMENT_INDEX_KEY, PAYMENT_PREFIX);
  await clearIndexed(TOPUP_INDEX_KEY, TOPUP_PREFIX);
}

export async function savePaymentInfo(info: CachedPaymentInfo) {
  await secureSet(PAYMENT_PREFIX + info.orderId, JSON.stringify(info));
  await addToIndex(PAYMENT_INDEX_KEY, info.orderId);
}

export async function loadPaymentInfo(orderId: string) {
  const raw = await secureGet(PAYMENT_PREFIX + orderId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedPaymentInfo;
  } catch {
    return null;
  }
}

export async function clearPaymentInfo(orderId: string) {
  await secureDelete(PAYMENT_PREFIX + orderId);
  await removeFromIndex(PAYMENT_INDEX_KEY, orderId);
}

// ── Top-up info ───────────────────────────────────────────────────────────

export async function saveTopupInfo(info: CachedTopupInfo) {
  await secureSet(TOPUP_PREFIX + info.ref, JSON.stringify(info));
  await addToIndex(TOPUP_INDEX_KEY, info.ref);
}

export async function loadTopupInfo(ref: string) {
  const raw = await secureGet(TOPUP_PREFIX + ref);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedTopupInfo;
  } catch {
    return null;
  }
}

export async function clearTopupInfo(ref: string) {
  await secureDelete(TOPUP_PREFIX + ref);
  await removeFromIndex(TOPUP_INDEX_KEY, ref);
}

// ── Push token ────────────────────────────────────────────────────────────
// Token disimpan supaya saat logout kita bisa mendaftarkan "keluar" dari
// backend tanpa harus meminta token baru ke Expo.

const PUSH_TOKEN_KEY = 'noxarianet.pushToken';

export async function savePushToken(token: string | null) {
  if (!token) {
    try {
      await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    } catch {
      // ignore
    }
    return;
  }
  await writeJson(PUSH_TOKEN_KEY, token);
}

export async function loadPushToken(): Promise<string | null> {
  return readJson<string>(PUSH_TOKEN_KEY);
}

export async function clearPushToken() {
  try {
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

// ── Home info modal ───────────────────────────────────────────────────────

const INFO_MODAL_TTL = 24 * 60 * 60 * 1000;

export async function shouldShowInfoModal() {
  try {
    const raw = await AsyncStorage.getItem(INFO_MODAL_KEY);
    if (!raw) return true;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return true;
    return Date.now() - dismissedAt > INFO_MODAL_TTL;
  } catch {
    return true;
  }
}

export async function dismissInfoModal() {
  try {
    await AsyncStorage.setItem(INFO_MODAL_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}
