import { request } from './client';
import type { Departure, Direction } from './types';

export function fetchDepartures(
  stationId: number,
  direction: Direction,
  window = 90,
): Promise<Departure[]> {
  return request<Departure[]>(
    `/api/v1/stations/${stationId}/departures?direction=${direction}&window=${window}`,
  );
}
