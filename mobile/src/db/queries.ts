import type { SQLiteDatabase } from 'expo-sqlite';
import type { Departure, Line, RouteStop, Station, TrainStop } from '../api/types';
import { stationsBetween } from './routes';

export async function listStations(db: SQLiteDatabase): Promise<Station[]> {
  return db.getAllAsync<Station>(
    `SELECT id, name, COALESCE(code, '') AS code FROM stations ORDER BY name`,
  );
}

export async function listLines(db: SQLiteDatabase): Promise<Line[]> {
  return db.getAllAsync<Line>(
    `SELECT id, name, short_name, type FROM lines ORDER BY id`,
  );
}

export async function getDepartures(
  db: SQLiteDatabase,
  stationId: number,
  destinationId?: number,
): Promise<Departure[]> {
  if (destinationId != null) {
    return db.getAllAsync<Departure>(
      `SELECT t.number, COALESCE(t.code, '') AS code, t.is_ac, t.is_fast, t.direction,
              l.short_name AS line, l.name AS line_name, s.departure, st.name AS station,
              COALESCE(t.origin, '') AS origin, COALESCE(t.destination, '') AS destination,
              COALESCE(s.platform, '') AS platform,
              COALESCE(t.runs_on, 'daily') AS runs_on, COALESCE(t.note, '') AS note
       FROM stops s
       JOIN trains t    ON s.train_id   = t.id
       JOIN stations st ON s.station_id = st.id
       JOIN lines l     ON t.line_id    = l.id
       WHERE s.station_id = ?
         AND EXISTS (
           SELECT 1 FROM stops s2
           WHERE s2.train_id = t.id
             AND s2.station_id = ?
             AND s2.stop_sequence > s.stop_sequence
         )
       ORDER BY s.departure`,
      [stationId, destinationId],
    );
  }

  return db.getAllAsync<Departure>(
    `SELECT t.number, COALESCE(t.code, '') AS code, t.is_ac, t.is_fast, t.direction,
            l.short_name AS line, l.name AS line_name, s.departure, st.name AS station,
            COALESCE(t.origin, '') AS origin, COALESCE(t.destination, '') AS destination,
            COALESCE(s.platform, '') AS platform,
            COALESCE(t.runs_on, 'daily') AS runs_on, COALESCE(t.note, '') AS note
     FROM stops s
     JOIN trains t    ON s.train_id   = t.id
     JOIN stations st ON s.station_id = st.id
     JOIN lines l     ON t.line_id    = l.id
     WHERE s.station_id = ?
     ORDER BY s.departure`,
    [stationId],
  );
}

export async function getTrainStops(
  db: SQLiteDatabase,
  trainNumber: string,
  line?: string,
): Promise<TrainStop[]> {
  if (line) {
    return db.getAllAsync<TrainStop>(
      `SELECT st.name AS station, s.departure, s.stop_sequence, COALESCE(s.platform, '') AS platform, COALESCE(s.side, '') AS side
       FROM stops s
       JOIN stations st ON s.station_id = st.id
       JOIN trains t ON s.train_id = t.id
       JOIN lines l ON t.line_id = l.id
       WHERE t.number = ? AND l.short_name = ?
       ORDER BY s.stop_sequence`,
      [trainNumber, line],
    );
  }

  return db.getAllAsync<TrainStop>(
    `SELECT st.name AS station, s.departure, s.stop_sequence, COALESCE(s.platform, '') AS platform, COALESCE(s.side, '') AS side
     FROM stops s
     JOIN stations st ON s.station_id = st.id
     JOIN trains t ON s.train_id = t.id
     JOIN lines l ON t.line_id = l.id
     WHERE t.number = ?
     ORDER BY s.stop_sequence`,
    [trainNumber],
  );
}

async function getDestination(
  db: SQLiteDatabase,
  trainNumber: string,
  line?: string,
): Promise<string> {
  const query = line
    ? `SELECT COALESCE(t.destination, '') AS destination FROM trains t JOIN lines l ON t.line_id = l.id WHERE t.number = ? AND l.short_name = ? LIMIT 1`
    : `SELECT COALESCE(t.destination, '') AS destination FROM trains t WHERE t.number = ? LIMIT 1`;
  const params = line ? [trainNumber, line] : [trainNumber];
  const row = await db.getFirstAsync<{ destination: string }>(query, params);
  return row?.destination ?? '';
}

export async function getTrainRoute(
  db: SQLiteDatabase,
  trainNumber: string,
  line?: string,
): Promise<RouteStop[]> {
  const stops = await getTrainStops(db, trainNumber, line);
  if (stops.length === 0) return [];

  // Truncate at declared destination
  const dest = await getDestination(db, trainNumber, line);
  let truncated = stops;
  if (dest) {
    const idx = stops.findIndex(s => s.station === dest);
    if (idx >= 0) {
      truncated = stops.slice(0, idx + 1);
    }
  }

  const route: RouteStop[] = [];
  let seq = 0;

  for (let i = 0; i < truncated.length; i++) {
    const s = truncated[i];
    route.push({
      station: s.station,
      departure: s.departure,
      stop_sequence: seq,
      platform: s.platform,
      side: s.side,
      is_stop: true,
    });
    seq++;

    // Insert pass-through stations between consecutive stops
    if (i < truncated.length - 1) {
      const between = stationsBetween(s.station, truncated[i + 1].station);
      if (between) {
        for (const name of between) {
          route.push({
            station: name,
            stop_sequence: seq,
            is_stop: false,
          });
          seq++;
        }
      }
    }
  }

  return route;
}
