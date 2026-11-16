/**
 * Guard registrasi push token.
 *
 * Expo/FCM dapat memicu `addPushTokenListener` berkali-kali, dan
 * `getExpoPushToken()` pada sebagian perangkat juga memicu refresh token.
 * Tanpa guard, listener -> register -> listener berubah menjadi loop yang
 * menghabiskan limit `/api/mobile/devices`.
 *
 * Gate ini sengaja disimpan di module (bukan ref komponen) supaya bertahan
 * saat komponen di-remount, dan di-reset saat logout agar login berikutnya
 * tetap mendaftarkan ulang perangkat.
 */

const DEDUPE_MS = 60 * 1000;

let lastUserId: string | null = null;
let lastAt = 0;

export function shouldRegisterPushToken(userId: string) {
  const now = Date.now();

  if (lastUserId === userId && now - lastAt < DEDUPE_MS) {
    return false;
  }

  lastUserId = userId;
  lastAt = now;
  return true;
}

export function resetPushRegistrationGate() {
  lastUserId = null;
  lastAt = 0;
}
