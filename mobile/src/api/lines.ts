import { request } from './client';
import type { Line, Station } from './types';

export const fetchLines = () => request<Line[]>('/api/v1/lines');
export const fetchStations = () => request<Station[]>('/api/v1/stations');
