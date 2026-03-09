import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { pushLocation } from '../api/live';
import { useDeviceId } from './useDeviceId';

const TASK_NAME = 'rush-hour-location-sharing';
const STORE_TRAIN = 'rush_hour_sharing_train';
const STORE_DEVICE = 'rush_hour_device_id';

// Background task, defined at module level as required by expo-task-manager.
TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.warn('[LocationTask] error:', error.message);
    return;
  }

  try {
    const locations = (data as any)?.locations as Location.LocationObject[] | undefined;
    if (!locations?.length) return;

    const trainNumber = await SecureStore.getItemAsync(STORE_TRAIN);
    const deviceId = await SecureStore.getItemAsync(STORE_DEVICE);
    if (!trainNumber || !deviceId) return;

    const loc = locations[locations.length - 1];
    await pushLocation(
      trainNumber,
      loc.coords.latitude,
      loc.coords.longitude,
      deviceId,
      'update',
    );
  } catch {
    // network error, will retry on next location update
  }
});

interface LocationSharingState {
  sharing: boolean;
  sharingTrain: string | null;
  lastMsg: string | null;
  toggling: boolean;
}

async function isTaskRunning(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  } catch {
    return false;
  }
}

async function getActiveTrain(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORE_TRAIN);
  } catch {
    return null;
  }
}

// Stop any stale task from a previous app session.
(async () => {
  try {
    const train = await getActiveTrain();
    if (!train && await isTaskRunning()) {
      await Location.stopLocationUpdatesAsync(TASK_NAME);
    }
  } catch {
    // ignore
  }
})();

export function useLocationSharing(trainNumber: string, enabled = true) {
  const deviceId = useDeviceId();
  const [state, setState] = useState<LocationSharingState>({
    sharing: false,
    sharingTrain: null,
    lastMsg: null,
    toggling: false,
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if we're already sharing for THIS train
  useEffect(() => {
    if (!enabled) return;
    (async () => {
      const running = await isTaskRunning();
      const activeTrain = await getActiveTrain();
      if (running && activeTrain === trainNumber) {
        setState(s => ({ ...s, sharing: true, sharingTrain: trainNumber }));
      }
    })();
  }, [trainNumber, enabled]);

  // Foreground polling, only runs for the train we're sharing
  useEffect(() => {
    if (!state.sharing || state.sharingTrain !== trainNumber || !deviceId) return;

    let active = true;
    const poll = async () => {
      if (!active) return;
      try {
        const loc = await Location.getLastKnownPositionAsync();
        if (!loc || !active) return;
        const res = await pushLocation(
          trainNumber,
          loc.coords.latitude,
          loc.coords.longitude,
          deviceId,
          'update',
        );
        if (res.ok && res.msg && active) {
          setState(s => ({ ...s, lastMsg: res.msg! }));
        }
      } catch {
        // ignore
      }
    };

    poll();
    pollRef.current = setInterval(poll, 15000);

    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [state.sharing, state.sharingTrain, trainNumber, deviceId]);

  const startSharing = useCallback(async () => {
    if (!deviceId) {
      Alert.alert('Please wait', 'Initializing…');
      return;
    }

    setState(s => ({ ...s, toggling: true }));

    // If already sharing for a different train, stop that first
    const activeTrain = await getActiveTrain();
    if (activeTrain && activeTrain !== trainNumber && await isTaskRunning()) {
      await Location.stopLocationUpdatesAsync(TASK_NAME).catch(() => {});
      if (deviceId) {
        pushLocation(activeTrain, 0, 0, deviceId, 'stop').catch(() => {});
      }
    }

    try {
      const { status: fg } = await Location.requestForegroundPermissionsAsync();
      if (fg !== 'granted') {
        setState(s => ({ ...s, toggling: false }));
        Alert.alert(
          'Location Required',
          'Location access is needed to share your position with other commuters.',
        );
        return;
      }

      if (Platform.OS === 'android') {
        const { status: bg } = await Location.requestBackgroundPermissionsAsync();
        if (bg !== 'granted') {
          setState(s => ({ ...s, toggling: false }));
          Alert.alert(
            'Background Location Required',
            'Please select "Allow all the time" so tracking works when your phone is in your pocket. Tap Start again after granting.',
          );
          return;
        }
      }

      await SecureStore.setItemAsync(STORE_TRAIN, trainNumber);

      await Location.startLocationUpdatesAsync(TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 15000,
        distanceInterval: 50,
        deferredUpdatesInterval: 15000,
        ...(Platform.OS === 'android' && {
          foregroundService: {
            notificationTitle: 'Rush Hour',
            notificationBody: 'Sharing your live train position',
            notificationColor: '#0D9668',
          },
        }),
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: false,
      });

      setState({ sharing: true, sharingTrain: trainNumber, lastMsg: null, toggling: false });
    } catch (e: any) {
      console.error('[LocationSharing] start error:', e);
      SecureStore.deleteItemAsync(STORE_TRAIN).catch(() => {});
      setState(s => ({ ...s, toggling: false }));
      Alert.alert('Could not start sharing', e?.message ?? String(e));
    }
  }, [trainNumber, deviceId]);

  const stopSharing = useCallback(async () => {
    setState(s => ({ ...s, toggling: true }));
    try {
      if (await isTaskRunning()) {
        await Location.stopLocationUpdatesAsync(TASK_NAME);
      }
    } catch {
      // already stopped
    }

    SecureStore.deleteItemAsync(STORE_TRAIN).catch(() => {});
    setState({ sharing: false, sharingTrain: null, lastMsg: null, toggling: false });

    if (deviceId) {
      pushLocation(trainNumber, 0, 0, deviceId, 'stop').catch(() => {});
    }
  }, [trainNumber, deviceId]);

  const toggle = useCallback(() => {
    if (state.sharing && state.sharingTrain === trainNumber) {
      stopSharing();
    } else {
      startSharing();
    }
  }, [state.sharing, state.sharingTrain, trainNumber, startSharing, stopSharing]);

  // Only expose sharing=true if it's for THIS train
  const isThisTrain = state.sharing && state.sharingTrain === trainNumber;

  return {
    sharing: isThisTrain,
    lastMsg: isThisTrain ? state.lastMsg : null,
    toggling: state.toggling,
    toggle,
  };
}
