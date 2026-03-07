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
