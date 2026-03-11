import { requireNativeModule } from 'expo-modules-core';

const FdroidLocation = requireNativeModule('FdroidLocation');

export interface LocationCoords {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  speed: number;
  heading: number;
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

export async function requestForegroundPermissionsAsync(): Promise<PermissionResponse> {
  return FdroidLocation.requestForegroundPermissionsAsync();
}

export async function requestBackgroundPermissionsAsync(): Promise<PermissionResponse> {
  return FdroidLocation.requestBackgroundPermissionsAsync();
}

export async function getLastKnownPositionAsync(): Promise<LocationObject | null> {
  return FdroidLocation.getLastKnownPositionAsync();
}

export async function startLocationUpdatesAsync(
  taskName: string,
  options: LocationUpdateOptions,
): Promise<void> {
  return FdroidLocation.startLocationUpdatesAsync(taskName, options);
}

export async function stopLocationUpdatesAsync(taskName: string): Promise<void> {
  return FdroidLocation.stopLocationUpdatesAsync(taskName);
}

export async function hasStartedLocationUpdatesAsync(taskName: string): Promise<boolean> {
  return FdroidLocation.hasStartedLocationUpdatesAsync(taskName);
}

export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
} as const;
