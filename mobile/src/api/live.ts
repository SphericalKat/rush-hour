import { request } from './client';
import type { LiveTrainMap, LiveTrainPosition, TrainStop } from './types';

export function fetchAllLiveTrains(): Promise<LiveTrainMap> {
  return request<LiveTrainMap>('/api/v1/live/trains');
}

export function fetchLiveTrainInfo(trainNumber: string): Promise<LiveTrainPosition> {
  return request<LiveTrainPosition>(`/api/v1/trains/${trainNumber}/live`);
}

export function fetchTrainStops(trainNumber: string): Promise<TrainStop[]> {
  return request<TrainStop[]>(`/api/v1/trains/${trainNumber}/stops`);
}

export interface PushLocationResponse {
  ok: boolean;
  station?: string;
  status?: string;
  msg?: string;
  accurate?: boolean;
}

export function pushLocation(
  trainNumber: string,
  lat: number,
  lng: number,
  deviceId: string,
  action: 'start' | 'update' | 'stop',
): Promise<PushLocationResponse> {
  return request<PushLocationResponse>(`/api/v1/trains/${trainNumber}/location`, {
    method: 'POST',
    body: JSON.stringify({ lat, lng, device_id: deviceId, action }),
  });
}
