import { Platform } from 'react-native';

const getAsyncStorage = async () => {
  const module = await import('@react-native-async-storage/async-storage');
  return module.default;
};

const isWeb = Platform.OS === 'web';

const getLocalStorage = () => {
  if (!isWeb) {
    return null;
  }

  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }

  return window.localStorage;
};

export async function getItem(key: string): Promise<string | null> {
  if (!key) {
    return null;
  }

  if (isWeb) {
    try {
      const storage = getLocalStorage();
      return storage?.getItem(key) ?? null;
    } catch (error) {
      console.error('storage.getItem web error', error);
      return null;
    }
  }

  try {
    const storage = await getAsyncStorage();
    return await storage.getItem(key);
  } catch (error) {
    console.error('storage.getItem native error', error);
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (!key) {
    return;
  }

  if (isWeb) {
    try {
      const storage = getLocalStorage();
      storage?.setItem(key, value);
      return;
    } catch (error) {
      console.error('storage.setItem web error', error);
      return;
    }
  }

  try {
    const storage = await getAsyncStorage();
    await storage.setItem(key, value);
  } catch (error) {
    console.error('storage.setItem native error', error);
  }
}

export async function removeItem(key: string): Promise<void> {
  if (!key) {
    return;
  }

  if (isWeb) {
    try {
      const storage = getLocalStorage();
      storage?.removeItem(key);
      return;
    } catch (error) {
      console.error('storage.removeItem web error', error);
      return;
    }
  }

  try {
    const storage = await getAsyncStorage();
    await storage.removeItem(key);
  } catch (error) {
    console.error('storage.removeItem native error', error);
  }
}


