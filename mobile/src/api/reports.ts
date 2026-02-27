import { request } from './client';
import type { CrowdLevel, TrainStatus } from './types';

export function fetchTrainStatus(trainNumber: string): Promise<TrainStatus> {
  return request<TrainStatus>(`/api/v1/trains/${trainNumber}/status`);
}

export function submitDelay(
  trainNumber: string,
  delayMinutes: number,
  deviceId: string,
): Promise<void> {
  return request('/api/v1/reports/delay', {
    method: 'POST',
    body: JSON.stringify({
      train_number: trainNumber,
      delay_minutes: delayMinutes,
      device_id: deviceId,
    }),
  });
}

export function submitCount(
  trainNumber: string,
  stationId: string,
  level: CrowdLevel,
  deviceId: string,
): Promise<void> {
  return request('/api/v1/reports/count', {
    method: 'POST',
    body: JSON.stringify({
      train_number: trainNumber,
      station_id: stationId,
      level,
      device_id: deviceId,
    }),
  });
}
