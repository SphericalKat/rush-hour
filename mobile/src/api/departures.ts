import { request } from './client';
import type { Departure } from './types';

export function fetchDepartures(
  stationId: number,
  destinationId?: number,
): Promise<Departure[]> {
  let url = `/api/v1/stations/${stationId}/departures`;
  if (destinationId != null) {
    url += `?destination=${destinationId}`;
  }
  return request<Departure[]>(url);
}
