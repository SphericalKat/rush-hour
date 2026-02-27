import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const KEY = 'rush_hour_device_id';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// SecureStore is not available on web; fall back to a module-level singleton.
let webId: string | null = null;

export function useDeviceId(): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (!webId) webId = generateId();
      setId(webId);
      return;
    }
    SecureStore.getItemAsync(KEY).then(async (stored) => {
      if (stored) {
        setId(stored);
      } else {
        const fresh = generateId();
        await SecureStore.setItemAsync(KEY, fresh);
        setId(fresh);
      }
    });
  }, []);

  return id;
}
