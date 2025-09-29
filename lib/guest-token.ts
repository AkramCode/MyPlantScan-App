import { Platform } from 'react-native';

const STORAGE_KEY = 'myplantscan_guest_token';

const generateToken = () => {
  try {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
  } catch (_error) {
    // Fallback to manual token generation below
  }
  const random = Math.random().toString(36).slice(2, 10);
  return `guest_${Date.now().toString(36)}_${random}`;
};

export async function ensureGuestToken(): Promise<string> {
  if (Platform.OS === 'web') {
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      if (existing && existing.trim().length > 0) {
        return existing;
      }
      const token = generateToken();
      window.localStorage.setItem(STORAGE_KEY, token);
      return token;
    } catch (_error) {
      // Fall back to in-memory token
      return generateToken();
    }
  }

  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const existing = await AsyncStorage.default.getItem(STORAGE_KEY);
    if (existing && existing.trim().length > 0) {
      return existing;
    }
    const token = generateToken();
    await AsyncStorage.default.setItem(STORAGE_KEY, token);
    return token;
  } catch (_error) {
    return generateToken();
  }
}

export async function clearGuestToken(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (_error) {
      // ignore
    }
    return;
  }

  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.removeItem(STORAGE_KEY);
  } catch (_error) {
    // ignore
  }
}