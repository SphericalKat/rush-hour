export interface Line {
  id: number;
  name: string;
  short_name: string;
  type: string;
}

export interface Station {
  id: number;
  name: string;
  code: string;
}

export interface Departure {
  number: string;
  code: string;
  is_ac: boolean;
  is_fast: boolean;
  direction: string;
  line: string;
  line_name: string;
  departure: number; // minutes from midnight
  station: string;
  origin: string;
  destination: string;
}

export interface TrainStatus {
  train_number: string;
  delay_minutes: number;
  reporter_count: number;
}

export interface TimetableVersion {
  hash: string;
  updated_at: string;
}

export type Direction = 'down' | 'up';
export type CrowdLevel = 'low' | 'moderate' | 'crowded';

export interface WSMessage {
  type: 'delay' | 'count';
  train: string;
  delay_minutes?: number;
  level?: CrowdLevel;
}
