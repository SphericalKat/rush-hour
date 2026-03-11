import { Platform } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
}

export interface LocationObject {
  coords: LocationCoords;
  timestamp: number;
}

export interface PermissionResponse {
  status: 'granted' | 'denied' | 'undetermined';
}

export interface LocationUpdateOptions {
  accuracy?: number;
  timeInterval?: number;
  distanceInterval?: number;
  deferredUpdatesInterval?: number;
  foregroundService?: {
    notificationTitle: string;
    notificationBody: string;
    notificationColor?: string;
  };
  showsBackgroundLocationIndicator?: boolean;
  pausesUpdatesAutomatically?: boolean;
}

export interface LocationProvider {
  requestForegroundPermissionsAsync(): Promise<PermissionResponse>;
  requestBackgroundPermissionsAsync(): Promise<PermissionResponse>;
  getLastKnownPositionAsync(): Promise<LocationObject | null>;
  startLocationUpdatesAsync(taskName: string, options: LocationUpdateOptions): Promise<void>;
  stopLocationUpdatesAsync(taskName: string): Promise<void>;
  hasStartedLocationUpdatesAsync(taskName: string): Promise<boolean>;
  Accuracy: { Balanced: number };
}

function createProvider(): LocationProvider {
  // On iOS or non-fdroid Android builds, use expo-location (GMS-backed)
  if (Platform.OS !== 'android' || process.env['EXPO_PUBLIC_DISTRIBUTION'] !== 'fdroid') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ExpoLocation = require('expo-location');
    return {
      requestForegroundPermissionsAsync: () => ExpoLocation.requestForegroundPermissionsAsync(),
      requestBackgroundPermissionsAsync: () => ExpoLocation.requestBackgroundPermissionsAsync(),
      getLastKnownPositionAsync: () => ExpoLocation.getLastKnownPositionAsync(),
      startLocationUpdatesAsync: (t: string, o: LocationUpdateOptions) =>
        ExpoLocation.startLocationUpdatesAsync(t, o),
      stopLocationUpdatesAsync: (t: string) => ExpoLocation.stopLocationUpdatesAsync(t),
      hasStartedLocationUpdatesAsync: (t: string) =>
        ExpoLocation.hasStartedLocationUpdatesAsync(t),
      Accuracy: ExpoLocation.Accuracy,
    };
  }

  // F-Droid build: use our GMS-free module
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const FdroidLocation = require('../../modules/fdroid-location/src');
  return {
    requestForegroundPermissionsAsync: () => FdroidLocation.requestForegroundPermissionsAsync(),
    requestBackgroundPermissionsAsync: () => FdroidLocation.requestBackgroundPermissionsAsync(),
    getLastKnownPositionAsync: () => FdroidLocation.getLastKnownPositionAsync(),
    startLocationUpdatesAsync: (t: string, o: LocationUpdateOptions) =>
      FdroidLocation.startLocationUpdatesAsync(t, o),
    stopLocationUpdatesAsync: (t: string) => FdroidLocation.stopLocationUpdatesAsync(t),
    hasStartedLocationUpdatesAsync: (t: string) =>
      FdroidLocation.hasStartedLocationUpdatesAsync(t),
    Accuracy: FdroidLocation.Accuracy,
  };
}

export const locationProvider = createProvider();
