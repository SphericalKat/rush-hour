import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { pushLocation } from '../api/live';
import { useDeviceId } from './useDeviceId';

interface LocationSharingState {
  sharing: boolean;
  lastMsg: string | null;
}

export function useLocationSharing(trainNumber: string) {
  const deviceId = useDeviceId();
  const [state, setState] = useState<LocationSharingState>({
    sharing: false,
    lastMsg: null,
  });
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const sharingRef = useRef(false);

  const stopSharing = useCallback(async () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    sharingRef.current = false;
    setState({ sharing: false, lastMsg: null });

    if (deviceId) {
      try {
        await pushLocation(trainNumber, 0, 0, deviceId, 'stop');
      } catch {
        // best-effort cleanup
      }
    }
  }, [trainNumber, deviceId]);

  const startSharing = useCallback(async () => {
    if (!deviceId) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission',
        'Location access is needed to share your position with other commuters.',
      );
      return;
    }

    sharingRef.current = true;
    setState(s => ({ ...s, sharing: true }));

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 15000,
        distanceInterval: 50,
      },
      async (loc) => {
        if (!sharingRef.current) return;
        try {
          const res = await pushLocation(
            trainNumber,
            loc.coords.latitude,
            loc.coords.longitude,
            deviceId,
            'update',
          );
          if (res.ok && res.msg) {
            setState(s => ({ ...s, lastMsg: res.msg! }));
          }
        } catch {
          // network hiccup, will retry on next GPS update
        }
      },
    );

    subscriptionRef.current = sub;
  }, [trainNumber, deviceId]);

  const toggle = useCallback(() => {
    if (sharingRef.current) {
      stopSharing();
    } else {
      startSharing();
    }
  }, [startSharing, stopSharing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sharingRef.current) {
        subscriptionRef.current?.remove();
        subscriptionRef.current = null;
        sharingRef.current = false;
        if (deviceId) {
          pushLocation(trainNumber, 0, 0, deviceId, 'stop').catch(() => {});
        }
      }
    };
  }, [trainNumber, deviceId]);

  return { ...state, toggle };
}
