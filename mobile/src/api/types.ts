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
  platform: string;
  runs_on: string;
  note: string;
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

// Live tracking from crowdsourced GPS data
export type LiveTrainMap = Record<string, string>; // train_number → status text

export type LiveTrainPosition = {
  live: false;
} | {
  pc: number;       // people count sharing
  t: number;        // timestamp (unix ms)
  mv: boolean;      // has moved (accuracy indicator)
  position: {
    msg: string;     // "At DADAR" or "Between DADAR - THANE"
    st: string;      // status type: 0=at, 1=approaching, 2=between, 3=departed
    a: boolean;      // is accurate
    s: string;       // station name
    d: number;       // direction
  };
}

export interface TrainStop {
  station: string;
  departure: number;  // minutes from midnight
  stop_sequence: number;
  platform: string;
  side: string;       // "L" or "R" — which side doors open
}

export type Direction = 'down' | 'up';
export type CrowdLevel = 'low' | 'moderate' | 'crowded';

export interface WSMessage {
  type: 'delay' | 'count';
  train: string;
  delay_minutes?: number;
  level?: CrowdLevel;
}
