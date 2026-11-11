import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'noxarianet.idempotency.';

export type OrderKey = {
  key: string;
  storageKey: string;
};

/** UUID v4. Math.random is fine here: the key only needs to be unique, not secret. */
export function makeUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/** Small, stable fingerprint hash so a retry with the same payload reuses its key. */
function hashFingerprint(fingerprint: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < fingerprint.length; i += 1) {
    hash ^= fingerprint.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

type StoredKey = {
  key: string;
  fingerprint: string;
  createdAt: number;
};

const MAX_AGE = 24 * 60 * 60 * 1000;

/**
 * Returns the same idempotency key for the same payload for up to 24 hours.
 * A network retry must reuse this key; a genuinely new order (different
 * payload) gets a new key.
 */
export async function getOrCreateOrderKey(
  fingerprint: string,
): Promise<OrderKey> {
  const storageKey = PREFIX + hashFingerprint(fingerprint);

  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) {
      const stored = JSON.parse(raw) as StoredKey;
      if (
        stored.fingerprint === fingerprint &&
        Date.now() - stored.createdAt < MAX_AGE
      ) {
        return { key: stored.key, storageKey };
      }
    }
  } catch {
    // fall through and create a new key
  }

  const stored: StoredKey = {
    key: makeUuid(),
    fingerprint,
    createdAt: Date.now(),
  };

  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(stored));
  } catch {
    // ignore
  }

  return { key: stored.key, storageKey };
}

export async function releaseOrderKey(storageKey: string) {
  try {
    await AsyncStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}

export function orderFingerprint(payload: unknown) {
  return JSON.stringify(payload);
}
