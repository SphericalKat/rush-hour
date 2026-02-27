import { request } from './client';
import type { TimetableVersion } from './types';

export const fetchTimetableVersion = () =>
  request<TimetableVersion>('/api/v1/timetable/version');
