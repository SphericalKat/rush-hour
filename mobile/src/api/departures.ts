import { request } from './client';
import type { Departure, Direction } from './types';

export function fetchDepartures(
  stationId: number,
  direction: Direction,
  destinationId?: number,
): Promise<Departure[]> {
  let url = `/api/v1/stations/${stationId}/departures?direction=${direction}`;
  if (destinationId != null) {
    url += `&destination=${destinationId}`;
  }
  return request<Departure[]>(url);
}
